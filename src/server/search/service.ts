import { and, eq, sql } from 'drizzle-orm'
import { db } from '#/server/db'
import {
  documents,
  tasks,
  users,
  workspaceMemberships,
  workspaceRecords,
} from '#/server/db/schema'
import { requireWorkspaceMembership } from '#/server/authorization/authorize'

export type SearchResult = {
  type: 'task' | 'document' | 'member' | 'record'
  id: string
  title: string
  subtitle: string | null
  workspaceId: string
  route?: string
}

const MAX_RESULTS_PER_TYPE = 5

const recordRoutes: Record<string, string> = {
  message: '/app/messages',
  meter: '/app/meters',
  inventory: '/app/inventory',
  resident: '/app/residents',
  board_card: '/app/board',
  backlog_item: '/app/backlog',
  sprint: '/app/sprints',
  time_entry: '/app/time',
  roadmap_item: '/app/roadmap',
  resource: '/app/resources',
  risk: '/app/risks',
  logbook_entry: '/app/logbook',
  access_key: '/app/access',
  cabin_info: '/app/cabin-info',
  utility: '/app/utilities',
  berth: '/app/berths',
  insight: '/app/insights',
}

/**
 * Full-text search across the current user's active workspace. Searches task
 * titles/descriptions, document names, and member names/emails using Postgres
 * `to_tsvector` + GIN functional indexes. Results are scoped to an active
 * membership in the given workspace.
 */
export async function searchWorkspace(
  workspaceId: string,
  rawQuery: string,
): Promise<SearchResult[]> {
  await requireWorkspaceMembership(workspaceId)

  const query = rawQuery.trim()
  if (!query) return []

  const condition = sql`to_tsvector('english', coalesce(${tasks.title}, '') || ' ' || coalesce(${tasks.description}, '')) @@ websearch_to_tsquery('english', ${query})`
  const tasksQuery = db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      workspaceId: tasks.workspaceId,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), condition))
    .orderBy(
      sql`ts_rank(to_tsvector('english', coalesce(${tasks.title}, '') || ' ' || coalesce(${tasks.description}, '')), websearch_to_tsquery('english', ${query})) desc`,
    )
    .limit(MAX_RESULTS_PER_TYPE)

  const documentsCondition = sql`to_tsvector('english', coalesce(${documents.name}, '')) @@ websearch_to_tsquery('english', ${query})`
  const documentsQuery = db
    .select({
      id: documents.id,
      name: documents.name,
      mimeType: documents.mimeType,
      workspaceId: documents.workspaceId,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(and(eq(documents.workspaceId, workspaceId), documentsCondition))
    .orderBy(
      sql`ts_rank(to_tsvector('english', coalesce(${documents.name}, '')), websearch_to_tsquery('english', ${query})) desc`,
    )
    .limit(MAX_RESULTS_PER_TYPE)

  const membersCondition = sql`to_tsvector('english', coalesce(${users.displayName}, '') || ' ' || coalesce(${users.email}, '')) @@ websearch_to_tsquery('english', ${query})`
  const membersQuery = db
    .select({
      userId: users.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(workspaceMemberships)
    .innerJoin(users, eq(users.id, workspaceMemberships.userId))
    .where(
      and(eq(workspaceMemberships.workspaceId, workspaceId), membersCondition),
    )
    .orderBy(
      sql`ts_rank(to_tsvector('english', coalesce(${users.displayName}, '') || ' ' || coalesce(${users.email}, '')), websearch_to_tsquery('english', ${query})) desc`,
    )
    .limit(MAX_RESULTS_PER_TYPE)

  const recordsCondition = sql`to_tsvector('english', coalesce(${workspaceRecords.title}, '') || ' ' || coalesce(${workspaceRecords.details}, '')) @@ websearch_to_tsquery('english', ${query})`
  const recordsQuery = db
    .select({
      id: workspaceRecords.id,
      title: workspaceRecords.title,
      type: workspaceRecords.type,
      workspaceId: workspaceRecords.workspaceId,
    })
    .from(workspaceRecords)
    .where(and(eq(workspaceRecords.workspaceId, workspaceId), recordsCondition))
    .orderBy(
      sql`ts_rank(to_tsvector('english', coalesce(${workspaceRecords.title}, '') || ' ' || coalesce(${workspaceRecords.details}, '')), websearch_to_tsquery('english', ${query})) desc`,
    )
    .limit(MAX_RESULTS_PER_TYPE)

  const [taskRows, documentRows, memberRows, recordRows] = await Promise.all([
    tasksQuery,
    documentsQuery,
    membersQuery,
    recordsQuery,
  ])

  const results: SearchResult[] = [
    ...taskRows.map((row) => ({
      type: 'task' as const,
      id: row.id,
      title: row.title,
      subtitle: `Task · ${row.status}`,
      workspaceId: row.workspaceId,
    })),
    ...documentRows.map((row) => ({
      type: 'document' as const,
      id: row.id,
      title: row.name,
      subtitle: row.mimeType ? `Document · ${row.mimeType}` : 'Document',
      workspaceId: row.workspaceId,
    })),
    ...memberRows.map((row) => ({
      type: 'member' as const,
      id: row.userId,
      title: row.displayName,
      subtitle: row.email ? `Member · ${row.email}` : 'Member',
      workspaceId,
    })),
    ...recordRows.map((row) => ({
      type: 'record' as const,
      id: row.id,
      title: row.title,
      subtitle: `${recordLabel(row.type)} · ${row.type.replace('_', ' ')}`,
      workspaceId: row.workspaceId,
      route: recordRoutes[row.type],
    })),
  ]

  return results
}

function recordLabel(type: string): string {
  const labels: Record<string, string> = {
    message: 'Message',
    meter: 'Meter',
    inventory: 'Inventory',
    resident: 'Resident',
    board_card: 'Board',
    backlog_item: 'Backlog',
    sprint: 'Sprint',
    time_entry: 'Time & cost',
    roadmap_item: 'Roadmap',
    resource: 'Resource',
    risk: 'Risk',
    logbook_entry: 'Logbook',
    access_key: 'Access',
    cabin_info: 'Cabin info',
    utility: 'Utility',
    berth: 'Berth',
    insight: 'Insight',
  }
  return labels[type] ?? 'Record'
}
