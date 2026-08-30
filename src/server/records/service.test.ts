import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authorize from '#/server/authorization/authorize'
import {
  createWorkspaceRecord,
  deleteWorkspaceRecord,
  listWorkspaceRecords,
  updateWorkspaceRecord,
} from './service'

const USER_ID = 'user-123'
const WS_ID = 'workspace-123'
const RECORD_ID = 'record-123'

const appUser = {
  id: USER_ID,
  clerkId: 'clerk-user-123',
  displayName: 'Test User',
  email: null,
  preferences: {},
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const recordRow = {
  id: RECORD_ID,
  type: 'berth',
  title: 'Berth A7',
  status: 'active',
  occurredAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  recordActivityEvent: vi.fn(),
  requireUser: vi.fn(),
}))

vi.mock('#/server/db', () => ({ db: mocks.db }))
vi.mock('#/server/activity/service', () => ({
  recordActivityEvent: mocks.recordActivityEvent,
}))
vi.mock('#/server/users/service', () => ({ requireUser: mocks.requireUser }))

const requireWorkspacePermission = vi.spyOn(
  authorize,
  'requireWorkspacePermission',
)
const requireWorkspaceMembership = vi.spyOn(
  authorize,
  'requireWorkspaceMembership',
)

beforeEach(() => {
  vi.clearAllMocks()
  requireWorkspacePermission.mockResolvedValue(appUser)
  requireWorkspaceMembership.mockResolvedValue(appUser)
})

describe('listWorkspaceRecords', () => {
  it('requires an active membership', async () => {
    mocks.db.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ orderBy: async () => [] }),
      }),
    }))

    await listWorkspaceRecords(WS_ID, 'berth')
    expect(requireWorkspaceMembership).toHaveBeenCalledWith(WS_ID)
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

    await listWorkspaceRecords(WS_ID, 'meter')
    expect(whereInvoked).toBe(true)
  })
})

describe('createWorkspaceRecord', () => {
  let insertValues: Record<string, unknown> | undefined

  beforeEach(() => {
    mocks.db.insert.mockImplementation(() => ({
      values: (values: Record<string, unknown>) => {
        insertValues = values
        return { returning: async () => [recordRow] }
      },
    }))
  })

  it('requires the workspace:update permission', async () => {
    await createWorkspaceRecord(WS_ID, { type: 'berth', title: 'A7' })
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'workspace:update',
    )
  })

  it('trims the title/details and applies defaults', async () => {
    const record = await createWorkspaceRecord(WS_ID, {
      type: 'berth',
      title: '  A7  ',
      details: '  Port side  ',
    })

    expect(insertValues).toMatchObject({
      workspaceId: WS_ID,
      type: 'berth',
      title: 'A7',
      details: 'Port side',
      status: 'active',
      amount: null,
      occurredAt: null,
      metadata: {},
      createdById: USER_ID,
    })
    expect(record.id).toBe(RECORD_ID)
  })

  it('honors explicit status, amount and occurredAt', async () => {
    const occurredAt = new Date('2026-02-01T00:00:00Z')
    await createWorkspaceRecord(WS_ID, {
      type: 'meter',
      title: 'Dock fee',
      status: 'settled',
      amount: 1200,
      occurredAt,
    })

    expect(insertValues).toMatchObject({
      status: 'settled',
      amount: 1200,
      occurredAt,
    })
  })

  it('records a record.created activity event', async () => {
    await createWorkspaceRecord(WS_ID, { type: 'berth', title: 'A7' })

    expect(mocks.recordActivityEvent).toHaveBeenCalledWith({
      workspaceId: WS_ID,
      actorId: USER_ID,
      action: 'berth.created',
      entityType: 'workspace_record',
      entityId: RECORD_ID,
    })
  })
})

describe('updateWorkspaceRecord', () => {
  let updatePatch: Record<string, unknown> | undefined

  beforeEach(() => {
    mocks.db.update.mockImplementation(() => ({
      set: (patch: Record<string, unknown>) => {
        updatePatch = patch
        return { where: () => ({ returning: async () => [recordRow] }) }
      },
    }))
  })

  it('requires the workspace:update permission', async () => {
    await updateWorkspaceRecord(WS_ID, RECORD_ID, { status: 'settled' })
    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'workspace:update',
    )
  })

  it('applies only the provided fields and trims title', async () => {
    await updateWorkspaceRecord(WS_ID, RECORD_ID, { title: '  A8  ' })

    expect(updatePatch?.title).toBe('A8')
    expect(updatePatch?.status).toBeUndefined()
    expect(updatePatch?.updatedAt).toBeInstanceOf(Date)
  })

  it('passes through details, status, amount and occurredAt', async () => {
    const occurredAt = new Date('2026-03-01T00:00:00Z')
    await updateWorkspaceRecord(WS_ID, RECORD_ID, {
      details: 'Updated',
      status: 'inactive',
      amount: 99,
      occurredAt,
    })

    expect(updatePatch).toMatchObject({
      details: 'Updated',
      status: 'inactive',
      amount: 99,
      occurredAt,
    })
  })

  it('throws NOT_FOUND when the record is missing', async () => {
    mocks.db.update.mockImplementation(() => ({
      set: () => ({ where: () => ({ returning: async () => [] }) }),
    }))

    await expect(
      updateWorkspaceRecord(WS_ID, RECORD_ID, { title: 'A8' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('records a record.updated activity event', async () => {
    await updateWorkspaceRecord(WS_ID, RECORD_ID, { status: 'settled' })

    expect(mocks.recordActivityEvent).toHaveBeenCalledWith({
      workspaceId: WS_ID,
      actorId: USER_ID,
      action: 'berth.updated',
      entityType: 'workspace_record',
      entityId: RECORD_ID,
    })
  })
})

describe('deleteWorkspaceRecord', () => {
  it('requires the workspace:update permission and records activity', async () => {
    mocks.db.delete.mockImplementation(() => ({
      where: () => ({ returning: async () => [recordRow] }),
    }))

    await deleteWorkspaceRecord(WS_ID, RECORD_ID)

    expect(requireWorkspacePermission).toHaveBeenCalledWith(
      WS_ID,
      'workspace:update',
    )
    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WS_ID,
        actorId: USER_ID,
        action: 'berth.deleted',
        entityType: 'workspace_record',
        entityId: RECORD_ID,
      }),
    )
  })

  it('throws NOT_FOUND when the record is missing', async () => {
    mocks.db.delete.mockImplementation(() => ({
      where: () => ({ returning: async () => [] }),
    }))

    await expect(deleteWorkspaceRecord(WS_ID, RECORD_ID)).rejects.toMatchObject(
      {
        code: 'NOT_FOUND',
      },
    )
  })
})
