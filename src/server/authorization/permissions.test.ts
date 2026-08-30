import { describe, expect, it } from 'vitest'

import {
  allPermissionKeys,
  permissionDefinitions,
  roleDefinitions,
} from './permissions'
import type { Permission, RoleKey } from './permissions'

const roleKeys = Object.keys(roleDefinitions) as RoleKey[]

describe('permission catalog', () => {
  it('describes every permission', () => {
    for (const [key, description] of Object.entries(permissionDefinitions)) {
      expect(key.length).toBeGreaterThan(0)
      expect(description.trim().length).toBeGreaterThan(0)
    }
  })

  it('exposes the full catalog through allPermissionKeys', () => {
    expect([...allPermissionKeys].sort()).toEqual(
      Object.keys(permissionDefinitions).sort(),
    )
  })

  it('references only defined permissions from roles', () => {
    const catalog = new Set(allPermissionKeys)
    for (const key of roleKeys) {
      for (const permission of roleDefinitions[key]) {
        expect(catalog.has(permission)).toBe(true)
      }
    }
  })

  it('keeps a strict role hierarchy: owner >= admin > member > viewer', () => {
    const asSet = (key: RoleKey) => new Set(roleDefinitions[key])
    const owner = asSet('owner')
    const admin = asSet('admin')
    const member = asSet('member')
    const viewer = asSet('viewer')

    for (const permission of admin) expect(owner.has(permission)).toBe(true)
    for (const permission of member) expect(admin.has(permission)).toBe(true)
    for (const permission of viewer) expect(member.has(permission)).toBe(true)

    // Owner may equal admin until owner-only permissions exist, but the
    // member and viewer levels must be strictly smaller than the level above.
    expect(owner.size).toBeGreaterThanOrEqual(admin.size)
    expect(member.size).toBeLessThan(admin.size)
    expect(viewer.size).toBeLessThan(member.size)
  })

  it('gives viewers read-only access', () => {
    for (const permission of roleDefinitions.viewer) {
      expect(permission.endsWith(':read')).toBe(true)
    }
  })

  it('keeps write and management permissions out of the member role', () => {
    const member = new Set(roleDefinitions.member)
    const managementPermissions = [
      'tasks:delete',
      'documents:delete',
      'members:create',
      'members:update',
      'members:remove',
      'invitations:create',
      'invitations:revoke',
      'roles:manage',
      'modules:manage',
      'workspace:update',
    ] as Permission[]

    for (const permission of managementPermissions) {
      expect(member.has(permission)).toBe(false)
    }
  })

  it('lets members create and update tasks and documents they cannot delete', () => {
    const member = new Set(roleDefinitions.member)

    expect(member.has('tasks:create')).toBe(true)
    expect(member.has('tasks:update')).toBe(true)
    expect(member.has('tasks:delete')).toBe(false)
    expect(member.has('documents:create')).toBe(true)
    expect(member.has('documents:update')).toBe(true)
    expect(member.has('documents:delete')).toBe(false)
  })
})
