import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  BookOpen,
  Boxes,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  CircleDollarSign,
  Fuel,
  FileText,
  FolderKanban,
  Gauge,
  KeyRound,
  Lightbulb,
  ListTodo,
  Plus,
  ShieldAlert,
  ShipWheel,
  SlidersHorizontal,
  UserRoundCheck,
  Users,
  WalletCards,
} from 'lucide-react'

import { useWorkspacesContext } from '#/features/app/workspace-context'
import { getWorkspaceSettings } from '#/server/workspaces/templates'
import type {
  DashboardWidget,
  WorkspaceModuleKey,
} from '#/server/workspaces/templates'
import { getTasks } from '#/server/api/tasks'
import { getDocuments } from '#/server/api/documents'
import { getUnreadCount } from '#/server/api/notifications'
import { getMembers } from '#/server/api/members'
import { getWorkspaceRecords } from '#/server/api/records'
import type { WorkspaceRecordType } from '#/server/records/service'
import { Button } from '#/components/ui/button'
import { useI18n } from '#/lib/i18n'

export const Route = createFileRoute('/app/')({ component: Dashboard })

const themePalettes = {
  ocean: {
    icon: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-600 via-sky-700 to-blue-800',
  },
  forest: {
    icon: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    gradient: 'from-emerald-600 via-green-700 to-lime-800',
  },
  harbor: {
    icon: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
    gradient: 'from-sky-700 via-blue-800 to-slate-900',
  },
  violet: {
    icon: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
    gradient: 'from-violet-600 via-indigo-700 to-purple-800',
  },
  amber: {
    icon: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-500 via-orange-600 to-rose-700',
  },
  slate: {
    icon: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
    gradient: 'from-slate-600 via-slate-700 to-slate-900',
  },
} as const

const widgetModule: Record<DashboardWidget, WorkspaceModuleKey | null> = {
  tasks: 'tasks',
  schedule: 'tasks',
  documents: 'documents',
  calendar: 'bookings',
  activity: null,
  members: 'members',
  expenses: 'expenses',
  bookings: 'bookings',
}

const recordTypeModule: Record<WorkspaceRecordType, WorkspaceModuleKey> = {
  meter: 'meters',
  inventory: 'inventory',
  resident: 'residents',
  board_card: 'board',
  backlog_item: 'backlog',
  sprint: 'sprints',
  time_entry: 'time',
  roadmap_item: 'roadmap',
  resource: 'resources',
  risk: 'risks',
  logbook_entry: 'logbook',
  access_key: 'access',
  cabin_info: 'cabin_info',
  utility: 'utilities',
  berth: 'berths',
  insight: 'insights',
  message: 'messages',
}

function Dashboard() {
  const { activeWorkspace, workspaces, isLoading } = useWorkspacesContext()
  const { t } = useI18n()

  if (isLoading)
    return <p className="text-muted-foreground">{t('loadingWorkspaces')}</p>

  if (!workspaces || workspaces.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed bg-card p-10 text-center shadow-sm">
        <FolderKanban className="mx-auto mb-4 size-9 text-emerald-500" />
        <h1 className="text-2xl font-bold tracking-tight">
          {t('createFirstWorkspace')}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {t('workspaceKeepsTogether')}
        </p>
        <Button asChild className="mt-5">
          <Link to="/app/settings">
            <Plus /> {t('createWorkspace')}
          </Link>
        </Button>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {activeWorkspace && <Summary activeWorkspace={activeWorkspace} />}
    </div>
  )
}

