import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} from '#/server/documents/service'

const workspaceIdSchema = z.object({ workspaceId: z.string().uuid() })

export const getDocuments = createServerFn({ method: 'GET' })
  .validator(workspaceIdSchema)
  .handler(async ({ data }) => listDocuments(data.workspaceId))

export const createDocumentFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      name: z.string().trim().min(1).max(255),
      storageKey: z.string().trim().min(1).max(512),
      mimeType: z.string().trim().max(127).nullable().optional(),
      sizeBytes: z.number().int().nonnegative().nullable().optional(),
    }),
  )
  .handler(async ({ data }) =>
    createDocument(data.workspaceId, {
      name: data.name,
      storageKey: data.storageKey,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    }),
  )

export const deleteDocumentFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ workspaceId: z.string().uuid(), documentId: z.string().uuid() }),
  )
  .handler(async ({ data }) =>
    deleteDocument(data.workspaceId, data.documentId),
  )

export const updateDocumentFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      documentId: z.string().uuid(),
      name: z.string().trim().min(1).max(255).optional(),
      mimeType: z.string().trim().max(127).nullable().optional(),
      sizeBytes: z.number().int().nonnegative().nullable().optional(),
    }),
  )
  .handler(async ({ data }) =>
    updateDocument(data.workspaceId, data.documentId, {
      name: data.name,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    }),
  )
