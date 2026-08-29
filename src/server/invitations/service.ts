import { randomBytes } from 'node:crypto'
import { and, eq, lt } from 'drizzle-orm'
import { db } from '#/server/db'
import { invitations, workspaceMemberships } from '#/server/db/schema'
import {
  AppError,
  requireWorkspacePermission,
} from '#/server/authorization/authorize'
import { requireUser } from '#/server/users/service'
import type { RoleKey } from '#/server/authorization/permissions'
import { getWorkspaceRoleByKey } from '#/server/roles/service'
import { recordActivityEvent } from '#/server/activity/service'

function generateToken(): string {
  return randomBytes(24).toString('hex')
}

function nowPlusDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

export async function inviteMember(
  workspaceId: string,
  input: { email: string; roleKey?: RoleKey },
) {
  const actor = await requireWorkspacePermission(
    workspaceId,
    'invitations:create',
  )

  const email = input.email.trim().toLowerCase()
  const roleKey = input.roleKey ?? 'member'
  const role = await getWorkspaceRoleByKey(workspaceId, roleKey)
  if (!role) {
    throw new AppError('NOT_FOUND', 'Role not found in this workspace')
  }

  const [invitation] = await db
    .insert(invitations)
    .values({
      workspaceId,
      email,
      roleId: role.id,
      token: generateToken(),
      invitedById: actor.id,
      expiresAt: nowPlusDays(7),
    })
    .returning()

  await recordActivityEvent({
    workspaceId,
    actorId: actor.id,
    action: 'invitation.created',
    entityType: 'invitation',
    entityId: invitation.id,
    metadata: { email },
  })

  return invitation
}

export async function listInvitations(workspaceId: string) {
  await requireWorkspacePermission(workspaceId, 'invitations:create')
  return db
    .select()
    .from(invitations)
    .where(eq(invitations.workspaceId, workspaceId))
}

export async function revokeInvitation(
  workspaceId: string,
  invitationId: string,
) {
  const actor = await requireWorkspacePermission(
    workspaceId,
    'invitations:revoke',
  )

  const [result] = await db
    .update(invitations)
    .set({ status: 'revoked' })
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.workspaceId, workspaceId),
      ),
    )
    .returning()

  if (!result) {
    throw new AppError('NOT_FOUND', 'Invitation not found')
  }

  await recordActivityEvent({
    workspaceId,
    actorId: actor.id,
    action: 'invitation.revoked',
    entityType: 'invitation',
    entityId: invitationId,
  })

  return result
}

/**
 * Redeem an invitation token for the current authenticated user. Creates an
 * active membership in the invited workspace.
 */
export async function acceptInvitation(token: string) {
  const user = await requireUser()

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  })

  if (!invitation) {
    throw new AppError('NOT_FOUND', 'Invitation not found')
  }
  if (invitation.status !== 'pending') {
    throw new AppError('CONFLICT', 'Invitation is no longer active')
  }
  if (invitation.expiresAt < new Date()) {
    throw new AppError('CONFLICT', 'Invitation has expired')
  }
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    throw new AppError('FORBIDDEN', 'Invitation is for a different email')
  }

  // Reject expired rows defensively during read.
  await db
    .update(invitations)
    .set({ status: 'expired' })
    .where(
      and(
        eq(invitations.id, invitation.id),
        lt(invitations.expiresAt, new Date()),
      ),
    )

  const [membership] = await db
    .insert(workspaceMemberships)
    .values({
      workspaceId: invitation.workspaceId,
      userId: user.id,
      roleId: invitation.roleId,
      status: 'active',
    })
    .onConflictDoNothing({
      target: [workspaceMemberships.userId, workspaceMemberships.workspaceId],
    })
    .returning()

  await db
    .update(invitations)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(invitations.id, invitation.id))

  void membership

  await recordActivityEvent({
    workspaceId: invitation.workspaceId,
    actorId: user.id,
    action: 'invitation.accepted',
    entityType: 'invitation',
    entityId: invitation.id,
  })

  return invitation.workspaceId
}
