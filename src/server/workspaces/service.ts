import { and, asc, eq } from 'drizzle-orm'
import { db } from '#/server/db'
import {
  activityEvents,
  workspaceMemberships,
  workspaceModules,
  workspaces,
} from '#/server/db/schema'
import {
  AppError,
  requireWorkspacePermission,
} from '#/server/authorization/authorize'
import { requireUser } from '#/server/users/service'
import {
  createBuiltInRolesForWorkspace,
  getWorkspaceRoleByKey,
} from '#/server/roles/service'
import { recordActivityEvent } from '#/server/activity/service'
import {
  getCustomWorkspaceTemplate,
  getModulePool,
  getWorkspaceTemplate,
  workspaceModuleKeys,
} from './templates'
import type {
  DashboardWidget,
  WorkspaceModuleKey,
  WorkspaceTheme,
} from './templates'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'workspace'
  )
}

export type WorkspaceType = typeof workspaces.$inferSelect.workspaceType

export type WorkspaceInput = {
  name: string
  slug?: string
  workspaceType?: WorkspaceType
  customTemplate?: {
    theme?: WorkspaceTheme
    modules?: WorkspaceModuleKey[]
    dashboardWidgets?: DashboardWidget[]
  }
}

async function recordActivityInTx(
  tx: Tx,
  params: {
    workspaceId: string
    actorId: string
    action: string
    entityType: string
    entityId?: string
  },
) {
  await tx.insert(activityEvents).values({
    workspaceId: params.workspaceId,
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
  })
}

/**
 * Create a workspace as the current user. The creator becomes the owner with
 * an active membership. Built-in roles and default modules are provisioned in
 * the same transaction.
 */
export async function createWorkspace(input: WorkspaceInput) {
  const user = await requireUser()

  const slug =
    input.slug?.trim() || `${slugify(input.name)}-${Date.now().toString(36)}`
  const workspaceType = input.workspaceType ?? 'custom'
  const template =
    workspaceType === 'custom'
      ? getCustomWorkspaceTemplate(input.customTemplate)
      : getWorkspaceTemplate(workspaceType)

  return db.transaction(async (tx) => {
    const [workspace] = await tx
      .insert(workspaces)
      .values({
        name: input.name.trim(),
        slug,
        workspaceType,
        settings: {
          theme: template.theme,
          dashboardWidgets: template.dashboardWidgets,
          modules: template.modules,
        },
        createdById: user.id,
      })
      .returning()

    await createBuiltInRolesForWorkspace(tx, workspace.id)

    const ownerRole = await getWorkspaceRoleByKey(workspace.id, 'owner', tx)
    if (!ownerRole) {
      throw new Error('Failed to provision owner role')
    }

    await tx.insert(workspaceMemberships).values({
      workspaceId: workspace.id,
      userId: user.id,
      roleId: ownerRole.id,
      status: 'active',
    })

    await tx.insert(workspaceModules).values(
      template.modules.map((key) => ({
        workspaceId: workspace.id,
        key,
        enabled: true,
        config: { template: workspaceType },
      })),
    )

    await recordActivityInTx(tx, {
      workspaceId: workspace.id,
      actorId: user.id,
      action: 'workspace.created',
      entityType: 'workspace',
      entityId: workspace.id,
    })

    return workspace
  })
}

/** All workspaces the current user actively belongs to, for the switcher. */
export async function listMyWorkspaces() {
  const user = await requireUser()

  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      workspaceType: workspaces.workspaceType,
      settings: workspaces.settings,
    })
    .from(workspaceMemberships)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMemberships.workspaceId))
    .where(eq(workspaceMemberships.userId, user.id))
    .orderBy(asc(workspaces.name))

  return rows
}

/** Fetch a workspace by id, requiring an active membership and read access. */
export async function getWorkspace(workspaceId: string) {
  await requireWorkspacePermission(workspaceId, 'workspace:read')

  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)

  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Workspace not found')
  }
  return rows[0]
}

export async function updateWorkspace(
  workspaceId: string,
  input: {
    name?: string
    workspaceType?: WorkspaceType
    settings?: Record<string, unknown>
  },
) {
  const user = await requireWorkspacePermission(workspaceId, 'workspace:update')

  const patch: Partial<typeof workspaces.$inferInsert> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.workspaceType !== undefined)
    patch.workspaceType = input.workspaceType
  if (input.settings !== undefined) patch.settings = input.settings

  const [updated] = await db
    .update(workspaces)
    .set(patch)
    .where(eq(workspaces.id, workspaceId))
    .returning()

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: 'workspace.updated',
    entityType: 'workspace',
    entityId: workspaceId,
  })

  return updated
}

/**
 * Set which modules are enabled for a workspace. Owners/admins can reorder or
 * restrict the module set; the change is persisted both in `settings.modules`
 * (drives the navigation) and the `workspace_modules` join table.
 */
export async function updateWorkspaceModules(
  workspaceId: string,
  modules: WorkspaceModuleKey[],
  moduleOrder?: WorkspaceModuleKey[],
) {
  const user = await requireWorkspacePermission(workspaceId, 'workspace:update')

  const current = await getWorkspace(workspaceId)
  const currentSettings = current.settings ?? {}
  const existing = Array.isArray(currentSettings.modules)
    ? currentSettings.modules.filter(isWorkspaceModuleKey)
    : []

  // Non-custom templates have a fixed module pool: clamp the requested set so
  // users can only enable/disable modules within the template, never add new
  // ones outside it.
  if (current.workspaceType !== 'custom') {
    const pool = new Set(getModulePool(current.workspaceType))
    modules = modules.filter((key) => pool.has(key))
  }

  const enabledSet = new Set(modules)
  const nextOrder = Array.isArray(moduleOrder)
    ? moduleOrder.filter((key) => enabledSet.has(key))
    : modules

  return db.transaction(async (tx) => {
    const desired = new Set(modules)
    const removed = new Set(existing.filter((key) => !desired.has(key)))

    await tx
      .update(workspaces)
      .set({
        settings: { ...currentSettings, modules, moduleOrder: nextOrder },
      })
      .where(eq(workspaces.id, workspaceId))

    for (const key of modules) {
      await tx
        .insert(workspaceModules)
        .values({
          workspaceId,
          key,
          enabled: true,
          config: { template: current.workspaceType },
        })
        .onConflictDoUpdate({
          target: [workspaceModules.workspaceId, workspaceModules.key],
          set: { enabled: true },
        })
    }

    for (const key of removed) {
      await tx
        .update(workspaceModules)
        .set({ enabled: false })
        .where(
          and(
            eq(workspaceModules.workspaceId, workspaceId),
            eq(workspaceModules.key, key),
          ),
        )
    }

    await tx.insert(activityEvents).values({
      workspaceId,
      actorId: user.id,
      action: 'workspace.modules_updated',
      entityType: 'workspace',
      entityId: workspaceId,
    })

    return { modules }
  })
}

function isWorkspaceModuleKey(value: unknown): value is WorkspaceModuleKey {
  return (
    typeof value === 'string' &&
    (workspaceModuleKeys as readonly string[]).includes(value)
  )
}

export type WorkspaceSummary = Awaited<
  ReturnType<typeof listMyWorkspaces>
>[number]
