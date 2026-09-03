import { describe, expect, it, vi } from 'vitest'

import {
  createBuiltInRolesForWorkspace,
  getWorkspaceRoleByKey,
} from './service'
import {
  allPermissionKeys,
  roleDefinitions,
} from '#/server/authorization/permissions'

vi.mock('#/server/db', () => ({ db: {} }))

describe('workspace roles', () => {
  it('creates every built-in role with its permission mappings', async () => {
    const permissionRows = allPermissionKeys.map((key, index) => ({
      id: `permission-${index}`,
      key,
    }))
    const selectWhere = vi.fn().mockResolvedValue(permissionRows)
    const selectFrom = vi.fn().mockReturnValue({ where: selectWhere })
    const insertedRoles: Array<{ key: string; id: string }> = []
    const insert = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((value) => {
        if (Array.isArray(value)) return Promise.resolve(undefined)
        const role = { id: `role-${value.key}`, key: value.key }
        insertedRoles.push(role)
        return { returning: vi.fn().mockResolvedValue([{ id: role.id }]) }
      }),
    }))
    const tx = { select: vi.fn().mockReturnValue({ from: selectFrom }), insert }

    await createBuiltInRolesForWorkspace(tx as never, 'workspace-1')

    expect(insertedRoles.map((role) => role.key)).toEqual(
      Object.keys(roleDefinitions),
    )
    expect(insert).toHaveBeenCalledTimes(
      Object.keys(roleDefinitions).length * 2,
    )
  })

  it('scopes role lookup to a workspace and returns null when absent', async () => {
    const limit = vi.fn().mockResolvedValue([])
    const where = vi.fn().mockReturnValue({ limit })
    const from = vi.fn().mockReturnValue({ where })
    const executor = { select: vi.fn().mockReturnValue({ from }) }

    await expect(
      getWorkspaceRoleByKey('workspace-1', 'owner', executor as never),
    ).resolves.toBeNull()
    expect(where).toHaveBeenCalledOnce()
  })
})
