import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authorize from '#/server/authorization/authorize'
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from './service'

const USER_ID = 'user-123'
const WS_ID = 'workspace-123'
const TASK_ID = 'task-123'

const appUser = {
  id: USER_ID,
  clerkId: 'clerk-user-123',
  displayName: 'Test User',
  email: null,
  preferences: {},
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
  requireUser: vi.fn(),
  recordActivityEvent: vi.fn(),
  createBuiltInRolesForWorkspace: vi.fn(),
  getWorkspaceRoleByKey: vi.fn(),
}))

vi.mock('#/server/db', () => ({ db: mocks.db }))
vi.mock('#/server/users/service', () => ({ requireUser: mocks.requireUser }))
vi.mock('#/server/activity/service', () => ({
  recordActivityEvent: mocks.recordActivityEvent,
}))
vi.mock('#/server/roles/service', () => ({
  createBuiltInRolesForWorkspace: mocks.createBuiltInRolesForWorkspace,
  getWorkspaceRoleByKey: mocks.getWorkspaceRoleByKey,
}))

const requireWorkspacePermission = vi.spyOn(
  authorize,
  'requireWorkspacePermission',
)
const requireWorkspaceMembership = vi.spyOn(
  authorize,
  'requireWorkspaceMembership',
)

const taskRow = {
  id: TASK_ID,
  workspaceId: WS_ID,
  title: 'Fix the dock',
  status: 'todo',
  priority: 'medium',
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

beforeEach(() => {
  vi.clearAllMocks()
  requireWorkspacePermission.mockResolvedValue(appUser)
  requireWorkspaceMembership.mockResolvedValue(appUser)
  mocks.requireUser.mockResolvedValue(appUser)
  mocks.db.select.mockImplementation(() => ({
    from: () => ({
      where: () => ({
        orderBy: async () => [],
        limit: async () => [],
      }),
    }),
  }))
})

describe('listTasks', () => {
  it('requires the tasks:read permission', async () => {
    await listTasks(WS_ID)
    expect(requireWorkspacePermission).toHaveBeenCalledWith(WS_ID, 'tasks:read')
  })

  it('applies a workspace-scoped where clause', async () => {
    let whereInvoked = false
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => {
          whereInvoked = true
          return { orderBy: async () => [] }
        },
      }),
    }))

    await listTasks(WS_ID)
    expect(whereInvoked).toBe(true)
  })
})

describe('getTask', () => {
  it('requires the tasks:read permission', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ limit: async () => [taskRow] }),
      }),
    }))

    await getTask(WS_ID, TASK_ID)
    expect(requireWorkspacePermission).toHaveBeenCalledWith(WS_ID, 'tasks:read')
  })

  it('returns the task when found', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ limit: async () => [taskRow] }),
      }),
    }))

    const task = await getTask(WS_ID, TASK_ID)
    expect(task.id).toBe(TASK_ID)
  })

  it('throws NOT_FOUND for unknown or cross-workspace tasks', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ limit: async () => [] }),
      }),
    }))

    await expect(getTask(WS_ID, TASK_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

describe('createTask', () => {
  let insertValues: Record<string, unknown> | undefined

  beforeEach(() => {
    mocks.db.insert.mockImplementation(() => ({
      values: (values: Record<string, unknown>) => {
        insertValues = values
        return { returning: async () => [taskRow] }
      },
    }))
  })

  it('requires the tasks:create permission', async () => {
    await createTask(WS_ID, { title: 'Task' })
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'tasks:create',
    )
  })

  it('trims the title and applies sensible defaults', async () => {
    const task = await createTask(WS_ID, { title: '  Fix the dock  ' })

    expect(insertValues).toMatchObject({
      workspaceId: WS_ID,
      title: 'Fix the dock',
      status: 'todo',
      priority: 'medium',
      assigneeId: null,
      dueDate: null,
      createdById: USER_ID,
    })
    expect(task.id).toBe(TASK_ID)
  })

  it('honors explicit status, priority and due date', async () => {
    const dueDate = new Date('2026-03-01T00:00:00Z')

    await createTask(WS_ID, {
      title: 'Task',
      status: 'in_progress',
      priority: 'high',
      dueDate,
    })

    expect(insertValues).toMatchObject({
      status: 'in_progress',
      priority: 'high',
      dueDate,
    })
  })

  it('records a task.created activity event', async () => {
    await createTask(WS_ID, { title: 'Task' })

    expect(mocks.recordActivityEvent).toHaveBeenCalledWith({
      workspaceId: WS_ID,
      actorId: USER_ID,
      action: 'task.created',
      entityType: 'task',
      entityId: TASK_ID,
    })
  })
})

describe('updateTask', () => {
  let updatePatch: Record<string, unknown> | undefined

  beforeEach(() => {
    mocks.db.update.mockImplementation(() => ({
      set: (patch: Record<string, unknown>) => {
        updatePatch = patch
        return { where: () => ({ returning: async () => [taskRow] }) }
      },
    }))
  })

  it('requires the tasks:update permission', async () => {
    await updateTask(WS_ID, TASK_ID, { title: 'New' })
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'tasks:update',
    )
  })

  it('sets completedAt when moving a task to done', async () => {
    await updateTask(WS_ID, TASK_ID, { status: 'done' })

    expect(updatePatch?.status).toBe('done')
    expect(updatePatch?.completedAt).toBeInstanceOf(Date)
  })

  it('clears completedAt when moving a task out of done', async () => {
    await updateTask(WS_ID, TASK_ID, { status: 'todo' })

    expect(updatePatch?.status).toBe('todo')
    expect(updatePatch?.completedAt).toBeNull()
  })

  it('trims title updates', async () => {
    await updateTask(WS_ID, TASK_ID, { title: '  New title  ' })

    expect(updatePatch?.title).toBe('New title')
  })

  it('throws NOT_FOUND when the task is missing', async () => {
    mocks.db.update.mockImplementation(() => ({
      set: () => ({ where: () => ({ returning: async () => [] }) }),
    }))

    await expect(
      updateTask(WS_ID, TASK_ID, { title: 'New' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('deleteTask', () => {
  it('requires the tasks:delete permission and records activity', async () => {
    mocks.db.delete.mockImplementation(() => ({
      where: () => ({ returning: async () => [taskRow] }),
    }))

    await deleteTask(WS_ID, TASK_ID)

    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'tasks:delete',
    )
    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WS_ID,
        actorId: USER_ID,
        action: 'task.deleted',
        entityType: 'task',
        entityId: TASK_ID,
      }),
    )
  })

  it('throws NOT_FOUND when the task is missing', async () => {
    mocks.db.delete.mockImplementation(() => ({
      where: () => ({ returning: async () => [] }),
    }))

    await expect(deleteTask(WS_ID, TASK_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})
