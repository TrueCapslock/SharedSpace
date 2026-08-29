import { and, desc, eq } from 'drizzle-orm'
import { db } from '#/server/db'
import { workspaceRecords } from '#/server/db/schema'
import {
  AppError,
  requireWorkspaceMembership,
  requireWorkspacePermission,
} from '#/server/authorization/authorize'
import { recordActivityEvent } from '#/server/activity/service'

export type WorkspaceRecordType = typeof workspaceRecords.$inferSelect.type

export async function listWorkspaceRecords(
  workspaceId: string,
  type: WorkspaceRecordType,
) {
  await requireWorkspaceMembership(workspaceId)
  return db
    .select()
    .from(workspaceRecords)
    .where(
      and(
        eq(workspaceRecords.workspaceId, workspaceId),
        eq(workspaceRecords.type, type),
      ),
    )
    .orderBy(
      desc(workspaceRecords.occurredAt),
      desc(workspaceRecords.createdAt),
    )
}

export async function createWorkspaceRecord(
  workspaceId: string,
  input: {
    type: WorkspaceRecordType
    title: string
    details?: string | null
    status?: string
    amount?: number | null
    occurredAt?: Date | null
    metadata?: Record<string, unknown>
  },
) {
  const user = await requireWorkspacePermission(workspaceId, 'workspace:update')
  const [record] = await db
    .insert(workspaceRecords)
    .values({
      workspaceId,
      type: input.type,
      title: input.title.trim(),
      details: input.details?.trim() || null,
      status: input.status ?? 'active',
      amount: input.amount ?? null,
      occurredAt: input.occurredAt ?? null,
      metadata: input.metadata ?? {},
      createdById: user.id,
    })
    .returning()

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: `${input.type}.created`,
    entityType: 'workspace_record',
    entityId: record.id,
  })
  return record
}

export async function updateWorkspaceRecord(
  workspaceId: string,
  recordId: string,
  input: {
    title?: string
    details?: string | null
    status?: string
    amount?: number | null
    occurredAt?: Date | null
    metadata?: Record<string, unknown>
  },
) {
  const user = await requireWorkspacePermission(workspaceId, 'workspace:update')
  const [record] = await db
    .update(workspaceRecords)
    .set({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.details !== undefined ? { details: input.details } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.occurredAt !== undefined
        ? { occurredAt: input.occurredAt }
        : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workspaceRecords.id, recordId),
        eq(workspaceRecords.workspaceId, workspaceId),
      ),
    )
    .returning()
  if (!record) throw new AppError('NOT_FOUND', 'Record not found')

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: `${record.type}.updated`,
    entityType: 'workspace_record',
    entityId: record.id,
  })
  return record
}

export async function deleteWorkspaceRecord(
  workspaceId: string,
  recordId: string,
) {
  const user = await requireWorkspacePermission(workspaceId, 'workspace:update')
  const [record] = await db
    .delete(workspaceRecords)
    .where(
      and(
        eq(workspaceRecords.id, recordId),
        eq(workspaceRecords.workspaceId, workspaceId),
      ),
    )
    .returning()
  if (!record) throw new AppError('NOT_FOUND', 'Record not found')

  await recordActivityEvent({
    workspaceId,
    actorId: user.id,
    action: `${record.type}.deleted`,
    entityType: 'workspace_record',
    entityId: record.id,
  })
}
