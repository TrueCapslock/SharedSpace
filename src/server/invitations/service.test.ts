import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authorize from '#/server/authorization/authorize'
import {
  acceptInvitation,
  inviteMember,
  listInvitations,
  revokeInvitation,
} from './service'

const USER_ID = 'user-123'
const WS_ID = 'workspace-123'
const INVITATION_ID = 'invitation-123'

const appUser = {
  id: USER_ID,
  clerkId: 'clerk-user-123',
  displayName: 'Test User',
  email: 'target@example.com',
  preferences: {},
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const invitationRow = {
  id: INVITATION_ID,
  token: 'tok_123',
  workspaceId: WS_ID,
  email: 'target@example.com',
  roleId: 'role-member',
  status: 'pending',
  invitedById: USER_ID,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    query: { invitations: { findFirst: vi.fn() } },
  },
  requireUser: vi.fn(),
  recordActivityEvent: vi.fn(),
  getWorkspaceRoleByKey: vi.fn(),
}))

vi.mock('#/server/db', () => ({ db: mocks.db }))
vi.mock('#/server/users/service', () => ({ requireUser: mocks.requireUser }))
vi.mock('#/server/activity/service', () => ({
  recordActivityEvent: mocks.recordActivityEvent,
}))
vi.mock('#/server/roles/service', () => ({
  createBuiltInRolesForWorkspace: vi.fn(),
  getWorkspaceRoleByKey: mocks.getWorkspaceRoleByKey,
}))

const requireWorkspacePermission = vi.spyOn(
  authorize,
  'requireWorkspacePermission',
)

beforeEach(() => {
  vi.clearAllMocks()
  requireWorkspacePermission.mockResolvedValue(appUser)
  mocks.requireUser.mockResolvedValue(appUser)
  mocks.getWorkspaceRoleByKey.mockResolvedValue({ id: 'role-member' })
})

describe('inviteMember', () => {
  let insertValues: Record<string, unknown> | undefined

  beforeEach(() => {
    mocks.db.insert.mockImplementation(() => ({
      values: (values: Record<string, unknown>) => {
        insertValues = values
        return { returning: async () => [{ ...invitationRow }] }
      },
    }))
  })

  it('requires the invitations:create permission', async () => {
    await inviteMember(WS_ID, { email: 'X@Y.com' })
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'invitations:create',
    )
  })

  it('normalizes the email and defaults roleKey to member', async () => {
    await inviteMember(WS_ID, { email: '  Foo@Bar.com  ' })

    expect(insertValues).toMatchObject({
      workspaceId: WS_ID,
      email: 'foo@bar.com',
      roleId: 'role-member',
    })
  })

  it('uses the provided roleKey when set', async () => {
    await inviteMember(WS_ID, { email: 'a@b.com', roleKey: 'admin' })
    expect(mocks.getWorkspaceRoleByKey).toHaveBeenCalledWith(WS_ID, 'admin')
    expect(insertValues?.roleId).toBe('role-member')
  })

  it('throws NOT_FOUND when the role is missing', async () => {
    mocks.getWorkspaceRoleByKey.mockResolvedValue(null)

    await expect(
      inviteMember(WS_ID, { email: 'a@b.com' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('generates a token, a 7-day expiry and records activity', async () => {
    const before = Date.now()
    await inviteMember(WS_ID, { email: 'a@b.com' })

    expect(typeof insertValues?.token).toBe('string')
    expect((insertValues?.token as string).length).toBeGreaterThan(0)
    const expiresAt = insertValues?.expiresAt as Date
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 6 * 24 * 60 * 60 * 1000,
    )
    expect(expiresAt.getTime()).toBeLessThanOrEqual(
      before + 8 * 24 * 60 * 60 * 1000,
    )
    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WS_ID,
        actorId: USER_ID,
        action: 'invitation.created',
        entityType: 'invitation',
        entityId: INVITATION_ID,
      }),
    )
  })
})

describe('listInvitations', () => {
  it('requires the invitations:create permission', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({ where: async () => [] }),
    }))

    await listInvitations(WS_ID)
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'invitations:create',
    )
  })
})

describe('revokeInvitation', () => {
  it('requires the invitations:revoke permission and records activity', async () => {
    mocks.db.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({ returning: async () => [{ ...invitationRow }] }),
      }),
    }))

    await revokeInvitation(WS_ID, INVITATION_ID)

    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'invitations:revoke',
    )
    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'invitation.revoked',
        entityId: INVITATION_ID,
      }),
    )
  })

  it('throws NOT_FOUND when the invitation is missing', async () => {
    mocks.db.update.mockImplementation(() => ({
      set: () => ({ where: () => ({ returning: async () => [] }) }),
    }))

    await expect(revokeInvitation(WS_ID, INVITATION_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

describe('acceptInvitation', () => {
  it('throws NOT_FOUND for an unknown token', async () => {
    mocks.db.query.invitations.findFirst.mockResolvedValue(null)

    await expect(acceptInvitation('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('throws CONFLICT when the invitation is not pending', async () => {
    mocks.db.query.invitations.findFirst.mockResolvedValue({
      ...invitationRow,
      status: 'revoked',
    })

    await expect(acceptInvitation('tok_123')).rejects.toMatchObject({
      code: 'CONFLICT',
    })
  })

  it('throws CONFLICT when the invitation has expired', async () => {
    mocks.db.query.invitations.findFirst.mockResolvedValue({
      ...invitationRow,
      expiresAt: new Date(Date.now() - 1000),
    })

    await expect(acceptInvitation('tok_123')).rejects.toMatchObject({
      code: 'CONFLICT',
    })
  })

  it('throws FORBIDDEN when the invitation is for a different email', async () => {
    mocks.db.query.invitations.findFirst.mockResolvedValue({
      ...invitationRow,
      email: 'elsewhere@example.com',
    })

    await expect(acceptInvitation('tok_123')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('creates a membership and returns the workspace', async () => {
    mocks.db.query.invitations.findFirst.mockResolvedValue(invitationRow)
    mocks.db.update.mockImplementation(() => ({
      set: () => ({ where: () => ({ returning: async () => [] }) }),
    }))
    mocks.db.insert.mockImplementation(() => ({
      values: () => ({
        onConflictDoNothing: () => ({ returning: async () => [{}] }),
      }),
    }))

    await expect(acceptInvitation('tok_123')).resolves.toBe(WS_ID)
    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'invitation.accepted' }),
    )
  })
})
