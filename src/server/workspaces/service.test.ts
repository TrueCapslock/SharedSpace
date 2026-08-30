import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authorize from '#/server/authorization/authorize'
import { workspaces } from '#/server/db/schema'
import {
  createWorkspace,
  getWorkspace,
  listMyWorkspaces,
  updateWorkspace,
  updateWorkspaceModules,
} from './service'
import { getModulePool } from './templates'

const USER_ID = 'user-123'
const WS_ID = 'workspace-123'

const appUser = {
  id: USER_ID,
  clerkId: 'clerk-user-123',
  displayName: 'Test User',
  email: null,
  preferences: {},
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
  requireUser: vi.fn(),
  recordActivityEvent: vi.fn(),
  createBuiltInRolesForWorkspace: vi.fn(),
  getWorkspaceRoleByKey: vi.fn(),
}))

vi.mock('#/server/db', () => ({ db: mocks.db }))
vi.mock('#/server/users/service', () => ({ requireUser: mocks.requireUser }))
vi.mock('#/server/activity/service', () => ({
  recordActivityEvent: mocks.recordActivityEvent,
}))
vi.mock('#/server/roles/service', () => ({
  createBuiltInRolesForWorkspace: mocks.createBuiltInRolesForWorkspace,
  getWorkspaceRoleByKey: mocks.getWorkspaceRoleByKey,
}))

const requireWorkspacePermission = vi.spyOn(
  authorize,
  'requireWorkspacePermission',
)
const requireWorkspaceMembership = vi.spyOn(
  authorize,
  'requireWorkspaceMembership',
)

describe('createWorkspace', () => {
  const tx = {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  }

  let workspaceValues: Record<string, unknown> | undefined
  let membershipValues: Record<string, unknown> | undefined
  let moduleValues: unknown
  let activityValues: Record<string, unknown> | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    requireWorkspacePermission.mockResolvedValue(appUser)
    requireWorkspaceMembership.mockResolvedValue(appUser)
    mocks.requireUser.mockResolvedValue(appUser)
    mocks.getWorkspaceRoleByKey.mockResolvedValue({ id: 'owner-role-id' })

    tx.insert.mockImplementation((table: unknown) => ({
      values: (values: unknown) => {
        if (table === workspaces) {
          workspaceValues = values as Record<string, unknown>
          return { returning: async () => [{ id: WS_ID }] }
        }
        if ((values as { action?: string }).action) {
          activityValues = values as Record<string, unknown>
        } else if (Array.isArray(values)) {
          moduleValues = values
        } else {
          membershipValues = values as Record<string, unknown>
        }
        return { returning: async () => [{ id: 'generated-id' }] }
      },
    }))

    mocks.db.transaction.mockImplementation(
      async (fn: (transaction: unknown) => Promise<unknown>) => fn(tx),
    )
  })

  it('generates a unique slug from the workspace name', async () => {
    const workspace = await createWorkspace({ name: '  My Cabin!  ' })

    expect(workspaceValues?.name).toBe('My Cabin!')
    expect(workspaceValues?.slug).toMatch(/^my-cabin-[a-z0-9]+$/)
    expect(workspace.id).toBe(WS_ID)
  })

  it('keeps an explicitly provided slug', async () => {
    await createWorkspace({ name: 'My Cabin', slug: 'smakkerud-vel' })

    expect(workspaceValues?.slug).toBe('smakkerud-vel')
  })

  it('provisions the creator as an active owner', async () => {
    await createWorkspace({ name: 'My Cabin' })

    expect(mocks.requireUser).toHaveBeenCalled()
    expect(membershipValues).toMatchObject({
      workspaceId: WS_ID,
      userId: USER_ID,
      roleId: 'owner-role-id',
      status: 'active',
    })
  })

  it('enables the template modules and records activity', async () => {
    await createWorkspace({ name: 'My Cabin', workspaceType: 'boat' })

    expect(moduleValues).toEqual(
      getModulePool('boat').map((key) => ({
        workspaceId: WS_ID,
        key,
        enabled: true,
        config: { template: 'boat' },
      })),
    )
    expect(activityValues).toMatchObject({
      workspaceId: WS_ID,
      actorId: USER_ID,
      action: 'workspace.created',
      entityType: 'workspace',
      entityId: WS_ID,
    })
    expect(mocks.createBuiltInRolesForWorkspace).toHaveBeenCalled()
  })
})

