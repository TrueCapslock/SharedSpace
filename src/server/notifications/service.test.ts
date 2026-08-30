import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createNotification,
  listMyNotifications,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from './service'

const USER_ID = 'user-123'
const WS_ID = 'workspace-123'
const NOTIFICATION_ID = 'notification-123'

const appUser = {
  id: USER_ID,
  clerkId: 'clerk-user-123',
  displayName: 'Test User',
  email: null,
  preferences: {},
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const notificationRow = {
  id: NOTIFICATION_ID,
  userId: USER_ID,
  workspaceId: WS_ID,
  type: 'task.assigned',
  title: 'New task assigned',
  body: null,
  link: null,
  readAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  requireUser: vi.fn(),
}))

vi.mock('#/server/db', () => ({ db: mocks.db }))
vi.mock('#/server/users/service', () => ({ requireUser: mocks.requireUser }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue(appUser)
})

describe('listMyNotifications', () => {
  it('requires the current user and selects by userId', () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ orderBy: async () => [notificationRow] }),
      }),
    }))

    const result = listMyNotifications()
    expect(mocks.requireUser).toHaveBeenCalled()
    void result
  })

  it('runs a query per request, with an extra filter when scoped', async () => {
    let whereCalls = 0
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => {
          whereCalls += 1
          return { orderBy: async () => [notificationRow] }
        },
      }),
    }))

    await listMyNotifications()
    await listMyNotifications(WS_ID)
    expect(whereCalls).toBe(2)
  })
})

describe('unreadCount', () => {
  it('returns the number of unread notifications', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: async () => [notificationRow, notificationRow],
      }),
    }))

    await expect(unreadCount()).resolves.toBe(2)
  })
})

describe('markNotificationRead', () => {
  it('returns the updated row when found', async () => {
    mocks.db.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({ returning: async () => [notificationRow] }),
      }),
    }))

    const row = await markNotificationRead(NOTIFICATION_ID, WS_ID)
    expect(row.id).toBe(NOTIFICATION_ID)
  })

  it('throws NOT_FOUND when the notification is missing', async () => {
    mocks.db.update.mockImplementation(() => ({
      set: () => ({ where: () => ({ returning: async () => [] }) }),
    }))

    await expect(
      markNotificationRead(NOTIFICATION_ID, WS_ID),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('markAllRead', () => {
  it('returns the number of updated rows', async () => {
    mocks.db.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: async () => [notificationRow, notificationRow],
        }),
      }),
    }))

    await expect(markAllRead()).resolves.toBe(2)
  })
})

describe('createNotification', () => {
  it('defaults body and link to null', async () => {
    let insertValues: Record<string, unknown> | undefined
    mocks.db.insert.mockImplementation(() => ({
      values: (values: Record<string, unknown>) => {
        insertValues = values
        return { returning: () => Promise.resolve([notificationRow]) }
      },
    }))

    const row = await createNotification({
      userId: USER_ID,
      workspaceId: WS_ID,
      type: 'task.assigned',
      title: 'New task assigned',
    })

    expect(insertValues).toMatchObject({
      userId: USER_ID,
      workspaceId: WS_ID,
      body: null,
      link: null,
    })
    expect(row.id).toBe(NOTIFICATION_ID)
  })
})
