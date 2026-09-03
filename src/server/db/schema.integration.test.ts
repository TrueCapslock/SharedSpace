import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import postgres from 'postgres'

// This URL is intentionally fixed to the disposable Docker database. Never
// derive it from DATABASE_URL, which could point at development or production.
const sql = postgres(
  'postgresql://sharedspace_test:sharedspace_test@localhost:5433/sharedspace_test',
  { max: 1 },
)

type Fixtures = {
  userId: string
  firstWorkspaceId: string
  secondWorkspaceId: string
}

beforeEach(async () => {
  await sql.unsafe('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
})

afterAll(async () => {
  await sql.end()
})

async function createFixtures(): Promise<Fixtures> {
  const [user] = await sql<[{ id: string }]>`
    INSERT INTO users (clerk_id, display_name, email)
    VALUES ('clerk-test-user', 'Test User', 'test@example.com')
    RETURNING id
  `
  const [firstWorkspace] = await sql<[{ id: string }]>`
    INSERT INTO workspaces (name, slug, workspace_type, created_by_id)
    VALUES ('First workspace', 'first-workspace', 'custom', ${user.id})
    RETURNING id
  `
  const [secondWorkspace] = await sql<[{ id: string }]>`
    INSERT INTO workspaces (name, slug, workspace_type, created_by_id)
    VALUES ('Second workspace', 'second-workspace', 'boat', ${user.id})
    RETURNING id
  `

  return {
    userId: user.id,
    firstWorkspaceId: firstWorkspace.id,
    secondWorkspaceId: secondWorkspace.id,
  }
}

describe('database schema integration', () => {
  it('keeps task, document, and record queries scoped to a workspace', async () => {
    const fixtures = await createFixtures()

    await sql`
      INSERT INTO tasks (workspace_id, title, created_by_id)
      VALUES
        (${fixtures.firstWorkspaceId}, 'First task', ${fixtures.userId}),
        (${fixtures.secondWorkspaceId}, 'Second task', ${fixtures.userId})
    `
    await sql`
      INSERT INTO documents (workspace_id, name, storage_key, created_by_id)
      VALUES
        (${fixtures.firstWorkspaceId}, 'First document', 'first.pdf', ${fixtures.userId}),
        (${fixtures.secondWorkspaceId}, 'Second document', 'second.pdf', ${fixtures.userId})
    `
    await sql`
      INSERT INTO workspace_records (workspace_id, type, title, created_by_id)
      VALUES
        (${fixtures.firstWorkspaceId}, 'logbook_entry', 'First record', ${fixtures.userId}),
        (${fixtures.secondWorkspaceId}, 'logbook_entry', 'Second record', ${fixtures.userId})
    `

    const tasks = await sql<{ title: string }[]>`
      SELECT title FROM tasks WHERE workspace_id = ${fixtures.firstWorkspaceId}
    `
    const documents = await sql<{ name: string }[]>`
      SELECT name FROM documents WHERE workspace_id = ${fixtures.firstWorkspaceId}
    `
    const records = await sql<{ title: string }[]>`
      SELECT title FROM workspace_records
      WHERE workspace_id = ${fixtures.firstWorkspaceId}
    `

    expect(tasks).toEqual([{ title: 'First task' }])
    expect(documents).toEqual([{ name: 'First document' }])
    expect(records).toEqual([{ title: 'First record' }])
  })

  it('cascades workspace deletion to module data', async () => {
    const fixtures = await createFixtures()

    await sql`
      INSERT INTO tasks (workspace_id, title, created_by_id)
      VALUES (${fixtures.firstWorkspaceId}, 'Task', ${fixtures.userId})
    `
    await sql`
      INSERT INTO documents (workspace_id, name, storage_key, created_by_id)
      VALUES (${fixtures.firstWorkspaceId}, 'Document', 'document.pdf', ${fixtures.userId})
    `
    await sql`
      INSERT INTO workspace_records (workspace_id, type, title, created_by_id)
      VALUES (${fixtures.firstWorkspaceId}, 'logbook_entry', 'Record', ${fixtures.userId})
    `

    await sql`DELETE FROM workspaces WHERE id = ${fixtures.firstWorkspaceId}`

    const [taskCount] = await sql<[{ count: string }]>`
      SELECT count(*) FROM tasks WHERE workspace_id = ${fixtures.firstWorkspaceId}
    `
    const [documentCount] = await sql<[{ count: string }]>`
      SELECT count(*) FROM documents WHERE workspace_id = ${fixtures.firstWorkspaceId}
    `
    const [recordCount] = await sql<[{ count: string }]>`
      SELECT count(*) FROM workspace_records
      WHERE workspace_id = ${fixtures.firstWorkspaceId}
    `

    expect(taskCount.count).toBe('0')
    expect(documentCount.count).toBe('0')
    expect(recordCount.count).toBe('0')
  })

  it('rejects module data without an existing workspace', async () => {
    const fixtures = await createFixtures()

    await expect(
      sql`
        INSERT INTO tasks (workspace_id, title, created_by_id)
        VALUES ('00000000-0000-0000-0000-000000000000', 'Orphan task', ${fixtures.userId})
      `,
    ).rejects.toThrow()
  })
})
