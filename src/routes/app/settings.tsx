import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Check, Plus, X } from 'lucide-react'

import {
  createWorkspaceFn,
  updateWorkspaceModulesFn,
  updateWorkspaceThemeFn,
} from '#/server/api/workspaces'
import {
  getModulePool,
  getWorkspaceSettings,
  workspaceModuleKeys,
} from '#/server/workspaces/templates'
import { useWorkspacesContext } from '#/features/app/workspace-context'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { useI18n } from '#/lib/i18n'
import type { TranslationKey } from '#/lib/i18n'

export const Route = createFileRoute('/app/settings')({
  component: Settings,
})

const workspaceTypes = [
  { value: 'custom', label: 'typeCustom', description: 'typeCustomDesc' },
  {
    value: 'housing_board',
    label: 'typeHousing',
    description: 'typeHousingDesc',
  },
  { value: 'cabin', label: 'typeCabin', description: 'typeCabinDesc' },
  { value: 'boat', label: 'typeBoat', description: 'typeBoatDesc' },
  { value: 'project', label: 'typeProject', description: 'typeProjectDesc' },
  {
    value: 'agile_project',
    label: 'typeAgile',
    description: 'typeAgileDesc',
  },
  {
    value: 'association',
    label: 'typeAssociation',
    description: 'typeAssociationDesc',
  },
] as const satisfies readonly {
  value: string
  label: TranslationKey
  description: TranslationKey
}[]

type WorkspaceType = (typeof workspaceTypes)[number]['value']

const moduleCatalog: Record<
  string,
  { label: TranslationKey; description: TranslationKey }
> = {
  tasks: { label: 'catTasks', description: 'catTasksDesc' },
  documents: { label: 'catDocuments', description: 'catDocumentsDesc' },
  members: { label: 'catMembers', description: 'catMembersDesc' },
  meetings: { label: 'catMeetings', description: 'catMeetingsDesc' },
  expenses: { label: 'catExpenses', description: 'catExpensesDesc' },
  bookings: { label: 'catBookings', description: 'catBookingsDesc' },
  maintenance: { label: 'catMaintenance', description: 'catMaintenanceDesc' },
  messages: { label: 'catMessages', description: 'catMessagesDesc' },
  meters: { label: 'catMeters', description: 'catMetersDesc' },
  inventory: { label: 'catInventory', description: 'catInventoryDesc' },
  residents: { label: 'catResidents', description: 'catResidentsDesc' },
  board: { label: 'catBoard', description: 'catBoardDesc' },
  backlog: { label: 'catBacklog', description: 'catBacklogDesc' },
  sprints: { label: 'catSprints', description: 'catSprintsDesc' },
  time: { label: 'catTime', description: 'catTimeDesc' },
  roadmap: { label: 'catRoadmap', description: 'catRoadmapDesc' },
  resources: { label: 'catResources', description: 'catResourcesDesc' },
  risks: { label: 'catRisks', description: 'catRisksDesc' },
  logbook: { label: 'catLogbook', description: 'catLogbookDesc' },
  access: { label: 'catAccess', description: 'catAccessDesc' },
  cabin_info: { label: 'catCabinInfo', description: 'catCabinInfoDesc' },
  utilities: { label: 'catUtilities', description: 'catUtilitiesDesc' },
  berths: { label: 'catBerths', description: 'catBerthsDesc' },
  insights: { label: 'catInsights', description: 'catInsightsDesc' },
}

const modules = workspaceModuleKeys.map((value) => ({
  value,
  labelKey: moduleCatalog[value]?.label ?? 'catTasks',
  descriptionKey: moduleCatalog[value]?.description ?? 'catTasksDesc',
}))

type ModuleKey = (typeof workspaceModuleKeys)[number]

const widgets = [
  { value: 'tasks', label: 'widgetMyTasks' },
  { value: 'schedule', label: 'widgetSchedule' },
  { value: 'documents', label: 'widgetRecentDocuments' },
  { value: 'calendar', label: 'widgetCalendar' },
  { value: 'activity', label: 'widgetActivity' },
  { value: 'members', label: 'widgetMembers' },
  { value: 'expenses', label: 'widgetExpenses' },
  { value: 'bookings', label: 'widgetBookings' },
] as const

const themes = [
  { value: 'ocean', label: 'themeOcean', swatch: 'from-blue-500 to-cyan-400' },
  {
    value: 'forest',
    label: 'themeForest',
    swatch: 'from-emerald-600 to-lime-400',
  },
  { value: 'harbor', label: 'themeHarbor', swatch: 'from-sky-800 to-cyan-500' },
  {
    value: 'violet',
    label: 'themeViolet',
    swatch: 'from-violet-600 to-fuchsia-400',
  },
  {
    value: 'amber',
    label: 'themeAmber',
    swatch: 'from-orange-500 to-amber-300',
  },
  {
    value: 'slate',
    label: 'themeSlate',
    swatch: 'from-slate-700 to-slate-400',
  },
] as const

