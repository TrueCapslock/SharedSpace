import type { WorkspaceType } from './service'

export const workspaceThemes = [
  'ocean',
  'forest',
  'harbor',
  'violet',
  'amber',
  'slate',
] as const

export type WorkspaceTheme = (typeof workspaceThemes)[number]

export const dashboardWidgets = [
  'tasks',
  'schedule',
  'documents',
  'calendar',
  'activity',
  'members',
  'expenses',
  'bookings',
] as const

export type DashboardWidget = (typeof dashboardWidgets)[number]

export const workspaceModuleKeys = [
  'tasks',
  'documents',
  'members',
  'meetings',
  'expenses',
  'bookings',
  'maintenance',
  'messages',
  'meters',
  'inventory',
  'residents',
  'board',
  'backlog',
  'sprints',
  'time',
  'roadmap',
  'resources',
  'risks',
  'logbook',
  'access',
  'cabin_info',
  'utilities',
  'berths',
  'insights',
] as const

export type WorkspaceModuleKey = (typeof workspaceModuleKeys)[number]

export type WorkspaceSettings = {
  template: WorkspaceType
  theme: WorkspaceTheme
  dashboardWidgets: DashboardWidget[]
  modules: WorkspaceModuleKey[]
  /**
   * User-defined display order of enabled modules in the sidebar. Modules are
   * listed in this order before any leftover enabled modules.
   */
  moduleOrder: WorkspaceModuleKey[]
  /**
   * The modules a user is allowed to enable/disable for this template.
   * For non-custom templates this is a fixed pool; for custom it is every
   * known module key. The enabled `modules` list must always be a subset of
   * this pool.
   */
  modulePool: WorkspaceModuleKey[]
}

type WorkspaceTemplate = {
  template: WorkspaceType
  theme: WorkspaceTheme
  modules: WorkspaceModuleKey[]
  dashboardWidgets: DashboardWidget[]
}

const templates: Record<WorkspaceType, WorkspaceTemplate> = {
  housing_board: {
    template: 'housing_board',
    theme: 'forest',
    modules: [
      'tasks',
      'documents',
      'members',
      'expenses',
      'meetings',
      'messages',
      'meters',
      'residents',
      'maintenance',
    ],
    dashboardWidgets: ['tasks', 'expenses', 'documents', 'activity', 'members'],
  },
  cabin: {
    template: 'cabin',
    theme: 'forest',
    modules: [
      'tasks',
      'documents',
      'members',
      'bookings',
      'messages',
      'inventory',
      'access',
      'cabin_info',
      'utilities',
    ],
    dashboardWidgets: [
      'tasks',
      'bookings',
      'documents',
      'calendar',
      'activity',
    ],
  },
  boat: {
    template: 'boat',
    theme: 'harbor',
    modules: [
      'tasks',
      'documents',
      'members',
      'bookings',
      'maintenance',
      'logbook',
      'inventory',
      'berths',
      'expenses',
    ],
    dashboardWidgets: [
      'tasks',
      'bookings',
      'documents',
      'calendar',
      'activity',
    ],
  },
  project: {
    template: 'project',
    theme: 'violet',
    modules: [
      'tasks',
      'documents',
      'members',
      'meetings',
      'roadmap',
      'resources',
      'risks',
      'time',
    ],
    dashboardWidgets: [
      'tasks',
      'schedule',
      'documents',
      'calendar',
      'activity',
    ],
  },
  agile_project: {
    template: 'agile_project',
    theme: 'violet',
    modules: [
      'tasks',
      'documents',
      'members',
      'meetings',
      'board',
      'backlog',
      'sprints',
      'roadmap',
      'insights',
    ],
    dashboardWidgets: ['tasks', 'schedule', 'members', 'activity'],
  },
  association: {
    template: 'association',
    theme: 'amber',
    modules: [
      'tasks',
      'documents',
      'members',
      'meetings',
      'expenses',
      'messages',
      'inventory',
      'residents',
    ],
    dashboardWidgets: ['tasks', 'schedule', 'documents', 'expenses', 'members'],
  },
  custom: {
    template: 'custom',
    theme: 'ocean',
    modules: ['tasks', 'documents', 'members'],
    dashboardWidgets: [
      'tasks',
      'schedule',
      'documents',
      'calendar',
      'activity',
    ],
  },
}

export function getWorkspaceTemplate(type: WorkspaceType): WorkspaceTemplate {
  return templates[type]
}

export function getCustomWorkspaceTemplate(input?: {
  theme?: WorkspaceTheme
  modules?: WorkspaceModuleKey[]
  dashboardWidgets?: DashboardWidget[]
}): WorkspaceTemplate {
  const defaults = templates.custom
  return {
    ...defaults,
    theme: input?.theme ?? defaults.theme,
    modules: input?.modules?.length ? input.modules : defaults.modules,
    dashboardWidgets: input?.dashboardWidgets?.length
      ? input.dashboardWidgets
      : defaults.dashboardWidgets,
  }
}

/** Resolve the modules a user may toggle for a given template type. */
export function getModulePool(type: WorkspaceType): WorkspaceModuleKey[] {
  if (type === 'custom') return [...workspaceModuleKeys]
  return getWorkspaceTemplate(type).modules
}

export function getWorkspaceSettings(
  type: WorkspaceType,
  settings: Record<string, unknown> | null,
): WorkspaceSettings {
  const defaults = getWorkspaceTemplate(type)
  const theme = settings?.theme
  const widgets = settings?.dashboardWidgets

  const pool = getModulePool(type)

  let modules: WorkspaceModuleKey[]
  if (Array.isArray(settings?.modules)) {
    const stored = settings.modules.filter(isWorkspaceModuleKey)
    modules = stored.length ? stored : defaults.modules
  } else {
    modules = defaults.modules
  }

  // For non-custom templates modules are fixed to the template's pool: never
  // allow modules outside the pool to become enabled.
  if (type !== 'custom') {
    const poolSet = new Set(pool)
    modules = modules.filter((key) => poolSet.has(key))
  }

  let moduleOrder = modules
  if (Array.isArray(settings?.moduleOrder)) {
    const storedOrder = settings.moduleOrder.filter(isWorkspaceModuleKey)
    if (storedOrder.length) moduleOrder = storedOrder
  }

  return {
    template: type,
    theme: isWorkspaceTheme(theme) ? theme : defaults.theme,
    dashboardWidgets: Array.isArray(widgets)
      ? widgets.filter(isDashboardWidget)
      : defaults.dashboardWidgets,
    modules,
    moduleOrder,
    modulePool: pool,
  }
}

function isDashboardWidget(value: unknown): value is DashboardWidget {
  return dashboardWidgets.includes(value as DashboardWidget)
}

function isWorkspaceTheme(value: unknown): value is WorkspaceTheme {
  return workspaceThemes.includes(value as WorkspaceTheme)
}

function isWorkspaceModuleKey(value: unknown): value is WorkspaceModuleKey {
  return workspaceModuleKeys.includes(value as WorkspaceModuleKey)
}
