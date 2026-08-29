import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useClerk } from '@clerk/tanstack-react-start'
import {
  Bell,
  Anchor,
  BookOpen,
  Boxes,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  Clock3,
  Gauge,
  KeyRound,
  Lightbulb,
  Map,
  MessageSquare,
  FileText,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Settings,
  ShieldAlert,
  ShipWheel,
  SlidersHorizontal,
  Sun,
  User,
  UserRoundCheck,
  Users,
  WalletCards,
} from 'lucide-react'

import { getMe, getWorkspaces } from '#/server/api/workspaces'
import { getUnreadCount } from '#/server/api/notifications'
import { WorkspaceContext } from '#/features/app/workspace-context'
import { getWorkspaceSettings } from '#/server/workspaces/templates'
import type { WorkspaceModuleKey } from '#/server/workspaces/templates'
import { useTheme } from '#/hooks/use-theme'
import { useI18n } from '#/lib/i18n'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

export const Route = createFileRoute('/app')({
  validateSearch: (search: Record<string, unknown>): { ws?: string } => ({
    ws: typeof search.ws === 'string' ? search.ws : undefined,
  }),
  loader: async () => {
    const user = await getMe()
    if (!user) return { user: null }
    const workspaces = await getWorkspaces()
    return { user, workspaces }
  },
  component: AppLayout,
})

const navItems = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, exact: true },
]

const settingsNavItem = {
  to: '/app/settings',
  label: 'Settings',
  icon: Settings,
}

const moduleLabelKeys = {
  tasks: 'tasks',
  documents: 'documents',
  members: 'members',
  messages: 'messages',
  meters: 'meters',
  inventory: 'inventory',
  residents: 'residents',
  board: 'board',
  backlog: 'backlog',
  sprints: 'sprints',
  time: 'timeCost',
  roadmap: 'roadmap',
  resources: 'resources',
  risks: 'risks',
  logbook: 'logbook',
  access: 'access',
  cabin_info: 'cabinInfo',
  utilities: 'utilities',
  berths: 'berths',
  insights: 'insights',
} as const

const coreModuleNavItems = [
  { key: 'tasks', to: '/app/tasks', label: 'Tasks', icon: ListTodo },
  {
    key: 'documents',
    to: '/app/documents',
    label: 'Documents',
    icon: FileText,
  },
  { key: 'members', to: '/app/members', label: 'Members', icon: Users },
] as const

const moduleNavItems = [
  {
    key: 'messages',
    to: '/app/messages',
    label: 'Messages',
    icon: MessageSquare,
  },
  { key: 'meters', to: '/app/meters', label: 'Meters', icon: Gauge },
  { key: 'inventory', to: '/app/inventory', label: 'Inventory', icon: Boxes },
  {
    key: 'residents',
    to: '/app/residents',
    label: 'Residents',
    icon: UserRoundCheck,
  },
  { key: 'board', to: '/app/board', label: 'Board', icon: ClipboardList },
  { key: 'backlog', to: '/app/backlog', label: 'Backlog', icon: ListTodo },
  { key: 'sprints', to: '/app/sprints', label: 'Sprints', icon: Clock3 },
  { key: 'time', to: '/app/time', label: 'Time & cost', icon: WalletCards },
  { key: 'roadmap', to: '/app/roadmap', label: 'Roadmap', icon: Map },
  { key: 'resources', to: '/app/resources', label: 'Resources', icon: Users },
  { key: 'risks', to: '/app/risks', label: 'Risks', icon: ShieldAlert },
  { key: 'logbook', to: '/app/logbook', label: 'Logbook', icon: BookOpen },
  { key: 'access', to: '/app/access', label: 'Keys & access', icon: KeyRound },
  {
    key: 'cabin_info',
    to: '/app/cabin-info',
    label: 'Cabin info',
    icon: Lightbulb,
  },
  {
    key: 'utilities',
    to: '/app/utilities',
    label: 'Utilities',
    icon: SlidersHorizontal,
  },
  {
    key: 'berths',
    to: '/app/berths',
    label: 'Harbour & berth',
    icon: ShipWheel,
  },
  {
    key: 'insights',
    to: '/app/insights',
    label: 'Insights',
    icon: ChartNoAxesCombined,
  },
] as const

const allModuleNavItems = [...coreModuleNavItems, ...moduleNavItems] as const

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
      <span className="grid size-7 grid-cols-2 gap-1 rounded-lg bg-gradient-to-br from-blue-500/15 via-emerald-400/15 to-indigo-500/15 p-1">
        <span className="rounded-full bg-blue-500" />
        <span className="rounded-full bg-emerald-400" />
        <span className="rounded-full bg-indigo-600" />
        <span className="rounded-full bg-cyan-400" />
      </span>
      <span>SharedSpace</span>
    </Link>
  )
}

function LogoutMenuItem() {
  const { signOut } = useClerk()
  const { t } = useI18n()

  return (
    <DropdownMenuItem onSelect={() => signOut({ redirectUrl: '/' })}>
      <LogOut /> {t('signOut')}
    </DropdownMenuItem>
  )
}

