import { config } from 'dotenv'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

config({ path: '.env.local' })

const { db } = await import('./index')

// Uses the same singleton `db` client, which disables prepared statements
// (required for Neon transaction pooling).
await migrate(db, {
  migrationsFolder: './src/server/db/migrations',
})

console.log('Migrations applied.')
process.exit(0)
