/**
 * Central permission catalog.
 *
 * Permission keys are stable string identifiers stored in the `permissions`
 * table. Keep the list understandable; introduce new keys only when a genuine
 * capability boundary exists.
 */

export const permissionDefinitions = {
  'workspace:read': 'View workspace details and settings',
  'workspace:update': 'Update workspace details and settings',
  'members:read': 'View workspace members',
  'members:create': 'Add members',
  'members:update': 'Update member roles and status',
  'members:remove': 'Remove members',
  'invitations:create': 'Invite people to the workspace',
  'invitations:revoke': 'Revoke pending invitations',
  'roles:manage': 'Manage roles and role permissions',
  'modules:manage': 'Enable and configure workspace modules',
  'tasks:read': 'View tasks',
  'tasks:create': 'Create tasks',
  'tasks:update': 'Update tasks',
  'tasks:delete': 'Delete tasks',
  'documents:read': 'View documents',
  'documents:create': 'Upload documents',
  'documents:update': 'Update documents',
  'documents:delete': 'Delete documents',
} as const

export type Permission = keyof typeof permissionDefinitions
export type RoleKey = 'owner' | 'admin' | 'member' | 'viewer'

/** Which permissions each built-in role holds. Roles are per-workspace rows. */
export const roleDefinitions: Record<RoleKey, Permission[]> = {
  owner: Object.keys(permissionDefinitions) as Permission[],
  admin: [
    'workspace:read',
    'workspace:update',
    'members:read',
    'members:create',
    'members:update',
    'members:remove',
    'invitations:create',
    'invitations:revoke',
    'roles:manage',
    'modules:manage',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'tasks:delete',
    'documents:read',
    'documents:create',
    'documents:update',
    'documents:delete',
  ],
  member: [
    'workspace:read',
    'members:read',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'documents:read',
    'documents:create',
    'documents:update',
  ],
  viewer: ['workspace:read', 'members:read', 'tasks:read', 'documents:read'],
}

export const allPermissionKeys = Object.keys(
  permissionDefinitions,
) as Permission[]
