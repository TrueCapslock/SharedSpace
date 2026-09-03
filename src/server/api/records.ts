import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  createWorkspaceRecord,
  deleteWorkspaceRecord,
  listWorkspaceRecords,
  updateWorkspaceRecord,
} from '#/server/records/service'
import type { JsonValue } from '#/lib/json'

export const workspaceRecordTypes = [
  'message',
  'meter',
  'inventory',
  'resident',
  'board_card',
  'backlog_item',
  'sprint',
  'time_entry',
  'roadmap_item',
  'resource',
  'risk',
  'logbook_entry',
  'access_key',
  'cabin_info',
  'utility',
  'berth',
  'insight',
] as const

export const recordInputSchema = z.object({
  workspaceId: z.string().uuid(),
  type: z.enum(workspaceRecordTypes),
  title: z.string().trim().min(1).max(255),
  details: z.string().trim().max(10000).nullable().optional(),
  status: z.string().trim().min(1).max(100).optional(),
  amount: z.number().nullable().optional(),
  occurredAt: z.string().datetime().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

function serializeRecord<
  T extends { metadata: Record<string, unknown> | null },
>(record: T) {
  return { ...record, metadata: (record.metadata ?? {}) as JsonValue }
}

export const getWorkspaceRecords = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      type: z.enum(workspaceRecordTypes),
    }),
  )
  .handler(async ({ data }) =>
    (await listWorkspaceRecords(data.workspaceId, data.type)).map(
      serializeRecord,
    ),
  )

export const createWorkspaceRecordFn = createServerFn({ method: 'POST' })
  .validator(recordInputSchema)
  .handler(async ({ data }) =>
    createWorkspaceRecord(data.workspaceId, {
      ...data,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : null,
      metadata: data.metadata ?? {},
    }).then(serializeRecord),
  )

export const updateWorkspaceRecordFn = createServerFn({ method: 'POST' })
  .validator(
    recordInputSchema
      .partial()
      .extend({ workspaceId: z.string().uuid(), recordId: z.string().uuid() }),
  )
  .handler(async ({ data }) =>
    updateWorkspaceRecord(data.workspaceId, data.recordId, {
      title: data.title,
      details: data.details,
      status: data.status,
      amount: data.amount,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
      metadata: data.metadata ?? undefined,
    }).then(serializeRecord),
  )

export const deleteWorkspaceRecordFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ workspaceId: z.string().uuid(), recordId: z.string().uuid() }),
  )
  .handler(async ({ data }) =>
    deleteWorkspaceRecord(data.workspaceId, data.recordId),
  )
