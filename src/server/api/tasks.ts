import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from '#/server/tasks/service'

const workspaceIdSchema = z.object({ workspaceId: z.string().uuid() })

export const getTasks = createServerFn({ method: 'GET' })
  .validator(workspaceIdSchema)
  .handler(async ({ data }) => listTasks(data.workspaceId))

export const createTaskFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      title: z.string().trim().min(1).max(255),
      description: z.string().nullable().optional(),
      status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      assigneeId: z.string().uuid().nullable().optional(),
      dueDate: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) =>
    createTask(data.workspaceId, {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    }),
  )

export const updateTaskFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      taskId: z.string().uuid(),
      title: z.string().trim().min(1).max(255).optional(),
      description: z.string().nullable().optional(),
      status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      assigneeId: z.string().uuid().nullable().optional(),
      dueDate: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) =>
    updateTask(data.workspaceId, data.taskId, {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    }),
  )

export const deleteTaskFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ workspaceId: z.string().uuid(), taskId: z.string().uuid() }),
  )
  .handler(async ({ data }) => deleteTask(data.workspaceId, data.taskId))
