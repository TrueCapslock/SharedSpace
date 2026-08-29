import { db } from '#/server/db'
import { activityEvents } from '#/server/db/schema'

export async function recordActivityEvent(params: {
  workspaceId: string
  actorId: string | null
  action: string
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  await db.insert(activityEvents).values({
    workspaceId: params.workspaceId,
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata,
  })
}