function AppLayout() {
  const { user, workspaces } = Route.useLoaderData()
  const search = useSearch({ from: '/app' })
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const unreadNotifications = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => getUnreadCount(),
    enabled: Boolean(user),
  })

  const activeWorkspaceId =
    search.ws ??
    (workspaces && workspaces.length > 0 ? workspaces[0].id : undefined)

  const activeWorkspace = useMemo(
    () => workspaces?.find((workspace) => workspace.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId],
  )
  const settings = useMemo(
    () =>
      activeWorkspace
        ? getWorkspaceSettings(
            activeWorkspace.workspaceType,
            activeWorkspace.settings as Record<string, unknown> | null,
          )
        : null,
    [activeWorkspace],
  )
  const enabledModules = useMemo(
    () => new Set(settings?.modules ?? []),
    [settings],
  )

  const moduleItems = useMemo(() => {
    const items: Array<(typeof allModuleNavItems)[number]> = []
    const seen = new Set<string>()
    const add = (key: WorkspaceModuleKey) => {
      const item = allModuleNavItems.find((i) => i.key === key)
      if (item && !seen.has(key) && enabledModules.has(key)) {
        seen.add(key)
        items.push(item)
      }
    }
    for (const key of settings?.moduleOrder ?? []) add(key)
    for (const item of allModuleNavItems) add(item.key)
    return items
  }, [settings, enabledModules])
  const isBoatWorkspace = activeWorkspace?.workspaceType === 'boat'

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      isLoading: false,
    }),
    [workspaces, activeWorkspaceId, activeWorkspace],
  )

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <Badge variant="secondary">Authentication required</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Sign in to access your workspaces
        </h1>
        <p className="text-muted-foreground">
          Sign in to view your shared workspaces and collaborate with your team.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/sign-in/$" params={{ _splat: '' }}>
            <Button>{t('signIn')}</Button>
          </Link>
          <Button onClick={() => navigate({ to: '/' })} variant="outline">
            Back to home
          </Button>
        </div>
      </main>
    )
  }

  const selectWorkspace = (id: string) => {
    navigate({
      to: '/app',
      search: { ws: id },
      replace: true,
    })
  }

  const dropdownContentClass = isBoatWorkspace
    ? 'border border-white/15 bg-[#0a4a86] text-white shadow-xl [&_[data-slot=dropdown-menu-label]]:text-blue-200 [&_[data-slot=dropdown-menu-separator]]:bg-white/20 [&_[data-highlighted]]:bg-white/15 [&_[data-highlighted]]:text-white'
    : ''

  return (
    <WorkspaceContext.Provider value={value}>
      <div
        className={`min-h-screen ${isBoatWorkspace ? 'bg-[#eef7ff] dark:bg-[#111d2c]' : 'bg-[#f4f8ff] dark:bg-[#07121d]'}`}
      >
        <div className="flex min-h-screen">
          <aside
            className={`sticky top-0 hidden h-screen w-64 shrink-0 flex-col px-3 py-5 backdrop-blur lg:flex ${isBoatWorkspace ? 'border-r border-white/10 bg-[#063568] text-white' : 'border-r border-slate-200/70 bg-white/85 dark:border-white/5 dark:bg-[#091520]/90'}`}
          >
            <div className="flex items-center justify-between px-2">
              <Brand />
              <Link
                to="/app/notifications"
                search={{ ws: activeWorkspaceId }}
                activeProps={{ className: 'active' }}
                aria-label="Notifications"
                className={`relative grid size-9 place-items-center rounded-lg transition ${isBoatWorkspace ? 'text-blue-100 hover:bg-white/10 hover:text-white [&.active]:bg-white/20 [&.active]:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white [&.active]:bg-emerald-500/12 [&.active]:text-emerald-700 dark:[&.active]:bg-emerald-500/20 dark:[&.active]:text-emerald-300'}`}
              >
                <Bell className="size-4" />
                {(unreadNotifications.data ?? 0) > 0 && (
                  <span
                    className={`absolute right-2 top-2 size-1.5 rounded-full bg-rose-500 ring-2 ${isBoatWorkspace ? 'ring-[#063568]' : 'ring-white dark:ring-[#091520]'}`}
                  />
                )}
              </Link>
            </div>

            <div className="mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`h-auto w-full justify-between rounded-xl border px-2 py-2 text-left ${isBoatWorkspace ? 'border-white/15 bg-white/5 hover:bg-white/10 aria-expanded:bg-white/10' : 'border-slate-200/80 bg-white/50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'}`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {isBoatWorkspace ? (
                        <Anchor className="size-9 shrink-0 text-sky-200" />
                      ) : (
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs font-bold text-white">
                          {activeWorkspace?.name?.slice(0, 1).toUpperCase() ??
                            'W'}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-xs font-semibold ${isBoatWorkspace ? 'text-white' : 'text-foreground'}`}
                        >
                          {activeWorkspace?.name ?? 'No workspace'}
                        </span>
                        <span
                          className={`block truncate text-[11px] ${isBoatWorkspace ? 'text-blue-200' : 'text-muted-foreground'}`}
                        >
                          {workspaces?.length ?? 0} workspace
                          {workspaces?.length === 1 ? '' : 's'}
                        </span>
                      </span>
                    </span>
                    <ChevronDown
                      className={`size-3.5 ${isBoatWorkspace ? 'text-blue-200' : 'text-muted-foreground'}`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className={`w-56 ${dropdownContentClass}`}
                >
                  <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                  {workspaces?.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onSelect={() => selectWorkspace(workspace.id)}
                    >
                      <span className="truncate">{workspace.name}</span>
                      {workspace.id === activeWorkspaceId && (
                        <Badge>Active</Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() =>
                      navigate({
                        to: '/app/settings',
                        search: { ws: activeWorkspaceId },
                      })
                    }
                  >
                    <Plus /> New workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <nav className="mt-8 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  search={{ ws: activeWorkspaceId }}
                  activeOptions={{ exact: item.exact }}
                  activeProps={{ className: 'active' }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isBoatWorkspace ? 'text-blue-100 hover:bg-white/10 hover:text-white [&.active]:bg-white/20 [&.active]:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white [&.active]:bg-emerald-500/12 [&.active]:text-emerald-700 dark:[&.active]:bg-emerald-500/20 dark:[&.active]:text-emerald-300'}`}
                >
                  <item.icon className="size-4" />
                  {item.label === 'Home' ? t('home') : item.label}
                </Link>
              ))}
              {moduleItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  search={{ ws: activeWorkspaceId }}
                  activeProps={{ className: 'active' }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isBoatWorkspace ? 'text-blue-100 hover:bg-white/10 hover:text-white [&.active]:bg-white/20 [&.active]:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white [&.active]:bg-emerald-500/12 [&.active]:text-emerald-700 dark:[&.active]:bg-emerald-500/20 dark:[&.active]:text-emerald-300'}`}
                >
                  <item.icon className="size-4" />
                  {t(moduleLabelKeys[item.key])}
                </Link>
              ))}
              <Link
                to={settingsNavItem.to}
                search={{ ws: activeWorkspaceId }}
                activeProps={{ className: 'active' }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isBoatWorkspace ? 'text-blue-100 hover:bg-white/10 hover:text-white [&.active]:bg-white/20 [&.active]:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white [&.active]:bg-emerald-500/12 [&.active]:text-emerald-700 dark:[&.active]:bg-emerald-500/20 dark:[&.active]:text-emerald-300'}`}
              >
                <settingsNavItem.icon className="size-4" />
                {t('settings')}
              </Link>
            </nav>

            <div className="mt-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`h-auto w-full justify-between px-2 py-2 text-left ${isBoatWorkspace ? 'hover:bg-white/10 aria-expanded:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-xs font-bold text-white">
                        {user.displayName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-xs font-semibold ${isBoatWorkspace ? 'text-white' : 'text-foreground'}`}
                        >
                          {user.displayName}
                        </span>
                        <span
                          className={`block truncate text-[11px] ${isBoatWorkspace ? 'text-blue-200' : 'text-muted-foreground'}`}
                        >
                          {t('accountMenu')}
                        </span>
                      </span>
                    </span>
                    <ChevronDown
                      className={`size-3.5 ${isBoatWorkspace ? 'text-blue-200' : 'text-muted-foreground'}`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className={`w-52 ${dropdownContentClass}`}
                >
                  <DropdownMenuLabel>
                    <span className="block truncate">{user.displayName}</span>
                    <span
                      className={`block text-xs font-normal ${isBoatWorkspace ? 'text-blue-200' : 'text-muted-foreground'}`}
                    >
                      {t('accountMenu')}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    Appearance
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={() => setTheme('light')}
                    className={theme === 'light' ? 'font-semibold' : undefined}
                  >
                    <Sun /> Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setTheme('dark')}
                    className={theme === 'dark' ? 'font-semibold' : undefined}
                  >
                    <Moon /> Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setTheme('system')}
                    className={theme === 'system' ? 'font-semibold' : undefined}
                  >
                    <Monitor /> System
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    {t('language')}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={() => setLocale('en')}
                    className={locale === 'en' ? 'font-semibold' : undefined}
                  >
                    {t('english')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setLocale('no')}
                    className={locale === 'no' ? 'font-semibold' : undefined}
                  >
                    {t('norwegian')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() =>
                      navigate({
                        to: '/app/profile',
                        search: { ws: activeWorkspaceId },
                      })
                    }
                  >
                    <User /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <LogoutMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header
              className={`sticky top-0 z-20 flex h-[76px] items-center border-b px-4 backdrop-blur-xl lg:hidden ${isBoatWorkspace ? 'border-white/10 bg-[#063568]/95 text-white' : 'border-slate-200/70 bg-white/75 dark:border-white/5 dark:bg-[#091520]/80'}`}
            >
              <div className="lg:hidden">
                <Brand />
              </div>
            </header>

            <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
              <div className="mx-auto w-full max-w-[1380px]">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </WorkspaceContext.Provider>
  )
}
