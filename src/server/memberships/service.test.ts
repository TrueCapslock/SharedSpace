import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authorize from '#/server/authorization/authorize'
import {
  listMembers,
  listWorkspaceRoles,
  removeMember,
  updateMemberRole,
} from './service'

const USER_ID = 'user-123'
const MEMBER_ID = 'user-456'
const WS_ID = 'workspace-123'
const MEMBERSHIP_ID = 'membership-123'

const appUser = {
  id: USER_ID,
  clerkId: 'clerk-user-123',
  displayName: 'Test User',
  email: null,
  preferences: {},
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const membershipRow = {
  id: MEMBERSHIP_ID,
  workspaceId: WS_ID,
  userId: MEMBER_ID,
  roleId: null,
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: { workspaceMemberships: { findFirst: vi.fn() } },
  },
  recordActivityEvent: vi.fn(),
  getWorkspaceRoleByKey: vi.fn(),
  requireUser: vi.fn(),
}))

vi.mock('#/server/db', () => ({ db: mocks.db }))
vi.mock('#/server/activity/service', () => ({
  recordActivityEvent: mocks.recordActivityEvent,
}))
vi.mock('#/server/roles/service', () => ({
  getWorkspaceRoleByKey: mocks.getWorkspaceRoleByKey,
}))
vi.mock('#/server/users/service', () => ({ requireUser: mocks.requireUser }))

const requireWorkspacePermission = vi.spyOn(
  authorize,
  'requireWorkspacePermission',
)
const getMyWorkspaceRoleKey = vi.spyOn(authorize, 'getMyWorkspaceRoleKey')

beforeEach(() => {
  vi.clearAllMocks()
  requireWorkspacePermission.mockResolvedValue(appUser)
  getMyWorkspaceRoleKey.mockResolvedValue('admin')
  mocks.getWorkspaceRoleByKey.mockResolvedValue({ id: 'role-admin' })
  mocks.db.select.mockImplementation(() => ({
    from: () => ({
      innerJoin: () => ({
        where: () => ({ limit: async () => [] }),
      }),
    }),
  }))
})

describe('listMembers', () => {
  it('requires the members:read permission', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        innerJoin: () => ({
          leftJoin: () => ({ where: async () => [] }),
        }),
      }),
    }))

    await listMembers(WS_ID)
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'members:read',
    )
  })
})

describe('listWorkspaceRoles', () => {
  it('requires the roles:manage permission', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({ where: async () => [] }),
    }))

    await listWorkspaceRoles(WS_ID)
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'roles:manage',
    )
  })
})

describe('updateMemberRole', () => {
  it('requires the roles:manage permission', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      membershipRow,
    )
    mocks.db.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({ returning: async () => [membershipRow] }),
      }),
    }))

    await updateMemberRole(WS_ID, MEMBER_ID, 'member')
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'roles:manage',
    )
  })

  it('throws NOT_FOUND when the membership is missing', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(null)

    await expect(
      updateMemberRole(WS_ID, MEMBER_ID, 'member'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('forbids non-owners from changing owner roles', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      membershipRow,
    )
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ limit: async () => [{ key: 'owner' }] }),
        }),
      }),
    }))
    getMyWorkspaceRoleKey.mockResolvedValue('member')

    await expect(
      updateMemberRole(WS_ID, MEMBER_ID, 'viewer'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('updates the role and records activity', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      membershipRow,
    )
    mocks.db.update.mockImplementation(() => ({
      set: (patch: Record<string, unknown>) => {
        expect(patch.roleId).toBe('role-admin')
        return { where: () => ({ returning: async () => [membershipRow] }) }
      },
    }))

    await updateMemberRole(WS_ID, MEMBER_ID, 'admin')

    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WS_ID,
        actorId: USER_ID,
        action: 'member.role_changed',
        entityType: 'membership',
        entityId: MEMBERSHIP_ID,
        metadata: { roleKey: 'admin' },
      }),
    )
  })
})

describe('removeMember', () => {
  it('requires the members:remove permission', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      membershipRow,
    )
    mocks.db.delete.mockImplementation(() => ({
      where: () => ({ returning: async () => [membershipRow] }),
    }))

    await removeMember(WS_ID, MEMBER_ID)
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'members:remove',
    )
  })

  it('rejects removing yourself', async () => {
    await expect(removeMember(WS_ID, USER_ID)).rejects.toMatchObject({
      code: 'VALIDATION',
    })
  })

  it('throws NOT_FOUND when the member is missing', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(null)

    await expect(removeMember(WS_ID, MEMBER_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('forbids non-owners from removing owners', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      membershipRow,
    )
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ limit: async () => [{ key: 'owner' }] }),
        }),
      }),
    }))
    getMyWorkspaceRoleKey.mockResolvedValue('member')

    await expect(removeMember(WS_ID, MEMBER_ID)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('removes the member and records activity', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      membershipRow,
    )
    mocks.db.delete.mockImplementation(() => ({
      where: () => ({ returning: async () => [membershipRow] }),
    }))

    await removeMember(WS_ID, MEMBER_ID)

    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WS_ID,
        actorId: USER_ID,
        action: 'member.removed',
        entityType: 'membership',
        entityId: MEMBERSHIP_ID,
      }),
    )
  })
})
