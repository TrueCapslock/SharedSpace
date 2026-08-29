import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  createWorkspaceRecordFn,
  deleteWorkspaceRecordFn,
  getWorkspaceRecords,
  updateWorkspaceRecordFn,
} from '#/server/api/records'
import { useWorkspacesContext } from '#/features/app/workspace-context'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import type { WorkspaceRecordType } from '#/server/records/service'
import { useI18n } from '#/lib/i18n'
import type { TranslationKey } from '#/lib/i18n'

type FieldKind = 'amount' | 'unit' | 'date' | 'status'

type StatusOption = { value: string; label: string }

type RecordModuleConfig = {
  type: WorkspaceRecordType
  title: string
  description: string
  placeholder: string
  noun: string
  fields?: {
    kind: FieldKind
    name: string
    label: string
    placeholder?: string
    options?: StatusOption[]
  }[]
  displayStat?: { label: string; icon: string }
}

export const recordModules = {
  messages: {
    type: 'message',
    title: 'Messages',
    description: 'Share updates and keep conversations visible to the team.',
    placeholder: 'Write an update',
    noun: 'message',
  },
  meters: {
    type: 'meter',
    title: 'Meters',
    description: 'Track meter readings and usage.',
    placeholder: 'Water meter / electricity meter',
    noun: 'meter reading',
    fields: [
      {
        kind: 'amount',
        name: 'reading',
        label: 'Reading value',
        placeholder: 'e.g. 1245',
      },
      {
        kind: 'unit',
        name: 'unit',
        label: 'Unit',
        placeholder: 'kWh, m³',
      },
      { kind: 'date', name: 'date', label: 'Reading date' },
    ],
  },
  inventory: {
    type: 'inventory',
    title: 'Inventory',
    description: 'Keep equipment and supplies accounted for.',
    placeholder: 'Add an inventory item',
    noun: 'inventory item',
    fields: [
      {
        kind: 'amount',
        name: 'quantity',
        label: 'Quantity',
        placeholder: 'e.g. 3',
      },
      {
        kind: 'status',
        name: 'status',
        label: 'Status',
        options: [
          { value: 'available', label: 'Available' },
          { value: 'low', label: 'Low stock' },
          { value: 'out', label: 'Out of stock' },
        ],
      },
    ],
  },
  residents: {
    type: 'resident',
    title: 'Residents',
    description: 'Manage residents and their shared-space information.',
    placeholder: 'Add a resident',
    noun: 'resident',
  },
  board: {
    type: 'board_card',
    title: 'Board',
    description: 'Organize work cards across your team workflow.',
    placeholder: 'Add a board card',
    noun: 'board card',
    fields: [
      {
        kind: 'status',
        name: 'status',
        label: 'Column',
        options: [
          { value: 'todo', label: 'To do' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'done', label: 'Done' },
        ],
      },
    ],
  },
  backlog: {
    type: 'backlog_item',
    title: 'Backlog',
    description: 'Capture work to prioritize in future sprints.',
    placeholder: 'Add a backlog item',
    noun: 'backlog item',
  },
  sprints: {
    type: 'sprint',
    title: 'Sprints',
    description: 'Plan time-boxed iterations and track their progress.',
    placeholder: 'Sprint name',
    noun: 'sprint',
    fields: [
      { kind: 'date', name: 'endDate', label: 'End date' },
      {
        kind: 'status',
        name: 'status',
        label: 'Status',
        options: [
          { value: 'planned', label: 'Planned' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
        ],
      },
    ],
  },
  time: {
    type: 'time_entry',
    title: 'Time & cost',
    description: 'Log time and cost entries for the workspace.',
    placeholder: 'Describe the work or cost',
    noun: 'entry',
    fields: [
      {
        kind: 'amount',
        name: 'hours',
        label: 'Hours / amount',
        placeholder: 'e.g. 2.5',
      },
      { kind: 'date', name: 'date', label: 'Date' },
    ],
  },
  roadmap: {
    type: 'roadmap_item',
    title: 'Roadmap',
    description: 'Plan milestones and the path ahead.',
    placeholder: 'Add a roadmap item',
    noun: 'roadmap item',
  },
  resources: {
    type: 'resource',
    title: 'Resources',
    description: 'Track people, capacity, and shared resources.',
    placeholder: 'Add a resource',
    noun: 'resource',
  },
  risks: {
    type: 'risk',
    title: 'Risks',
    description: 'Identify risks early and track mitigation work.',
    placeholder: 'Describe the risk',
    noun: 'risk',
    fields: [
      {
        kind: 'status',
        name: 'status',
        label: 'Status',
        options: [
          { value: 'open', label: 'Open' },
          { value: 'mitigating', label: 'Mitigating' },
          { value: 'closed', label: 'Closed' },
        ],
      },
    ],
  },
  logbook: {
    type: 'logbook_entry',
    title: 'Logbook',
    description: 'Keep a durable record of trips, work, and events.',
    placeholder: 'Add a log entry',
    noun: 'log entry',
    fields: [{ kind: 'date', name: 'date', label: 'Date' }],
  },
  access: {
    type: 'access_key',
    title: 'Keys & access',
    description: 'Manage keys, codes, and shared access details.',
    placeholder: 'Add an access item',
    noun: 'access item',
  },
  cabinInfo: {
    type: 'cabin_info',
    title: 'Cabin information',
    description: 'Keep practical information for cabin users.',
    placeholder: 'Add cabin information',
    noun: 'cabin note',
  },
  utilities: {
    type: 'utility',
    title: 'Utilities',
    description: 'Track utilities, providers, and service status.',
    placeholder: 'Add a utility',
    noun: 'utility',
    fields: [
      {
        kind: 'status',
        name: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    ],
  },
  berths: {
    type: 'berth',
    title: 'Harbour & berth',
    description: 'Manage berths, marina details, and mooring information.',
    placeholder: 'Add a berth',
    noun: 'berth',
  },
  insights: {
    type: 'insight',
    title: 'Insights',
    description: 'Capture metrics, observations, and team learnings.',
    placeholder: 'Add an insight',
    noun: 'insight',
  },
} as const satisfies Record<string, RecordModuleConfig>

export type RecordModuleKey = keyof typeof recordModules

const fieldKeyToI18n: Record<string, TranslationKey> = {
  reading: 'fieldReading',
  unit: 'fieldUnit',
  date: 'fieldDate',
  quantity: 'fieldQuantity',
  status: 'fieldStatus',
  endDate: 'fieldEndDate',
  hours: 'fieldHoursAmount',
}

const fieldPlaceholderToI18n: Record<string, TranslationKey> = {
  reading: 'placeholderReading',
  unit: 'placeholderUnit',
  quantity: 'placeholderQuantity',
  hours: 'placeholderHours',
}

const statusValueToI18n: Record<string, TranslationKey> = {
  available: 'statusAvailable',
  low: 'statusLowStock',
  out: 'statusOutOfStock',
  todo: 'statusToDo',
  in_progress: 'statusInProgress',
  done: 'statusDone',
  planned: 'statusPlanned',
  active: 'statusActive',
  completed: 'statusCompleted',
  open: 'statusOpen',
  mitigating: 'statusMitigating',
  closed: 'statusClosed',
  inactive: 'statusInactive',
}

const moduleKeyToI18nKey: Record<RecordModuleKey, string> = {
  messages: 'moduleMessages',
  meters: 'moduleMeters',
  inventory: 'moduleInventory',
  residents: 'moduleResidents',
  board: 'moduleBoard',
  backlog: 'moduleBacklog',
  sprints: 'moduleSprints',
  time: 'moduleTime',
  roadmap: 'moduleRoadmap',
  resources: 'moduleResources',
  risks: 'moduleRisks',
  logbook: 'moduleLogbook',
  access: 'moduleAccess',
  cabinInfo: 'moduleCabinInfo',
  utilities: 'moduleUtilities',
  berths: 'moduleBerths',
  insights: 'moduleInsights',
}

type I18nT = ReturnType<typeof useI18n>['t']

function localizedConfig(key: RecordModuleKey, t: I18nT): RecordModuleConfig {
  const base = recordModules[key] as RecordModuleConfig
  const prefix = moduleKeyToI18nKey[key]
  const fields = base.fields?.map((field) => {
    const label = t(fieldKeyToI18n[field.name] ?? 'fieldStatus')
    const placeholder = field.placeholder
      ? t(fieldPlaceholderToI18n[field.name] ?? 'fieldStatus')
      : undefined
    if (field.kind === 'status') {
      return {
        ...field,
        label,
        options: field.options?.map((option) => ({
          ...option,
          label: t(statusValueToI18n[option.value] ?? 'statusOpen'),
        })),
      }
    }
    return { ...field, label, placeholder }
  })
  return {
    ...base,
    title: t(`${prefix}Title` as TranslationKey),
    description: t(`${prefix}Desc` as TranslationKey),
    placeholder: t(`${prefix}Placeholder` as TranslationKey),
    noun: t(`${prefix}Noun` as TranslationKey),
    fields,
  }
}

function getInitialStatus(options?: StatusOption[]): string {
  return options?.[0]?.value ?? ''
}

type RecordRow = {
  id: string
  title: string
  details: string | null
  status: string | null
  amount: number | null
  occurredAt: Date | string | null
  createdAt: Date | string
  metadata?: unknown
}

function initialValues(fields: NonNullable<RecordModuleConfig['fields']>) {
  return Object.fromEntries(
    fields
      .filter((field) => field.kind === 'status')
      .map((field) => [field.name, getInitialStatus(field.options)]),
  )
}

function structuredPayload(
  config: RecordModuleConfig,
  values: Record<string, string>,
) {
  const fields = config.fields ?? []
  const amountField = fields.find((field) => field.kind === 'amount')
  const dateField = fields.find((field) => field.kind === 'date')
  const statusField = fields.find((field) => field.kind === 'status')
  const unitField = fields.find((field) => field.kind === 'unit')

  const amountString = amountField ? values[amountField.name] : undefined
  const amount =
    amountString && amountString.trim() !== ''
      ? parseFloat(amountString)
      : undefined

  const metadata: Record<string, unknown> = {}
  if (unitField && values[unitField.name]?.trim()) {
    metadata[unitField.name] = values[unitField.name].trim()
  }

  return {
    status: statusField ? values[statusField.name] || undefined : undefined,
    amount:
      amount && !Number.isNaN(amount)
        ? Math.round(amount * 100) / 100
        : undefined,
    occurredAt:
      dateField && values[dateField.name]
        ? new Date(values[dateField.name]).toISOString()
        : undefined,
    metadata,
  }
}

function recordToValues(
  record: RecordRow,
  config: RecordModuleConfig,
): Record<string, string> {
  const fields = config.fields ?? []
  const values: Record<string, string> = {}
  const metadata = record.metadata as Record<string, unknown> | null

  for (const field of fields) {
    if (field.kind === 'status') {
      values[field.name] = record.status ?? ''
    } else if (field.kind === 'amount') {
      values[field.name] = record.amount != null ? String(record.amount) : ''
    } else if (field.kind === 'unit') {
      const unit = metadata?.[field.name]
      values[field.name] = typeof unit === 'string' ? unit : ''
    } else if (field.kind === 'date') {
      values[field.name] = record.occurredAt
        ? toDateInputValue(record.occurredAt)
        : ''
    }
  }
  return values
}

function toDateInputValue(value: Date | string): string {
  const date = new Date(value)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function FieldInputs({
  config,
  values,
  setValue,
}: {
  config: RecordModuleConfig
  values: Record<string, string>
  setValue: (name: string, raw: string) => void
}) {
  const fields = config.fields ?? []
  if (fields.length === 0) return null
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <Label htmlFor={`${config.type}-${field.name}`}>{field.label}</Label>
          {field.kind === 'status' ? (
            <select
              id={`${config.type}-${field.name}`}
              value={values[field.name] ?? ''}
              onChange={(event) => setValue(field.name, event.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.kind === 'date' ? (
            <Input
              id={`${config.type}-${field.name}`}
              type="date"
              value={values[field.name] ?? ''}
              onChange={(event) => setValue(field.name, event.target.value)}
            />
          ) : (
            <Input
              id={`${config.type}-${field.name}`}
              type={field.kind === 'amount' ? 'number' : 'text'}
              step={field.kind === 'amount' ? '0.01' : undefined}
              value={values[field.name] ?? ''}
              onChange={(event) => setValue(field.name, event.target.value)}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function EditableRecordRow({
  record,
  config,
  activeWorkspaceId,
  onInvalidate,
  onDelete,
}: {
  record: RecordRow
  config: RecordModuleConfig
  activeWorkspaceId: string
  onInvalidate: () => void
  onDelete: (recordId: string) => void
}) {
  const { t, locale } = useI18n()
  const displayLocale = locale === 'no' ? 'nb' : 'en-US'
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(record.title)
  const [details, setDetails] = useState(record.details ?? '')
  const [values, setValues] = useState<Record<string, string>>(() =>
    recordToValues(record, config),
  )

  const setValue = (name: string, raw: string) =>
    setValues((prev) => ({ ...prev, [name]: raw }))

  const save = useMutation({
    mutationFn: () =>
      updateWorkspaceRecordFn({
        data: {
          workspaceId: activeWorkspaceId,
          recordId: record.id,
          title,
          details: details || null,
          ...structuredPayload(config, values),
        },
      }),
    onSuccess: () => {
      setEditing(false)
      onInvalidate()
    },
  })

  if (!editing) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{record.title}</p>
              {record.amount != null && (
                <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CircleDollarSign className="size-3" />
                  {record.amount}
                  {unitLabel(record, config)}
                </span>
              )}
              {record.status && record.status !== 'active' && (
                <StatusBadge status={record.status} t={t} />
              )}
              {record.occurredAt && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" />
                  {new Intl.DateTimeFormat(displayLocale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(record.occurredAt))}
                </span>
              )}
            </div>
            {record.details && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {record.details}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {t('addedOn')}{' '}
              {new Intl.DateTimeFormat(displayLocale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(record.createdAt))}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${t('editAria')} ${record.title}`}
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4 text-muted-foreground" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${t('deleteAria')} ${record.title}`}
            onClick={() => onDelete(record.id)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('editNoun')} {config.noun}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (title.trim()) save.mutate()
          }}
        >
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={config.placeholder}
          />
          <FieldInputs config={config} values={values} setValue={setValue} />
          <textarea
            className="min-h-20 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={t('optionalDetails')}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!title.trim() || save.isPending}>
              <Check /> {save.isPending ? t('saving') : t('save')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              <X /> {t('cancel')}
            </Button>
            {save.isError && (
              <p className="text-sm text-destructive">{t('couldNotSave')}</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function RecordModulePage({
  moduleKey,
}: {
  moduleKey: RecordModuleKey
}) {
  const { t } = useI18n()
  const config: RecordModuleConfig = localizedConfig(moduleKey, t)
  const fields = config.fields ?? []
  const { activeWorkspaceId } = useWorkspacesContext()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [values, setValues] = useState<Record<string, string>>(() =>
    initialValues(fields),
  )

  const records = useQuery({
    queryKey: ['workspace-records', activeWorkspaceId, config.type],
    queryFn: () =>
      getWorkspaceRecords({
        data: { workspaceId: activeWorkspaceId!, type: config.type },
      }),
    enabled: Boolean(activeWorkspaceId),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ['workspace-records', activeWorkspaceId, config.type],
    })

  const create = useMutation({
    mutationFn: () =>
      createWorkspaceRecordFn({
        data: {
          workspaceId: activeWorkspaceId!,
          type: config.type,
          title,
          details: details || null,
          ...structuredPayload(config, values),
        },
      }),
    onSuccess: () => {
      setTitle('')
      setDetails('')
      setValues(initialValues(fields))
      invalidate()
    },
  })

  const remove = useMutation({
    mutationFn: (recordId: string) =>
      deleteWorkspaceRecordFn({
        data: { workspaceId: activeWorkspaceId!, recordId },
      }),
    onSuccess: invalidate,
  })

  const setValue = (name: string, raw: string) =>
    setValues((prev) => ({ ...prev, [name]: raw }))

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
        <p className="text-muted-foreground">{config.description}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('newEntry')} {config.noun}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (title.trim()) create.mutate()
            }}
          >
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={config.placeholder}
            />
            <FieldInputs config={config} values={values} setValue={setValue} />
            <textarea
              className="min-h-20 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={t('optionalDetails')}
            />
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={!title.trim() || create.isPending}
              >
                <Plus /> {t('add')}
              </Button>
              {create.isError && (
                <p className="text-sm text-destructive">{t('couldNotSave')}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {records.isLoading && (
          <p className="text-muted-foreground">{t('loading')}</p>
        )}
        {records.data?.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t('noNounYet')}
              {config.noun}s{t('nounYetSuffix')}
            </CardContent>
          </Card>
        )}
        {records.data?.map((record) => (
          <EditableRecordRow
            key={record.id}
            record={record}
            config={config}
            activeWorkspaceId={activeWorkspaceId!}
            onInvalidate={invalidate}
            onDelete={(recordId) => remove.mutate(recordId)}
          />
        ))}
      </div>
    </div>
  )
}

function unitLabel(
  record: { metadata?: unknown },
  config: RecordModuleConfig,
): string {
  const unitField = config.fields?.find((field) => field.kind === 'unit')
  if (!unitField) return ''
  const metadata = record.metadata as Record<string, unknown> | null
  const unit = metadata?.[unitField.name]
  return typeof unit === 'string' ? ` ${unit}` : ''
}

const statusTones: Record<string, string> = {
  done: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  active: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  mitigating: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  low: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  open: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  todo: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  planned: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  available: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  closed: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  out: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  inactive: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
}

function StatusBadge({ status, t }: { status: string; t: I18nT }) {
  const tone =
    statusTones[status] ??
    'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'
  const labelKey = statusValueToI18n[status]
  const label = labelKey ? t(labelKey) : status.replace('_', ' ')
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${tone}`}
    >
      {label}
    </span>
  )
}
