import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  listMyNotifications,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from '#/server/notifications/service'

const workspaceIdOptional = z
  .object({ workspaceId: z.string().uuid().nullable().optional() })
  .optional()

export const getNotifications = createServerFn({ method: 'GET' })
  .validator(workspaceIdOptional)
  .handler(async ({ data }) => listMyNotifications(data?.workspaceId ?? null))

export const getUnreadCount = createServerFn({ method: 'GET' }).handler(
  async () => unreadCount(),
)

export const markNotificationReadFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      notificationId: z.string().uuid(),
      workspaceId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) =>
    markNotificationRead(data.notificationId, data.workspaceId),
  )

export const markAllReadFn = createServerFn({ method: 'POST' })
  .validator(workspaceIdOptional)
  .handler(async ({ data }) => markAllRead(data?.workspaceId ?? null))
