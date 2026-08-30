import { describe, expect, it, beforeEach, vi } from 'vitest'

import {
  AppError,
  getActiveMembership,
  getMyWorkspacePermissions,
  getMyWorkspaceRoleKey,
  getUserWorkspacePermissions,
  requireWorkspaceMembership,
  requireWorkspacePermission,
} from './authorize'

const USER_ID = 'user-123'
const WS_ID = 'workspace-123'
const ROLE_ID = 'role-456'

const appUser = {
  id: USER_ID,
  clerkId: 'clerk-user-123',
  displayName: 'Test User',
  email: null,
  preferences: {},
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const activeMembership = {
  id: 'membership-1',
  workspaceId: WS_ID,
  userId: USER_ID,
  roleId: ROLE_ID,
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const mocks = vi.hoisted(() => ({
  db: {
    query: {
      workspaceMemberships: { findFirst: vi.fn() },
    },
    select: vi.fn(),
  },
  requireUser: vi.fn(),
}))

vi.mock('#/server/db', () => ({ db: mocks.db }))
vi.mock('#/server/users/service', () => ({ requireUser: mocks.requireUser }))

function mockRoleKeyQuery(rows: Array<{ key: string }>) {
  mocks.db.select.mockImplementation(() => ({
    from: () => ({
      where: () => ({ limit: async () => rows }),
    }),
  }))
}

function mockPermissionRows(rows: Array<{ key: string }>) {
  mocks.db.select.mockImplementation(() => ({
    from: () => ({
      innerJoin: () => ({
        innerJoin: () => ({
          where: async () => rows,
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue(appUser)
  mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(undefined)
})

describe('AppError', () => {
  it('carries a typed error code and name', () => {
    const err = new AppError('FORBIDDEN', 'nope')
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('FORBIDDEN')
    expect(err.message).toBe('nope')
    expect(err.name).toBe('AppError')
  })
})

describe('getUserWorkspacePermissions', () => {
  it('returns an empty set when there is no active membership', async () => {
    const perms = await getUserWorkspacePermissions(WS_ID, USER_ID)
    expect(perms.size).toBe(0)
  })

  it('returns an empty set when the membership has no role', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue({
      ...activeMembership,
      roleId: null,
    })

    const perms = await getUserWorkspacePermissions(WS_ID, USER_ID)
    expect(perms.size).toBe(0)
    expect(mocks.db.select).not.toHaveBeenCalled()
  })

  it('maps the membership role to permission keys', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )
    mockPermissionRows([{ key: 'tasks:read' }, { key: 'tasks:create' }])

    const perms = await getUserWorkspacePermissions(WS_ID, USER_ID)
    expect([...perms].sort()).toEqual(['tasks:create', 'tasks:read'])
  })
})

describe('getActiveMembership', () => {
  it('returns the active membership found in the store', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )

    const membership = await getActiveMembership(WS_ID, USER_ID)
    expect(membership?.roleId).toBe(ROLE_ID)
  })

  it('returns undefined when no active membership exists', async () => {
    const membership = await getActiveMembership(WS_ID, USER_ID)
    expect(membership).toBeUndefined()
  })
})

describe('requireWorkspacePermission', () => {
  it('returns the user when the permission is held', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )
    mockPermissionRows([{ key: 'tasks:read' }])

    const user = await requireWorkspacePermission(WS_ID, 'tasks:read')
    expect(user.id).toBe(USER_ID)
  })

  it('throws FORBIDDEN when the permission is missing', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )
    mockPermissionRows([{ key: 'tasks:read' }])

    await expect(
      requireWorkspacePermission(WS_ID, 'tasks:delete'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('throws FORBIDDEN when the user holds no permissions', async () => {
    await expect(
      requireWorkspacePermission(WS_ID, 'tasks:read'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('delegates to the required permission attribute', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )
    mockPermissionRows([{ key: 'tasks:read' }])

    await requireWorkspacePermission(WS_ID, 'tasks:read')
    expect(mocks.requireUser).toHaveBeenCalled()
  })
})

describe('requireWorkspaceMembership', () => {
  it('returns the user when they hold an active membership', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )

    const user = await requireWorkspaceMembership(WS_ID)
    expect(user.id).toBe(USER_ID)
  })

  it('throws FORBIDDEN when the user is not a member', async () => {
    await expect(requireWorkspaceMembership(WS_ID)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})

describe('getMyWorkspacePermissions', () => {
  it('returns the resolved permissions as a plain array', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )
    mockPermissionRows([{ key: 'tasks:create' }, { key: 'tasks:read' }])

    const perms = await getMyWorkspacePermissions(WS_ID)
    expect(perms).toContain('tasks:read')
    expect(perms).toContain('tasks:create')
  })

  it('returns an empty array when the user holds no permissions', async () => {
    const perms = await getMyWorkspacePermissions(WS_ID)
    expect(perms).toEqual([])
  })
})

describe('getMyWorkspaceRoleKey', () => {
  it('returns the role key for the active membership', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )
    mockRoleKeyQuery([{ key: 'owner' }])

    const key = await getMyWorkspaceRoleKey(WS_ID)
    expect(key).toBe('owner')
  })

  it('returns null when the membership has no role', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue({
      ...activeMembership,
      roleId: null,
    })

    const key = await getMyWorkspaceRoleKey(WS_ID)
    expect(key).toBeNull()
  })

  it('returns null when the role row is not found', async () => {
    mocks.db.query.workspaceMemberships.findFirst.mockResolvedValue(
      activeMembership,
    )
    mockRoleKeyQuery([])

    const key = await getMyWorkspaceRoleKey(WS_ID)
    expect(key).toBeNull()
  })

  it('returns null when membership is missing', async () => {
    const key = await getMyWorkspaceRoleKey(WS_ID)
    expect(key).toBeNull()
  })
})
