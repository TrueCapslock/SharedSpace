import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  createWorkspace,
  getWorkspace,
  listMyWorkspaces,
  updateWorkspace,
  updateWorkspaceModules,
} from '#/server/workspaces/service'
import { getCurrentUser } from '#/server/users/service'
import { getMyWorkspacePermissions } from '#/server/authorization/authorize'
import type { JsonValue } from '#/lib/json'
import {
  dashboardWidgets,
  workspaceModuleKeys,
  workspaceThemes,
} from '#/server/workspaces/templates'

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUser()
  if (!user) return null
  return { ...user, preferences: (user.preferences ?? {}) as JsonValue }
})

export const getWorkspaces = createServerFn({ method: 'GET' }).handler(
  async () => {
    const workspaces = await listMyWorkspaces()
    return workspaces.map((workspace) => ({
      ...workspace,
      settings: workspace.settings as JsonValue | null,
    }))
  },
)

export const getWorkspacePermissions = createServerFn({
  method: 'GET',
})
  .validator((input: { workspaceId: string }) => input)
  .handler(async ({ data }) => {
    return getMyWorkspacePermissions(data.workspaceId)
  })

export const createWorkspaceFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().trim().min(1, 'Name is required').max(255),
      slug: z.string().trim().max(100).optional(),
      workspaceType: z
        .enum([
          'housing_board',
          'cabin',
          'boat',
          'project',
          'agile_project',
          'association',
          'custom',
        ])
        .optional(),
      customTemplate: z
        .object({
          theme: z.enum(workspaceThemes).optional(),
          modules: z.array(z.enum(workspaceModuleKeys)).min(1).optional(),
          dashboardWidgets: z.array(z.enum(dashboardWidgets)).min(1).optional(),
        })
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const workspace = await createWorkspace(data)
    return {
      ...workspace,
      settings: (workspace.settings ?? {}) as JsonValue,
    }
  })

export const updateWorkspaceModulesFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      modules: z.array(z.enum(workspaceModuleKeys)).min(1),
      moduleOrder: z.array(z.enum(workspaceModuleKeys)).min(1).optional(),
    }),
  )
  .handler(async ({ data }) => {
    return updateWorkspaceModules(
      data.workspaceId,
      data.modules,
      data.moduleOrder,
    )
  })

export const updateWorkspaceThemeFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      theme: z.enum(workspaceThemes),
    }),
  )
  .handler(async ({ data }) => {
    const workspace = await getWorkspace(data.workspaceId)
    if (workspace.workspaceType !== 'custom') {
      throw new Error('Theme can only be changed for custom workspaces')
    }
    const updated = await updateWorkspace(data.workspaceId, {
      settings: { ...(workspace.settings ?? {}), theme: data.theme },
    })
    return { ...updated, settings: (updated.settings ?? {}) as JsonValue }
  })
