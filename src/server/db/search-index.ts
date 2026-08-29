import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: '.env.local', override: true })

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const sql = postgres(url, { prepare: false })

const statements = [
  `CREATE INDEX IF NOT EXISTS tasks_search_idx
     ON tasks USING gin (
       to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
     )`,
  `CREATE INDEX IF NOT EXISTS documents_search_idx
     ON documents USING gin (
       to_tsvector('english', coalesce(name, ''))
     )`,
  `CREATE INDEX IF NOT EXISTS workspaces_search_idx
     ON workspaces USING gin (
       to_tsvector('english', coalesce(name, '') || ' ' || coalesce(slug, ''))
     )`,
  `CREATE INDEX IF NOT EXISTS members_search_idx
     ON users USING gin (
       to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(email, ''))
     )`,
  `CREATE INDEX IF NOT EXISTS workspace_records_search_idx
     ON workspace_records USING gin (
       to_tsvector('english', coalesce(title, '') || ' ' || coalesce(details, ''))
     )`,
]

for (const statement of statements) {
  await sql.unsafe(statement)
}

// Verify the indexes exist.
const rows = await sql`
  SELECT indexname FROM pg_indexes
  WHERE schemaname = 'public' AND indexname IN
    ('tasks_search_idx', 'documents_search_idx', 'workspaces_search_idx', 'members_search_idx', 'workspace_records_search_idx')
`

console.log('Search indexes ready:', rows.map((r) => r.indexname).join(', '))
await sql.end()
