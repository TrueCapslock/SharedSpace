import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '#/server/db'
import { notifications } from '#/server/db/schema'
import { requireUser } from '#/server/users/service'
import { AppError } from '#/server/authorization/authorize'

export async function listMyNotifications(workspaceId?: string | null) {
  const user = await requireUser()

  const conditions = [eq(notifications.userId, user.id)]
  if (workspaceId) {
    conditions.push(eq(notifications.workspaceId, workspaceId))
  }

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(asc(notifications.createdAt))
}

export async function unreadCount(): Promise<number> {
  const user = await requireUser()
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
  return rows.length
}

export async function markNotificationRead(
  notificationId: string,
  workspaceId: string,
) {
  const user = await requireUser()
  const [row] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.id),
        eq(notifications.workspaceId, workspaceId),
      ),
    )
    .returning()
  if (!row) {
    throw new AppError('NOT_FOUND', 'Notification not found')
  }
  return row
}

export async function markAllRead(workspaceId?: string | null) {
  const user = await requireUser()
  const conditions = [eq(notifications.userId, user.id)]
  if (workspaceId) conditions.push(eq(notifications.workspaceId, workspaceId))

  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(...conditions))
    .returning()
  return rows.length
}

/** Internal helper used by other services to create notifications. */
export async function createNotification(params: {
  userId: string
  workspaceId: string
  type: string
  title: string
  body?: string | null
  link?: string | null
}) {
  return db
    .insert(notifications)
    .values({
      userId: params.userId,
      workspaceId: params.workspaceId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      link: params.link ?? null,
    })
    .returning()
    .then((rows) => rows[0])
}
