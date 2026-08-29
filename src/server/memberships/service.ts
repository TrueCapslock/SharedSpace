import { and, eq } from 'drizzle-orm'
import { db } from '#/server/db'
import { roles, users, workspaceMemberships } from '#/server/db/schema'
import {
  AppError,
  getMyWorkspaceRoleKey,
  requireWorkspacePermission,
} from '#/server/authorization/authorize'
import type { RoleKey } from '#/server/authorization/permissions'
import { getWorkspaceRoleByKey } from '#/server/roles/service'
import { recordActivityEvent } from '#/server/activity/service'

export async function listMembers(workspaceId: string) {
  await requireWorkspacePermission(workspaceId, 'members:read')

  return db
    .select({
      id: workspaceMemberships.id,
      userId: workspaceMemberships.userId,
      displayName: users.displayName,
      email: users.email,
      status: workspaceMemberships.status,
      roleKey: roles.key,
      joinedAt: workspaceMemberships.createdAt,
    })
    .from(workspaceMemberships)
    .innerJoin(users, eq(users.id, workspaceMemberships.userId))
    .leftJoin(roles, eq(roles.id, workspaceMemberships.roleId))
    .where(eq(workspaceMemberships.workspaceId, workspaceId))
}

export async function listWorkspaceRoles(workspaceId: string) {
  await requireWorkspacePermission(workspaceId, 'roles:manage')
  return db.select().from(roles).where(eq(roles.workspaceId, workspaceId))
}

async function getRoleIdInWorkspace(workspaceId: string, roleKey: RoleKey) {
  const role = await getWorkspaceRoleByKey(workspaceId, roleKey)
  if (!role) {
    throw new AppError('NOT_FOUND', 'Role not found in this workspace')
  }
  return role.id
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  roleKey: RoleKey,
) {
  const actor = await requireWorkspacePermission(workspaceId, 'roles:manage')

  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, workspaceId),
      eq(workspaceMemberships.userId, userId),
    ),
  })
  if (!membership) {
    throw new AppError('NOT_FOUND', 'Member not found')
  }

  const targetRole = await getMyWorkspaceRoleKeyFor(userId, workspaceId)
  const actorRole = await getMyWorkspaceRoleKey(workspaceId)

  // Owners may only be managed by owners (and cannot demote the last owner).
  if (targetRole === 'owner' && actorRole !== 'owner') {
    throw new AppError('FORBIDDEN', 'Only owners can change owner roles')
  }

  const roleId = await getRoleIdInWorkspace(workspaceId, roleKey)

  await db
    .update(workspaceMemberships)
    .set({ roleId })
    .where(eq(workspaceMemberships.id, membership.id))

  await recordActivityEvent({
    workspaceId,
    actorId: actor.id,
    action: 'member.role_changed',
    entityType: 'membership',
    entityId: membership.id,
    metadata: { roleKey },
  })
}

export async function removeMember(workspaceId: string, userId: string) {
  const actor = await requireWorkspacePermission(workspaceId, 'members:remove')

  if (actor.id === userId) {
    throw new AppError('VALIDATION', 'You cannot remove yourself this way')
  }

  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, workspaceId),
      eq(workspaceMemberships.userId, userId),
    ),
  })
  if (!membership) {
    throw new AppError('NOT_FOUND', 'Member not found')
  }

  const actorRole = await getMyWorkspaceRoleKey(workspaceId)
  const targetRole = await getMyWorkspaceRoleKeyFor(userId, workspaceId)
  if (targetRole === 'owner' && actorRole !== 'owner') {
    throw new AppError('FORBIDDEN', 'Only owners can remove owners')
  }

  await db
    .delete(workspaceMemberships)
    .where(eq(workspaceMemberships.id, membership.id))

  await recordActivityEvent({
    workspaceId,
    actorId: actor.id,
    action: 'member.removed',
    entityType: 'membership',
    entityId: membership.id,
  })
}

async function getMyWorkspaceRoleKeyFor(userId: string, workspaceId: string) {
  const row = await db
    .select({ key: roles.key })
    .from(workspaceMemberships)
    .innerJoin(roles, eq(roles.id, workspaceMemberships.roleId))
    .where(
      and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.userId, userId),
      ),
    )
    .limit(1)
  return row[0]?.key ?? null
}

export type MemberSummary = Awaited<ReturnType<typeof listMembers>>[number]
