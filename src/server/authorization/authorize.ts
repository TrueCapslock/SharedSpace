import { and, eq } from 'drizzle-orm'
import { db } from '#/server/db'
import {
  permissions,
  rolePermissions,
  roles,
  workspaceMemberships,
} from '#/server/db/schema'
import { requireUser } from '#/server/users/service'
import type { Permission } from './permissions'

export type ErrorCode =
  'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION'

export class AppError extends Error {
  code: ErrorCode
  constructor(code: ErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'AppError'
  }
}

/** The permission keys a user holds within a single workspace. */
export async function getUserWorkspacePermissions(
  workspaceId: string,
  userId: string,
): Promise<Set<Permission>> {
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, workspaceId),
      eq(workspaceMemberships.userId, userId),
      eq(workspaceMemberships.status, 'active'),
    ),
  })

  if (!membership?.roleId) return new Set()

  // Inner-join on roles.workspaceId guarantees the role actually belongs to
  // this workspace, preventing cross-tenant role references.
  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(roles, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(rolePermissions.roleId, membership.roleId),
        eq(roles.workspaceId, workspaceId),
      ),
    )

  return new Set(rows.map((r) => r.key as Permission))
}

export async function getActiveMembership(workspaceId: string, userId: string) {
  return db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, workspaceId),
      eq(workspaceMemberships.userId, userId),
      eq(workspaceMemberships.status, 'active'),
    ),
  })
}

/**
 * Require an authenticated user with the given permission within a workspace.
 * Returns the app user on success, otherwise throws an {AppError}.
 */
export async function requireWorkspacePermission(
  workspaceId: string,
  permission: Permission,
) {
  const user = await requireUser()
  const userPermissions = await getUserWorkspacePermissions(
    workspaceId,
    user.id,
  )

  if (!userPermissions.has(permission)) {
    throw new AppError('FORBIDDEN', 'You do not have access to this workspace')
  }

  return user
}

/**
 * Require an active membership in a workspace (no specific permission), e.g.
 * for reading available workspaces or redirecting.
 */
export async function requireWorkspaceMembership(workspaceId: string) {
  const user = await requireUser()
  const membership = await getActiveMembership(workspaceId, user.id)
  if (!membership) {
    throw new AppError('FORBIDDEN', 'Not a member of this workspace')
  }
  return user
}

/**
 * The permissions the current user actually holds within a workspace — used
 * to drive conditional UI. Returns a plain array for easy serialization.
 */
export async function getMyWorkspacePermissions(
  workspaceId: string,
): Promise<Permission[]> {
  const user = await requireUser()
  const userPermissions = await getUserWorkspacePermissions(
    workspaceId,
    user.id,
  )
  return Array.from(userPermissions)
}

/** The role key the current user holds within a workspace, if any. */
export async function getMyWorkspaceRoleKey(
  workspaceId: string,
): Promise<string | null> {
  const user = await requireUser()
  const membership = await getActiveMembership(workspaceId, user.id)
  if (!membership?.roleId) return null

  const [role] = await db
    .select({ key: roles.key })
    .from(roles)
    .where(
      and(eq(roles.id, membership.roleId), eq(roles.workspaceId, workspaceId)),
    )
    .limit(1)

  return role?.key ?? null
}
