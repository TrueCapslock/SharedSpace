import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createDocument, deleteDocument, updateDocument } from './service'

const mocks = vi.hoisted(() => {
  class AppError extends Error {
    code: string

    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  }

  return {
    AppError,
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    requireWorkspacePermission: vi.fn(),
    recordActivityEvent: vi.fn(),
  }
})

vi.mock('#/server/db', () => ({
  db: { insert: mocks.insert, update: mocks.update, delete: mocks.delete },
}))

vi.mock('#/server/authorization/authorize', () => ({
  AppError: mocks.AppError,
  requireWorkspacePermission: mocks.requireWorkspacePermission,
}))

vi.mock('#/server/activity/service', () => ({
  recordActivityEvent: mocks.recordActivityEvent,
}))

function returningChain(result: unknown[]) {
  const returning = vi.fn().mockResolvedValue(result)
  const where = vi.fn().mockReturnValue({ returning })
  const set = vi.fn().mockReturnValue({ where })
  const values = vi.fn().mockReturnValue({ returning })

  return { where, set, values }
}

describe('document service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireWorkspacePermission.mockResolvedValue({ id: 'user-1' })
    mocks.recordActivityEvent.mockResolvedValue(undefined)
  })

  it('trims names, preserves optional nulls, and records document creation', async () => {
    const document = { id: 'document-1' }
    const chain = returningChain([document])
    mocks.insert.mockReturnValue({ values: chain.values })

    await createDocument('workspace-1', {
      name: '  Insurance policy  ',
      storageKey: 'documents/insurance.pdf',
    })

    expect(chain.values).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      name: 'Insurance policy',
      storageKey: 'documents/insurance.pdf',
      mimeType: null,
      sizeBytes: null,
      createdById: 'user-1',
    })
    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.created',
        entityId: document.id,
      }),
    )
  })

  it('only updates supplied fields and reports missing documents', async () => {
    const chain = returningChain([])
    mocks.update.mockReturnValue({ set: chain.set })

    await expect(
      updateDocument('workspace-1', 'missing-document', {
        name: '  Revised policy  ',
        sizeBytes: null,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    expect(chain.set).toHaveBeenCalledWith({
      name: 'Revised policy',
      sizeBytes: null,
    })
    expect(chain.where).toHaveBeenCalledOnce()
    expect(mocks.recordActivityEvent).not.toHaveBeenCalled()
  })

  it('deletes an existing document and records activity', async () => {
    const document = { id: 'document-1' }
    const chain = returningChain([document])
    mocks.delete.mockReturnValue({ where: chain.where })

    await expect(deleteDocument('workspace-1', document.id)).resolves.toBe(
      document,
    )
    expect(mocks.recordActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.deleted',
        entityId: document.id,
      }),
    )
  })
})
