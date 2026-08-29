import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useWorkspacesContext } from '#/features/app/workspace-context'
import {
  createTaskFn,
  deleteTaskFn,
  getTasks,
  updateTaskFn,
} from '#/server/api/tasks'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { useI18n } from '#/lib/i18n'
import type { TranslationKey } from '#/lib/i18n'

export const Route = createFileRoute('/app/tasks')({ component: Tasks })

const statusColor: Record<string, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/10 text-blue-600',
  done: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-muted text-muted-foreground',
}

const priorityColor: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-red-500/10 text-red-600',
}

const statusLabelKey: Record<string, TranslationKey> = {
  todo: 'statusTodo',
  in_progress: 'statusInProgressShort',
  done: 'statusDone',
  cancelled: 'statusCancelled',
}

const priorityLabelKey: Record<string, TranslationKey> = {
  low: 'priorityLow',
  medium: 'priorityMedium',
  high: 'priorityHigh',
}

function Tasks() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspacesContext()
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')

  const tasks = useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: () =>
      getTasks({
        data: { workspaceId: activeWorkspaceId! },
      }),
    enabled: !!activeWorkspaceId,
  })

  const createTask = useMutation({
    mutationFn: () =>
      createTaskFn({
        data: {
          workspaceId: activeWorkspaceId!,
          title,
        },
      }),
    onSuccess: () => {
      setTitle('')
      queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId] })
    },
  })

  const toggleDone = useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean }) =>
      updateTaskFn({
        data: {
          workspaceId: activeWorkspaceId!,
          taskId,
          status: done ? 'done' : 'todo',
        },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId] }),
  })

  const removeTask = useMutation({
    mutationFn: (taskId: string) =>
      deleteTaskFn({
        data: { workspaceId: activeWorkspaceId!, taskId },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId] }),
  })

  if (!activeWorkspace) {
    return <p className="text-muted-foreground">{t('selectWorkspace')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('tasks')}</h1>
        <p className="text-muted-foreground">{t('manageWork')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('addTask')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (title.trim()) createTask.mutate()
            }}
          >
            <input
              className="h-8 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('taskPlaceholder')}
            />
            <Button
              type="submit"
              disabled={!title.trim() || createTask.isPending}
            >
              {t('add')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {tasks.isLoading && (
          <p className="text-muted-foreground">{t('loadingTasks')}</p>
        )}
        {tasks.data?.length === 0 && (
          <p className="text-muted-foreground">{t('noTasksYet')}</p>
        )}
        {tasks.data?.map((task) => (
          <Card key={task.id} className="py-0">
            <CardContent className="flex items-center gap-3 py-3">
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={(e) =>
                  toggleDone.mutate({ taskId: task.id, done: e.target.checked })
                }
                className="size-4"
              />
              <span
                className={
                  task.status === 'done'
                    ? 'flex-1 text-muted-foreground line-through'
                    : 'flex-1'
                }
              >
                {task.title}
              </span>
              <Badge className={statusColor[task.status]}>
                {t(statusLabelKey[task.status])}
              </Badge>
              <Badge variant="outline" className={priorityColor[task.priority]}>
                {t(priorityLabelKey[task.priority])}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTask.mutate(task.id)}
              >
                {t('delete')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
