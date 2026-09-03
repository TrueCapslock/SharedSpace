import { describe, expect, it, vi } from 'vitest'

import { recordInputSchema, workspaceRecordTypes } from './records'

vi.mock('#/server/records/service', () => ({
  createWorkspaceRecord: vi.fn(),
  deleteWorkspaceRecord: vi.fn(),
  listWorkspaceRecords: vi.fn(),
  updateWorkspaceRecord: vi.fn(),
}))

describe('workspace record API validation', () => {
  it('accepts serializable record metadata and supported record types', () => {
    expect(
      recordInputSchema.parse({
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
        type: 'logbook_entry',
        title: 'Morning passage',
        occurredAt: '2026-09-03T10:00:00.000Z',
        metadata: { berth: 'A-12' },
      }),
    ).toMatchObject({
      type: 'logbook_entry',
      metadata: { berth: 'A-12' },
    })
  })

  it('rejects invalid workspace IDs, types, and timestamps', () => {
    expect(
      recordInputSchema.safeParse({
        workspaceId: 'not-a-uuid',
        type: 'unknown',
        title: '',
        occurredAt: 'not-a-date',
      }).success,
    ).toBe(false)
    expect(workspaceRecordTypes).toContain('logbook_entry')
  })
})
