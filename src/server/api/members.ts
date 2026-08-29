import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  listMembers,
  listWorkspaceRoles,
  removeMember,
  updateMemberRole,
} from '#/server/memberships/service'
import {
  acceptInvitation,
  inviteMember,
  listInvitations,
  revokeInvitation,
} from '#/server/invitations/service'

const workspaceIdSchema = z.object({ workspaceId: z.string().uuid() })

export const getMembers = createServerFn({ method: 'GET' })
  .validator(workspaceIdSchema)
  .handler(async ({ data }) => listMembers(data.workspaceId))

export const getRoles = createServerFn({ method: 'GET' })
  .validator(workspaceIdSchema)
  .handler(async ({ data }) => listWorkspaceRoles(data.workspaceId))

export const updateMemberRoleFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      userId: z.string().uuid(),
      roleKey: z.enum(['owner', 'admin', 'member', 'viewer']),
    }),
  )
  .handler(async ({ data }) =>
    updateMemberRole(data.workspaceId, data.userId, data.roleKey),
  )

export const removeMemberFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ workspaceId: z.string().uuid(), userId: z.string().uuid() }),
  )
  .handler(async ({ data }) => removeMember(data.workspaceId, data.userId))

export const inviteMemberFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      email: z.string().trim().email(),
      roleKey: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
    }),
  )
  .handler(async ({ data }) =>
    inviteMember(data.workspaceId, {
      email: data.email,
      roleKey: data.roleKey,
    }),
  )

export const getInvitations = createServerFn({ method: 'GET' })
  .validator(workspaceIdSchema)
  .handler(async ({ data }) => listInvitations(data.workspaceId))

export const revokeInvitationFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      invitationId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) =>
    revokeInvitation(data.workspaceId, data.invitationId),
  )

export const acceptInvitationFn = createServerFn({ method: 'POST' })
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }) => acceptInvitation(data.token))
