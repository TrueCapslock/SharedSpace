import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '#/env'

import * as schema from './schema'

/**
 * Create a singleton client to avoid exhausting the connection pool during
 * development hot-reloads and serverless cold starts.
 *
 * `prepare: false` is required for transaction-pooling PostgreSQL providers
 * such as Neon.
 */
const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof createDb>
}

function createDb() {
  const client = postgres(env.DATABASE_URL, { prepare: false })
  return drizzle(client, { schema })
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db
}