describe('updateWorkspaceModules', () => {
  const boatWorkspace = {
    id: WS_ID,
    workspaceType: 'boat',
    settings: {
      modules: ['tasks', 'logbook', 'board'],
      moduleOrder: ['tasks', 'logbook', 'board'],
    },
  }

  let txUpdates: unknown[]
  let txInserts: unknown[]

  beforeEach(() => {
    vi.clearAllMocks()
    requireWorkspacePermission.mockResolvedValue(appUser)
    requireWorkspaceMembership.mockResolvedValue(appUser)
    txUpdates = []
    txInserts = []

    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ limit: async () => [boatWorkspace] }),
      }),
    }))

    const tx = {
      insert: vi.fn().mockImplementation(() => ({
        values: (values: unknown) => {
          txInserts.push(values)
          return { onConflictDoUpdate: async () => {} }
        },
      })),
      update: vi.fn().mockImplementation(() => ({
        set: (patch: unknown) => {
          txUpdates.push(patch)
          return { where: async () => {} }
        },
      })),
      select: vi.fn(),
    }

    mocks.db.transaction.mockImplementation(
      async (fn: (transaction: unknown) => Promise<unknown>) => fn(tx),
    )
  })

  it('clamps requested modules to the template pool', async () => {
    await updateWorkspaceModules(
      WS_ID,
      ['tasks', 'berths', 'meetings'],
      ['berths', 'tasks', 'meetings'],
    )

    const settingsPatch = txUpdates.find(
      (patch) => (patch as { settings?: unknown }).settings,
    ) as { settings: { modules: string[]; moduleOrder: string[] } }

    // 'meetings' is a valid module but outside the boat module pool: dropped.
    expect(settingsPatch.settings.modules).toEqual(['tasks', 'berths'])
    expect(settingsPatch.settings.moduleOrder).toEqual(['berths', 'tasks'])

    // 'logbook' and 'board' existed but were not requested: disabled, not deleted.
    expect(txUpdates).toContainEqual({ enabled: false })

    // Every remaining module is upserted as enabled.
    const moduleUpsertKeys = txInserts
      .map((values) => (values as { key?: string }).key)
      .filter((key): key is string => key !== undefined)
    expect(moduleUpsertKeys).toEqual(['tasks', 'berths'])

    // The change is recorded in the audit trail.
    expect(txInserts).toContainEqual(
      expect.objectContaining({ action: 'workspace.modules_updated' }),
    )
  })

  it('requires the workspace:update permission', async () => {
    await updateWorkspaceModules(WS_ID, ['tasks'])

    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'workspace:update',
    )
  })
})

describe('getWorkspace', () => {
  const workspaceRow = { id: WS_ID, name: 'My Cabin', workspaceType: 'boat' }

  beforeEach(() => {
    vi.clearAllMocks()
    requireWorkspacePermission.mockResolvedValue(appUser)
    requireWorkspaceMembership.mockResolvedValue(appUser)
    mocks.requireUser.mockResolvedValue(appUser)
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ limit: async () => [workspaceRow] }),
      }),
    }))
  })

  it('requires workspace:read permission', async () => {
    await getWorkspace(WS_ID)
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'workspace:read',
    )
  })

  it('returns the workspace when found', async () => {
    const workspace = await getWorkspace(WS_ID)
    expect(workspace.id).toBe(WS_ID)
  })

  it('throws NOT_FOUND for an unknown workspace', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ limit: async () => [] }),
      }),
    }))

    await expect(getWorkspace(WS_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

describe('listMyWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireWorkspacePermission.mockResolvedValue(appUser)
    requireWorkspaceMembership.mockResolvedValue(appUser)
    mocks.requireUser.mockResolvedValue(appUser)
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: async () => [
              { id: WS_ID, name: 'My Cabin', slug: 'my-cabin' },
            ],
          }),
        }),
      }),
    }))
  })

  it('lists the workspaces of the current user', async () => {
    const list = await listMyWorkspaces()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('My Cabin')
    expect(mocks.requireUser).toHaveBeenCalled()
  })

  it('returns an empty list when the user belongs to none', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ orderBy: async () => [] }),
        }),
      }),
    }))

    const list = await listMyWorkspaces()
    expect(list).toEqual([])
  })
})

describe('updateWorkspace', () => {
  const updatedRow = { id: WS_ID, name: 'Renamed Cabin' }

  beforeEach(() => {
    vi.clearAllMocks()
    requireWorkspacePermission.mockResolvedValue(appUser)
    requireWorkspaceMembership.mockResolvedValue(appUser)
    mocks.requireUser.mockResolvedValue(appUser)
  })

  let patch: Record<string, unknown> | undefined

  beforeEach(() => {
    mocks.db.update.mockImplementation(() => ({
      set: (values: Record<string, unknown>) => {
        patch = values
        return { where: () => ({ returning: async () => [updatedRow] }) }
      },
    }))
  })

  it('requires workspace:update permission', async () => {
    await updateWorkspace(WS_ID, { name: 'New' })
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'workspace:update',
    )
  })

  it('trims the name and records the update activity', async () => {
    const result = await updateWorkspace(WS_ID, { name: '  New Name  ' })

    expect(patch?.name).toBe('New Name')
    expect(result.name).toBe('Renamed Cabin')
    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WS_ID,
        actorId: USER_ID,
        action: 'workspace.updated',
        entityType: 'workspace',
        entityId: WS_ID,
      }),
    )
  })

  it('applies a settings patch without a name change', async () => {
    const settings = { theme: 'dark' }
    await updateWorkspace(WS_ID, { settings })

    expect(patch).toMatchObject({ settings })
    expect(patch?.name).toBeUndefined()
  })
})