type WidgetKey = (typeof widgets)[number]['value']
type ThemeKey = (typeof themes)[number]['value']

function Settings() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('custom')
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>([
    'tasks',
    'documents',
    'members',
  ])
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetKey[]>([
    'tasks',
    'schedule',
    'documents',
    'calendar',
    'activity',
  ])
  const [theme, setTheme] = useState<ThemeKey>('ocean')

  const create = useMutation({
    mutationFn: () =>
      createWorkspaceFn({
        data: {
          name,
          workspaceType,
          ...(workspaceType === 'custom'
            ? {
                customTemplate: {
                  theme,
                  modules: selectedModules,
                  dashboardWidgets: selectedWidgets,
                },
              }
            : {}),
        },
      }),
    onSuccess: async (workspace) => {
      setName('')
      navigate({ to: '/app', search: { ws: workspace.id }, replace: true })
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings')}</h1>
        <p className="text-muted-foreground">{t('createManageWorkspaces')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('createWorkspaceTitle')}
          </CardTitle>
          <CardDescription>{t('workspaceIsShared')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim()) create.mutate()
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('name')}</label>
              <input
                className="h-8 rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('mySharedSpace')}
              />
            </div>

            {workspaceType === 'custom' && (
              <div className="flex flex-col gap-5 rounded-xl border bg-muted/25 p-4">
                <div>
                  <h2 className="text-sm font-semibold">
                    {t('customizeWorkspace')}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('customizeHint')}
                  </p>
                </div>

                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium">
                    {t('modules')}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {modules.map((module) => {
                      const checked = selectedModules.includes(module.value)
                      return (
                        <label
                          key={module.value}
                          className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-background px-3 py-2.5 transition hover:border-primary/50"
                        >
                          <input
                            className="mt-0.5 size-4 accent-primary"
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedModules((current) =>
                                checked
                                  ? current.filter(
                                      (value) => value !== module.value,
                                    )
                                  : [...current, module.value],
                              )
                            }
                          />
                          <span>
                            <span className="block text-sm font-medium">
                              {t(module.labelKey)}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {t(module.descriptionKey)}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium">
                    {t('dashboardWidgets')}
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {widgets.map((widget) => {
                      const checked = selectedWidgets.includes(widget.value)
                      return (
                        <label
                          key={widget.value}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-xs font-medium transition hover:border-primary/50"
                        >
                          <input
                            className="sr-only"
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedWidgets((current) =>
                                checked
                                  ? current.filter(
                                      (value) => value !== widget.value,
                                    )
                                  : [...current, widget.value],
                              )
                            }
                          />
                          <span
                            className={`grid size-4 place-items-center rounded border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'}`}
                          >
                            {checked && <Check className="size-3" />}
                          </span>
                          {t(widget.label)}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium">
                    {t('workspaceStyle')}
                  </legend>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {themes.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        className={`relative overflow-hidden rounded-lg border p-1 text-left transition ${theme === option.value ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}
                      >
                        <span
                          className={`block h-10 rounded-md bg-gradient-to-br ${option.swatch}`}
                        />
                        <span className="block px-1 pb-1 pt-1.5 text-xs font-medium">
                          {t(option.label)}
                        </span>
                        {theme === option.value && (
                          <Check className="absolute right-2 top-2 size-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('type')}</label>
              <select
                className="h-8 rounded-lg border bg-transparent px-3 text-sm outline-none"
                value={workspaceType}
                onChange={(e) =>
                  setWorkspaceType(e.target.value as WorkspaceType)
                }
              >
                {workspaceTypes.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                    className="bg-background text-foreground"
                  >
                    {t(type.label)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {t(
                  workspaceTypes.find((type) => type.value === workspaceType)
                    ?.description ?? 'typeCustomDesc',
                )}
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                !name.trim() ||
                create.isPending ||
                (workspaceType === 'custom' &&
                  (!selectedModules.length || !selectedWidgets.length))
              }
            >
              {create.isPending ? t('creating') : t('createWorkspace')}
            </Button>
            {create.isError && (
              <p className="text-sm text-destructive">{t('couldNotCreate')}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <ManageWorkspaceModules />
    </div>
  )
}

function ManageWorkspaceModules() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspacesContext()
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<ModuleKey[]>([])
  const [theme, setTheme] = useState<ThemeKey>('ocean')

  const type = activeWorkspace
    ? (activeWorkspace.workspaceType as Parameters<
        typeof getWorkspaceSettings
      >[0])
    : 'custom'
  const settings = activeWorkspace
    ? getWorkspaceSettings(
        type,
        activeWorkspace.settings as Record<string, unknown> | null,
      )
    : null
  const enabled = settings?.modules ?? []
  const pool = settings?.modulePool ?? getModulePool(type)
  const isCustom = type === 'custom'

  useEffect(() => {
    setSelected(enabled)
  }, [activeWorkspaceId])

  useEffect(() => {
    setTheme(settings?.theme ?? 'ocean')
  }, [activeWorkspaceId])

  const sync = (next: ModuleKey[]) => setSelected(next.length ? next : [])

  const move = (index: number, direction: -1 | 1) => {
    setSelected((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const update = useMutation({
    mutationFn: (next: ModuleKey[]) =>
      updateWorkspaceModulesFn({
        data: {
          workspaceId: activeWorkspaceId!,
          modules: next,
          moduleOrder: next,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-records'] })
    },
  })

  const themeUpdate = useMutation({
    mutationFn: (next: ThemeKey) =>
      updateWorkspaceThemeFn({
        data: { workspaceId: activeWorkspaceId!, theme: next },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  const dirty =
    JSON.stringify([...selected].sort()) !== JSON.stringify([...enabled].sort())
  const themeDirty = theme !== settings?.theme
  const poolModules = modules.filter((module) =>
    (pool as readonly string[]).includes(module.value),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('workspaceModules')}</CardTitle>
        <CardDescription>
          {isCustom
            ? t('workspaceModulesHint')
            : t('workspaceModulesTemplateHint')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!activeWorkspace ? (
          <p className="text-sm text-muted-foreground">
            {t('noActiveWorkspace')}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {selected.map((value, index) => {
                const module = modules.find((m) => m.value === value)
                if (!module || !(pool as readonly string[]).includes(value)) {
                  return null
                }
                return (
                  <div
                    key={value}
                    className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {t(module.labelKey)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t(module.descriptionKey)}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`${t('moveUp')} ${t(module.labelKey)}`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="grid size-7 place-items-center rounded-md border text-muted-foreground transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/5"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t('moveDown')} ${t(module.labelKey)}`}
                      disabled={index === selected.length - 1}
                      onClick={() => move(index, 1)}
                      className="grid size-7 place-items-center rounded-md border text-muted-foreground transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/5"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t('disable')} ${t(module.labelKey)}`}
                      onClick={() => sync(selected.filter((v) => v !== value))}
                      className="grid size-7 place-items-center rounded-md border text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>

            {poolModules.filter((m) => !selected.includes(m.value)).length >
              0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('disabledModules')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {poolModules
                    .filter((m) => !selected.includes(m.value))
                    .map((module) => (
                      <button
                        key={module.value}
                        type="button"
                        onClick={() => sync([...selected, module.value])}
                        className="flex items-center gap-2.5 rounded-lg border border-dashed bg-background px-3 py-2.5 text-left transition hover:border-primary/50"
                      >
                        <Plus className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {t(module.labelKey)}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => update.mutate(selected)}
                disabled={!dirty || update.isPending || !selected.length}
              >
                {update.isPending ? t('saving') : t('saveModules')}
              </Button>
              {update.isError && (
                <p className="text-sm text-destructive">
                  {t('couldNotUpdateModules')}
                </p>
              )}
              {update.isSuccess && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {t('modulesUpdated')}
                </p>
              )}
            </div>

            {isCustom && (
              <div className="mt-2 flex flex-col gap-3 rounded-xl border bg-muted/25 p-4">
                <div>
                  <h2 className="text-sm font-semibold">
                    {t('workspaceStyle')}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('onlyCustomStyle')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {themes.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`relative overflow-hidden rounded-lg border p-1 text-left transition ${theme === option.value ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}
                    >
                      <span
                        className={`block h-10 rounded-md bg-gradient-to-br ${option.swatch}`}
                      />
                      <span className="block px-1 pb-1 pt-1.5 text-xs font-medium">
                        {t(option.label)}
                      </span>
                      {theme === option.value && (
                        <Check className="absolute right-2 top-2 size-3.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => themeUpdate.mutate(theme)}
                    disabled={!themeDirty || themeUpdate.isPending}
                  >
                    {themeUpdate.isPending ? t('saving') : t('saveStyle')}
                  </Button>
                  {themeUpdate.isError && (
                    <p className="text-sm text-destructive">
                      {t('couldNotUpdateStyle')}
                    </p>
                  )}
                  {themeUpdate.isSuccess && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {t('styleUpdated')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
