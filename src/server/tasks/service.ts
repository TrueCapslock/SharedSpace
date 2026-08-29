import { and, desc, eq } from 'drizzle-orm'
import { db } from '#/server/db'
import { tasks } from '#/server/db/schema'
import {
  AppError,
  requireWorkspacePermission,
} from '#/server/authorization/authorize'
import { recordActivityEvent } from '#/server/activity/service'

type TaskStatus = typeof tasks.$inferSelect.status
type TaskPriority = typeof tasks.$inferSelect.priority

export type TaskInput = {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  dueDate?: Date | null
}

export async function listTasks(workspaceId: string) {
  await requireWorkspacePermission(workspaceId, 'tasks:read')

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.workspaceId, workspaceId))
    .orderBy(desc(tasks.createdAt))
}

export async function getTask(workspaceId: string, taskId: string) {
  await requireWorkspacePermission(workspaceId, 'tasks:read')

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1)

  if (!task) {
    throw new AppError('NOT_FOUND', 'Task not found')
  }
  return task
}

export async function createTask(workspaceId: string, input: TaskInput) {
  const user = await requireWorkspacePermission(workspaceId, 'tasks:create')

  const [task] = await db
    .insert(tasks)
    .values({
      workspaceId,
      title: input.title.trim(),
      description: input.description ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      assigneeId: input.assigneeId ?? null,
      createdById: user.id,
      dueDate: input.dueDate ?? null,
    })
    .returning()

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: 'task.created',
    entityType: 'task',
    entityId: task.id,
  })

  return task
}

export async function updateTask(
  workspaceId: string,
  taskId: string,
  input: Partial<TaskInput>,
) {
  const user = await requireWorkspacePermission(workspaceId, 'tasks:update')

  const patch: Partial<typeof tasks.$inferInsert> = {}
  if (input.title !== undefined) patch.title = input.title.trim()
  if (input.description !== undefined) patch.description = input.description
  if (input.status !== undefined) patch.status = input.status
  if (input.priority !== undefined) patch.priority = input.priority
  if (input.assigneeId !== undefined) patch.assigneeId = input.assigneeId
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate
  if (patch.status === 'done') patch.completedAt = new Date()
  if (patch.status === 'todo' || patch.status === 'in_progress')
    patch.completedAt = null

  const [task] = await db
    .update(tasks)
    .set(patch)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning()

  if (!task) {
    throw new AppError('NOT_FOUND', 'Task not found')
  }

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: 'task.updated',
    entityType: 'task',
    entityId: task.id,
  })

  return task
}

export async function deleteTask(workspaceId: string, taskId: string) {
  const user = await requireWorkspacePermission(workspaceId, 'tasks:delete')

  const [task] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning()

  if (!task) {
    throw new AppError('NOT_FOUND', 'Task not found')
  }

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: 'task.deleted',
    entityType: 'task',
    entityId: task.id,
  })

  return task
}
