import { clerkClient } from '@clerk/tanstack-react-start/server'
import { and, eq } from 'drizzle-orm'
import { env } from '#/env'

import { db } from '#/server/db'
import { users } from '#/server/db/schema'
import { getAuthInfo } from '#/server/auth'

export type AppUser = typeof users.$inferSelect

export type UserPreferences = {
  theme?: 'light' | 'dark' | 'system'
}

/**
 * Upsert an application user from a Clerk identity.
 *
 * The app owns profile data; Clerk is only an identity provider. This is a
 * graceful sync used until a real webhook keeps registrations in step.
 */
export async function getOrCreateUser(params: {
  clerkId: string
  email?: string | null
  displayName: string
}): Promise<AppUser> {
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, params.clerkId),
  })

  if (existing) {
    const displayNameChanged =
      existing.displayName !== params.displayName ||
      existing.email !== params.email

    if (displayNameChanged) {
      return db
        .update(users)
        .set({ displayName: params.displayName, email: params.email ?? null })
        .where(eq(users.id, existing.id))
        .returning()
        .then((rows) => rows[0])
    }
    return existing
  }

  const [created] = await db
    .insert(users)
    .values({
      clerkId: params.clerkId,
      displayName: params.displayName,
      email: params.email ?? null,
    })
    .returning()

  return created
}

/**
 * The application user for the current Clerk-authenticated request, or null.
 * Callers that require authentication should use {@link requireUser}.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const auth = await getAuthInfo()
  if (!auth.userId) return null

  let email: string | undefined
  let displayName = 'SharedSpace User'

  if (env.CLERK_SECRET_KEY) {
    try {
      const clerkUser = await clerkClient({
        secretKey: env.CLERK_SECRET_KEY,
      }).users.getUser(auth.userId)
      email = clerkUser.emailAddresses[0]?.emailAddress
      displayName =
        clerkUser.firstName || clerkUser.username
          ? [clerkUser.firstName, clerkUser.lastName]
              .filter(Boolean)
              .join(' ')
              .trim() || displayName
          : displayName
    } catch {
      // Graceful fallback when Clerk profile lookup fails.
    }
  }

  return getOrCreateUser({
    clerkId: auth.userId,
    email,
    displayName,
  })
}

/** Get the current application user or throw when unauthenticated. */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthenticated')
  }
  return user
}

export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id)))
    .limit(1)
  return user ?? null
}

/**
 * Update the current user's own profile. Only the provided fields are changed
 * (partial update). Display name changes are also pushed to Clerk so the
 * identity stays in sync for the next {@link getOrCreateUser} pass.
 */
export async function updateUserProfile(input: {
  displayName?: string
  preferences?: UserPreferences
}): Promise<AppUser> {
  const user = await requireUser()

  const set: Partial<typeof users.$inferInsert> = {}
  if (input.displayName !== undefined && input.displayName.trim()) {
    set.displayName = input.displayName.trim()
  }
  if (input.preferences !== undefined) {
    set.preferences = {
      ...(user.preferences ?? {}),
      ...input.preferences,
    }
  }

  if (Object.keys(set).length === 0) {
    return user
  }

  const [updated] = await db
    .update(users)
    .set({ ...set, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning()

  // Push name changes to Clerk so the identity provider stays in sync.
  if (set.displayName && env.CLERK_SECRET_KEY && user.clerkId) {
    try {
      await clerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.updateUser(
        user.clerkId,
        { firstName: set.displayName },
      )
    } catch {
      // Non-fatal: the next Clerk sync will reconcile the name.
    }
  }

  return updated
}
