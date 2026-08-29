import { config } from 'dotenv'

config({ path: '.env.local' })

const { db } = await import('./index')
const { permissions } = await import('./schema')
const { permissionDefinitions } = await import('../authorization/permissions')

async function seedPermissions() {
  const values = Object.entries(permissionDefinitions).map(
    ([key, description]) => ({ key, description }),
  )

  const result = await db
    .insert(permissions)
    .values(values)
    .onConflictDoNothing({ target: permissions.key })
    .returning({ id: permissions.id })

  return result.length
}

async function main() {
  const inserted = await seedPermissions()
  const total = Object.keys(permissionDefinitions).length
  console.log(
    `Permission catalog: ${inserted}/${total} permission entries present.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
