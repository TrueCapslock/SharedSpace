import { and, eq, inArray } from 'drizzle-orm'
import { db } from '#/server/db'
import { permissions, rolePermissions, roles } from '#/server/db/schema'
import {
  allPermissionKeys,
  roleDefinitions,
} from '#/server/authorization/permissions'
import type { Permission, RoleKey } from '#/server/authorization/permissions'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Insert the four built-in roles for a workspace along with their permission
 * mappings. Called transactionally from workspace creation.
 */
export async function createBuiltInRolesForWorkspace(
  tx: Tx,
  workspaceId: string,
): Promise<void> {
  const permRows = await tx
    .select({ id: permissions.id, key: permissions.key })
    .from(permissions)
    .where(inArray(permissions.key, allPermissionKeys))

  const permissionIdByKey = new Map(permRows.map((r) => [r.key, r.id]))

  const roleKeys = Object.keys(roleDefinitions) as RoleKey[]

  for (const key of roleKeys) {
    const [role] = await tx
      .insert(roles)
      .values({
        workspaceId,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        key,
      })
      .returning({ id: roles.id })

    const permissionIds = roleDefinitions[key]
      .map((p: Permission) => permissionIdByKey.get(p))
      .filter((id): id is string => Boolean(id))

    if (permissionIds.length > 0) {
      await tx.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      )
    }
  }
}

/** Look up a role within a workspace by its key, or null. */
export async function getWorkspaceRoleByKey(
  workspaceId: string,
  key: RoleKey,
  executor: Pick<typeof db, 'select'> = db,
) {
  const [role] = await executor
    .select()
    .from(roles)
    .where(and(eq(roles.workspaceId, workspaceId), eq(roles.key, key)))
    .limit(1)
  return role ?? null
}
