import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Load local env (drizzle-kit runs outside Vite, so import.meta.env is absent).
config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set (expected in .env.local)')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './src/server/db/migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
})