function Summary({
  activeWorkspace,
}: {
  activeWorkspace: NonNullable<
    ReturnType<typeof useWorkspacesContext>['activeWorkspace']
  >
}) {
  const activeWorkspaceId = activeWorkspace.id
  const { t } = useI18n()
  const settings = getWorkspaceSettings(
    activeWorkspace.workspaceType as Parameters<typeof getWorkspaceSettings>[0],
    activeWorkspace.settings as Record<string, unknown> | null,
  )
  const widgetsBase = new Set(settings.dashboardWidgets)
  const enabledModules = new Set(settings.modules)
  const widgets = new Set(
    Array.from(widgetsBase).filter((widget) => {
      const module = widgetModule[widget]
      return module === null || enabledModules.has(module)
    }),
  )
  const palette = themePalettes[settings.theme]
  const isBoatWorkspace = settings.template === 'boat'
  const tasks = useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: () => getTasks({ data: { workspaceId: activeWorkspaceId } }),
  })
  const documents = useQuery({
    queryKey: ['documents', activeWorkspaceId],
    queryFn: () => getDocuments({ data: { workspaceId: activeWorkspaceId } }),
  })
  const members = useQuery({
    queryKey: ['members', activeWorkspaceId],
    queryFn: () => getMembers({ data: { workspaceId: activeWorkspaceId } }),
  })
  const unread = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => getUnreadCount(),
  })
  const records = useQuery({
    queryKey: [
      'workspace-record-summary',
      activeWorkspaceId,
      settings.template,
    ],
    queryFn: async () => {
      const types = templateRecordTypes(settings.template)
      const results = await Promise.all(
        types.map((type) =>
          getWorkspaceRecords({
            data: { workspaceId: activeWorkspaceId, type },
          }),
        ),
      )
      return Object.fromEntries(
        types.map((type, index) => [type, results[index]]),
      )
    },
    enabled: templateRecordTypes(settings.template).length > 0,
  })

  const openTasks =
    tasks.data?.filter(
      (task) => task.status !== 'done' && task.status !== 'cancelled',
    ) ?? []
  const completedTasks =
    tasks.data?.filter((task) => task.status === 'done').length ?? 0
  const documentsList = documents.data ?? []
  const recordSummary = records.data ?? {}

  const stats = [
    {
      label: t('openTasks'),
      value: tasks.isLoading ? '...' : openTasks.length,
      detail: `${completedTasks} ${t('completed')}`,
      icon: CheckSquare,
      tone: palette.icon,
    },
    {
      label: t('documentsLabel'),
      value: documents.isLoading ? '...' : documentsList.length,
      detail: t('sharedWithTeam'),
      icon: FileText,
      tone: palette.icon,
    },
    {
      label: t('membersLabel'),
      value: members.isLoading ? '...' : (members.data?.length ?? 0),
      detail: t('activeCollaborators'),
      icon: Users,
      tone: palette.icon,
    },
    {
      label: t('updates'),
      value: unread.isLoading ? '...' : (unread.data ?? 0),
      detail: t('unreadNotifications'),
      icon: Bell,
      tone: palette.icon,
    },
    ...buildTemplateStats(
      settings.template,
      recordSummary,
      palette.icon,
      records.isLoading,
      enabledModules,
      t,
    ),
  ]

  if (isBoatWorkspace) {
    return (
      <BoatDashboard
        activeWorkspace={activeWorkspace}
        activeWorkspaceId={activeWorkspaceId}
        openTasks={openTasks}
        documents={documentsList}
        records={recordSummary}
      />
    )
  }

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:border-white/5 dark:bg-[#0c1b29]"
          >
            <div className="flex items-start justify-between">
              <span
                className={`grid size-9 place-items-center rounded-lg ${stat.tone}`}
              >
                <stat.icon className="size-4.5" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t('thisWorkspace')}
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {widgets.has('tasks') && (
          <Panel
            title={t('myTasks')}
            action={t('viewAll')}
            to="/app/tasks"
            workspaceId={activeWorkspaceId}
          >
            {openTasks.length ? (
              openTasks
                .slice(0, 5)
                .map((task) => (
                  <TaskRow
                    key={task.id}
                    title={task.title}
                    dueDate={task.dueDate}
                    priority={task.priority}
                    noDueDate={t('noDueDate')}
                  />
                ))
            ) : (
              <EmptyState icon={ListTodo} text={t('noOpenTasks')} />
            )}
          </Panel>
        )}
        {widgets.has('schedule') && (
          <Panel
            title={t('upcomingSchedule')}
            action={t('openCalendar')}
            to="/app/tasks"
            workspaceId={activeWorkspaceId}
          >
            <ScheduleRow
              title={t('planNextSession')}
              date={t('pickDate')}
              accent="bg-emerald-400"
            />
            <ScheduleRow
              title={t('reviewActivity')}
              date={t('thisWeek')}
              accent="bg-cyan-400"
            />
            <ScheduleRow
              title={t('shareUpdates')}
              date={t('whenReady')}
              accent="bg-violet-400"
            />
          </Panel>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        {widgets.has('documents') && (
          <Panel
            title={t('recentDocuments')}
            action={t('viewAll')}
            to="/app/documents"
            workspaceId={activeWorkspaceId}
          >
            {documentsList.length ? (
              documentsList
                .slice(0, 4)
                .map((document) => (
                  <DocumentRow
                    key={document.id}
                    name={document.name}
                    sizeBytes={document.sizeBytes}
                    createdAt={document.createdAt}
                    fileLabel={t('file')}
                  />
                ))
            ) : (
              <EmptyState icon={FileText} text={t('noDocumentsYet')} />
            )}
          </Panel>
        )}
        {widgets.has('calendar') && (
          <Panel
            title={t('thisMonth')}
            action={t('viewTasks')}
            to="/app/tasks"
            workspaceId={activeWorkspaceId}
          >
            <CalendarPreview activeDays={[3, 10, 20]} />
          </Panel>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        {widgets.has('activity') && (
          <Panel
            title={t('workspaceActivity')}
            action={t('membersLabel')}
            to="/app/members"
            workspaceId={activeWorkspaceId}
          >
            <ActivityRow
              avatar="A"
              title={t('activityReady')}
              detail={t('inviteCollaborate')}
            />
            <ActivityRow
              avatar="T"
              title={`${openTasks.length} ${openTasks.length === 1 ? t('openTaskCount') : t('openTaskCountPlural')}`}
              detail={t('keepMoving')}
            />
            <ActivityRow
              avatar="D"
              title={`${documentsList.length} ${documentsList.length === 1 ? t('docCountAvailable') : t('docCountAvailablePlural')}`}
              detail={t('docsOrganized')}
            />
          </Panel>
        )}
        {widgets.has('bookings') ? (
          <BookingPanel palette={palette} t={t} />
        ) : widgets.has('expenses') ? (
          <ExpensePanel palette={palette} t={t} />
        ) : widgets.has('members') ? (
          <Panel
            title={t('membersLabel')}
            action={t('viewAll')}
            to="/app/members"
            workspaceId={activeWorkspaceId}
          >
            <MemberSummary count={members.data?.length ?? 0} t={t} />
          </Panel>
        ) : (
          <article
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${palette.gradient} p-6 text-white shadow-[0_12px_35px_rgb(5,150,105,0.22)]`}
          >
            <span className="absolute -right-12 -top-16 size-48 rounded-full bg-white/10" />
            <span className="absolute -bottom-14 -left-10 size-40 rounded-full bg-cyan-300/15" />
            <div className="relative">
              <FolderKanban className="size-7" />
              <h2 className="mt-10 max-w-52 text-lg font-bold leading-snug">
                {t('smallSteps')}
              </h2>
              <p className="mt-2 max-w-64 text-sm text-white/80">
                {t('keepEveryoneInSync')}
              </p>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="mt-5 text-emerald-800"
              >
                <Link to="/app/settings" search={{ ws: activeWorkspaceId }}>
                  {t('workspaceSettings')} <ChevronRight />
                </Link>
              </Button>
            </div>
          </article>
        )}
      </section>
      {settings.template === 'agile_project' && (
        <section className="grid gap-4 xl:grid-cols-4">
          {enabledModules.has('backlog') && (
            <AgileColumn
              title={t('backlog')}
              count={recordSummary.backlog_item?.length ?? 0}
              t={t}
            />
          )}
          <AgileColumn title={t('toDo')} count={openTasks.length} t={t} />
          <AgileColumn
            title={t('inProgress')}
            count={
              tasks.data?.filter((task) => task.status === 'in_progress')
                .length ?? 0
            }
            t={t}
          />
          {enabledModules.has('risks') && (
            <AgileColumn
              title={t('risks')}
              count={recordSummary.risk?.length ?? 0}
              t={t}
            />
          )}
        </section>
      )}
    </>
  )
}

function BoatDashboard({
  activeWorkspace,
  activeWorkspaceId,
  openTasks,
  documents,
  records,
}: {
  activeWorkspace: NonNullable<
    ReturnType<typeof useWorkspacesContext>['activeWorkspace']
  >
  activeWorkspaceId: string
  openTasks: Array<{
    id: string
    title: string
    dueDate: Date | string | null
    priority: 'low' | 'medium' | 'high'
  }>
  documents: Array<{
    id: string
    name: string
    sizeBytes: number | null
    createdAt: Date | string
  }>
  records: RecordSummary
}) {
  const { t } = useI18n()
  const logbookEntries = records.logbook_entry?.length ?? 0
  const inventoryItems = records.inventory?.length ?? 0
  const berthEntries = records.berth?.length ?? 0

  return (
    <div className="-mx-4 -mt-7 min-h-screen bg-[#eef7ff] px-4 pb-10 pt-7 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <section className="boat-hero relative overflow-hidden rounded-b-[2rem] px-5 pb-12 pt-6 sm:px-8">
        <div className="relative z-10 flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-800/70">
            {t('yourVessel')}
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {activeWorkspace.name} <span aria-hidden="true">🛥️</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 sm:text-base">
            {t('keepShipshape')}
          </p>
        </div>
        <div className="boat-wave boat-wave-one" />
        <div className="boat-wave boat-wave-two" />
      </section>

      <section className="relative z-10 -mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BoatStat
          label={t('logbookEntries')}
          value={logbookEntries}
          detail={t('tripsAndNotes')}
          icon={BookOpen}
        />
        <BoatStat
          label={t('openMaintenance')}
          value={openTasks.length}
          detail={t('keepReady')}
          icon={CheckSquare}
        />
        <BoatStat
          label={t('inventory')}
          value={inventoryItems}
          detail={t('onBoard')}
          icon={Boxes}
        />
        <BoatStat
          label={t('harbourBerth')}
          value={berthEntries}
          detail={t('savedLocations')}
          icon={ShipWheel}
        />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.68fr]">
        <Panel
          title={t('recentLogbook')}
          action={t('openLogbook')}
          to="/app/logbook"
          workspaceId={activeWorkspaceId}
        >
          {logbookEntries ? (
            <div className="px-2 py-2 text-sm text-muted-foreground">
              {logbookEntries}{' '}
              {logbookEntries === 1 ? t('entrySingular') : t('entryPlural')}{' '}
              {t('recordedForVessel')}
            </div>
          ) : (
            <EmptyState icon={BookOpen} text={t('logNextTrip')} />
          )}
        </Panel>
        <Panel
          title={t('maintenance')}
          action={t('viewTasks')}
          to="/app/tasks"
          workspaceId={activeWorkspaceId}
        >
          {openTasks.length ? (
            openTasks
              .slice(0, 4)
              .map((task) => (
                <TaskRow
                  key={task.id}
                  title={task.title}
                  dueDate={task.dueDate}
                  priority={task.priority}
                  noDueDate={t('noDueDate')}
                />
              ))
          ) : (
            <EmptyState icon={CheckSquare} text={t('noMaintenanceDue')} />
          )}
        </Panel>
        <aside className="rounded-xl border border-blue-100 bg-white p-4 shadow-[0_8px_30px_rgb(15,76,129,0.08)]">
          <h2 className="font-bold tracking-tight">{t('quickActions')}</h2>
          <div className="mt-4 grid gap-2">
            <Link
              to="/app/logbook"
              search={{ ws: activeWorkspaceId }}
              className="rounded-lg bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              <BookOpen className="mr-2 inline size-4" /> {t('logTrip')}
            </Link>
            <Link
              to="/app/tasks"
              search={{ ws: activeWorkspaceId }}
              className="rounded-lg bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              <CheckSquare className="mr-2 inline size-4" />
              {t('addMaintenance')}
            </Link>
            <Link
              to="/app/documents"
              search={{ ws: activeWorkspaceId }}
              className="rounded-lg bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              <FileText className="mr-2 inline size-4" /> {t('documents')}
            </Link>
          </div>
        </aside>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={t('documentsOnBoard')}
          action={t('viewAll')}
          to="/app/documents"
          workspaceId={activeWorkspaceId}
        >
          {documents.length ? (
            documents
              .slice(0, 4)
              .map((document) => (
                <DocumentRow
                  key={document.id}
                  name={document.name}
                  sizeBytes={document.sizeBytes}
                  createdAt={document.createdAt}
                  fileLabel={t('file')}
                />
              ))
          ) : (
            <EmptyState
              icon={FileText}
              text="Manuals, insurance, and other vessel documents appear here."
            />
          )}
        </Panel>
        <article className="rounded-xl border border-blue-100 bg-white p-5 shadow-[0_8px_30px_rgb(15,76,129,0.08)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {t('fuel')}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {t('readyToLog')}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-blue-100 text-blue-700">
              <Fuel className="size-5" />
            </span>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-600 to-sky-400" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t('fuelHint')}</p>
        </article>
      </section>
    </div>
  )
}

function BoatStat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string | number
  detail: string
  icon: typeof CheckSquare
}) {
  return (
    <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-[0_8px_30px_rgb(15,76,129,0.08)]">
      <Icon className="size-5 text-blue-700" />
      <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  )
}

type StatItem = {
  label: string
  value: string | number
  detail: string
  icon: typeof CheckSquare
  tone: string
}

type RecordSummary = Record<
  string,
  Array<{ status: string | null }> | undefined
>

function templateRecordTypes(template: string): WorkspaceRecordType[] {
  switch (template) {
    case 'housing_board':
      return ['meter', 'inventory', 'resident']
    case 'cabin':
      return ['cabin_info', 'access_key', 'utility']
    case 'boat':
      return ['logbook_entry', 'inventory', 'berth']
    case 'project':
      return ['risk', 'resource', 'time_entry']
    case 'agile_project':
      return ['board_card', 'backlog_item', 'sprint', 'risk']
    case 'association':
      return ['resident', 'insight', 'logbook_entry']
    default:
      return []
  }
}

function buildTemplateStats(
  template: string,
  summary: RecordSummary,
  tone: string,
  isLoading: boolean,
  enabledModules: ReadonlySet<WorkspaceModuleKey>,
  t: ReturnType<typeof useI18n>['t'],
): StatItem[] {
  const count = (
    key: string,
    label: string,
    icon: typeof CheckSquare,
  ): StatItem | null => {
    const module = recordTypeModule[key as WorkspaceRecordType]
    if (module && !enabledModules.has(module)) return null
    return {
      label,
      value: isLoading ? '...' : (summary[key]?.length ?? 0),
      detail: `${summary[key]?.length ?? 0} ${t('totalSuffix')}`,
      icon,
      tone,
    }
  }

  const combine = (items: Array<StatItem | null>) =>
    items.filter((item): item is StatItem => item !== null)

  switch (template) {
    case 'housing_board':
      return combine([
        count('meter', t('statMeterReadings'), Gauge),
        count('inventory', t('statInventoryItems'), Boxes),
        count('resident', t('statResidents'), UserRoundCheck),
      ])
    case 'cabin':
      return combine([
        count('cabin_info', t('statCabinNotes'), Lightbulb),
        count('access_key', t('statKeysAccess'), KeyRound),
        count('utility', t('statUtilities'), SlidersHorizontal),
      ])
    case 'boat':
      return combine([
        count('logbook_entry', t('statLogbookEntries'), BookOpen),
        count('inventory', t('statInventoryItems'), Boxes),
        count('berth', t('statHarbourBerth'), ShipWheel),
      ])
    case 'project':
      return combine([
        count('risk', t('statRisks'), ShieldAlert),
        count('resource', t('statResources'), Users),
        count('time_entry', t('statTimeEntries'), WalletCards),
      ])
    case 'association':
      return combine([
        count('resident', t('statResidents'), UserRoundCheck),
        count('insight', t('statInsights'), Lightbulb),
        count('logbook_entry', t('statLogbook'), BookOpen),
      ])
    default:
      return []
  }
}

function Panel({
  title,
  action,
  to,
  workspaceId,
  children,
}: {
  title: string
  action: string
  to: '/app/tasks' | '/app/documents' | '/app/members' | '/app/logbook'
  workspaceId: string
  children: React.ReactNode
}) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:border-white/5 dark:bg-[#0c1b29]">
      <header className="flex items-center justify-between px-4 pb-3 pt-4">
        <h2 className="font-bold tracking-tight">{title}</h2>
        <Link
          to={to}
          search={{ ws: workspaceId }}
          className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          {action}
        </Link>
      </header>
      <div className="px-3 pb-3">{children}</div>
    </article>
  )
}

function BookingPanel({
  palette,
  t,
}: {
  palette: (typeof themePalettes)[keyof typeof themePalettes]
  t: ReturnType<typeof useI18n>['t']
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${palette.gradient} p-6 text-white shadow-[0_12px_35px_rgb(5,150,105,0.22)]`}
    >
      <span className="absolute -right-12 -top-16 size-48 rounded-full bg-white/10" />
      <div className="relative">
        <CalendarCheck className="size-7" />
        <h2 className="mt-10 text-lg font-bold">{t('upcomingBookings')}</h2>
        <p className="mt-2 max-w-64 text-sm text-white/80">
          {t('bookingsOverview')}
        </p>
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-white/12 px-3 py-2 text-sm font-semibold">
          <BookOpen className="size-4" /> {t('noUpcomingBookings')}
        </div>
      </div>
    </article>
  )
}

function ExpensePanel({
  palette,
  t,
}: {
  palette: (typeof themePalettes)[keyof typeof themePalettes]
  t: ReturnType<typeof useI18n>['t']
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${palette.gradient} p-6 text-white shadow-[0_12px_35px_rgb(5,150,105,0.22)]`}
    >
      <span className="absolute -right-12 -top-16 size-48 rounded-full bg-white/10" />
      <div className="relative">
        <CircleDollarSign className="size-7" />
        <h2 className="mt-10 text-lg font-bold">{t('sharedExpenses')}</h2>
        <p className="mt-2 max-w-64 text-sm text-white/80">
          {t('expensesOverview')}
        </p>
        <p className="mt-5 text-3xl font-bold">kr 0</p>
        <p className="text-sm text-white/75">{t('noExpensesRecorded')}</p>
      </div>
    </article>
  )
}

function MemberSummary({
  count,
  t,
}: {
  count: number
  t: ReturnType<typeof useI18n>['t']
}) {
  return (
    <div className="grid min-h-44 place-items-center px-6 text-center">
      <div>
        <Users className="mx-auto mb-2 size-6 text-slate-300 dark:text-slate-600" />
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-sm text-muted-foreground">
          {count === 1 ? t('activeMember') : t('activeMemberPlural')}
        </p>
      </div>
    </div>
  )
}

function AgileColumn({
  title,
  count,
  t,
}: {
  title: string
  count: number
  t: ReturnType<typeof useI18n>['t']
}) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:border-white/5 dark:bg-[#0c1b29]">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{title}</h2>
        <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
          {count}
        </span>
      </header>
      <div className="mt-3 min-h-28 rounded-lg border border-dashed border-slate-200 p-3 text-sm text-muted-foreground dark:border-white/10">
        {count
          ? `${count} ${count === 1 ? t('itemInColumn') : t('itemInColumnPlural')}`
          : t('noItemsYet')}
      </div>
    </article>
  )
}

function TaskRow({
  title,
  dueDate,
  priority,
  noDueDate,
}: {
  title: string
  dueDate: Date | string | null
  priority: 'low' | 'medium' | 'high'
  noDueDate: string
}) {
  const due = dueDate
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(new Date(dueDate))
    : noDueDate
  const color =
    priority === 'high'
      ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300'
      : priority === 'medium'
        ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
        : 'bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300'
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/4">
      <span className="size-4 rounded border-2 border-slate-300 dark:border-slate-600" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {title}
      </span>
      <span
        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${color}`}
      >
        {due}
      </span>
    </div>
  )
}

function ScheduleRow({
  title,
  date,
  accent,
}: {
  title: string
  date: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-50 dark:hover:bg-white/4">
      <span className={`h-9 w-1 rounded-full ${accent}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </span>
      <CalendarDays className="size-4 text-muted-foreground" />
    </div>
  )
}

function DocumentRow({
  name,
  sizeBytes,
  createdAt,
  fileLabel,
}: {
  name: string
  sizeBytes: number | null
  createdAt: Date | string
  fileLabel: string
}) {
  const size = sizeBytes
    ? `${(sizeBytes / 1024 / 1024).toFixed(sizeBytes > 1024 * 1024 ? 1 : 0)} MB`
    : fileLabel
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(createdAt))
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/4">
      <span className="grid size-8 place-items-center rounded-lg bg-rose-500/12 text-rose-600 dark:text-rose-300">
        <FileText className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className="text-xs text-muted-foreground">
          {date} · {size}
        </span>
      </span>
    </div>
  )
}

function ActivityRow({
  avatar,
  title,
  detail,
}: {
  avatar: string
  title: string
  detail: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/4">
      <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-900 text-xs font-bold text-white">
        {avatar}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {detail}
        </span>
      </span>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: typeof ListTodo
  text: string
}) {
  return (
    <div className="grid min-h-44 place-items-center px-6 text-center">
      <div>
        <Icon className="mx-auto mb-2 size-6 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

function CalendarPreview({ activeDays }: { activeDays: number[] }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const blanks = Array.from({ length: 2 })
  const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1)
  return (
    <div className="px-2 pb-2">
      <div className="mb-3 text-sm font-semibold">
        {new Intl.DateTimeFormat('en-US', {
          month: 'long',
          year: 'numeric',
        }).format(new Date())}
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center text-[11px]">
        {days.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="font-semibold text-muted-foreground"
          >
            {day}
          </span>
        ))}
        {blanks.map((_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {calendarDays.map((day) => (
          <span
            key={day}
            className={`mx-auto grid size-6 place-items-center rounded-full font-medium ${activeDays.includes(day) ? 'bg-emerald-500 text-white shadow-sm' : 'text-foreground'}`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  )
}
