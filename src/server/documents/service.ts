import { and, desc, eq } from 'drizzle-orm'
import { db } from '#/server/db'
import { documents } from '#/server/db/schema'
import {
  AppError,
  requireWorkspacePermission,
} from '#/server/authorization/authorize'
import { recordActivityEvent } from '#/server/activity/service'

export type DocumentInput = {
  name: string
  storageKey: string
  mimeType?: string | null
  sizeBytes?: number | null
}

export async function listDocuments(workspaceId: string) {
  await requireWorkspacePermission(workspaceId, 'documents:read')

  return db
    .select()
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId))
    .orderBy(desc(documents.createdAt))
}

export async function createDocument(
  workspaceId: string,
  input: DocumentInput,
) {
  const user = await requireWorkspacePermission(workspaceId, 'documents:create')

  const [document] = await db
    .insert(documents)
    .values({
      workspaceId,
      name: input.name.trim(),
      storageKey: input.storageKey,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      createdById: user.id,
    })
    .returning()

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: 'document.created',
    entityType: 'document',
    entityId: document.id,
  })

  return document
}

export async function updateDocument(
  workspaceId: string,
  documentId: string,
  input: Partial<DocumentInput>,
) {
  const user = await requireWorkspacePermission(workspaceId, 'documents:update')

  const patch: Partial<typeof documents.$inferInsert> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.mimeType !== undefined) patch.mimeType = input.mimeType
  if (input.sizeBytes !== undefined) patch.sizeBytes = input.sizeBytes
  if (input.storageKey !== undefined) patch.storageKey = input.storageKey

  const [document] = await db
    .update(documents)
    .set(patch)
    .where(
      and(eq(documents.id, documentId), eq(documents.workspaceId, workspaceId)),
    )
    .returning()

  if (!document) {
    throw new AppError('NOT_FOUND', 'Document not found')
  }

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: 'document.updated',
    entityType: 'document',
    entityId: document.id,
  })

  return document
}

export async function deleteDocument(workspaceId: string, documentId: string) {
  const user = await requireWorkspacePermission(workspaceId, 'documents:delete')

  const [document] = await db
    .delete(documents)
    .where(
      and(eq(documents.id, documentId), eq(documents.workspaceId, workspaceId)),
    )
    .returning()

  if (!document) {
    throw new AppError('NOT_FOUND', 'Document not found')
  }

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: 'document.deleted',
    entityType: 'document',
    entityId: document.id,
  })

  return document
}
