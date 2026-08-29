import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

config({ path: '.env.local' })

const { db } = await import('./index')
const { workspaces, workspaceTypeEnum } = await import('./schema')
const { getWorkspaceTemplate, workspaceModuleKeys } = await import(
  '../workspaces/templates'
)

async function main() {
  const rows = await db.select().from(workspaces)
  let updated = 0
  let skipped = 0

  const validTypes = workspaceTypeEnum.enumValues as string[]

  for (const row of rows) {
    if (!validTypes.includes(row.workspaceType)) {
      skipped++
      continue
    }
    const settings = row.settings ?? {}
    if (Array.isArray(settings.modules)) {
      const valid = settings.modules.filter((m) =>
        workspaceModuleKeys.includes(m as (typeof workspaceModuleKeys)[number]),
      )
      if (valid.length === settings.modules.length) {
        skipped++
        continue
      }
      settings.modules = valid
    } else {
      const defaults = getWorkspaceTemplate(row.workspaceType)
      settings.modules = defaults.modules
    }

    await db
      .update(workspaces)
      .set({ settings })
      .where(eq(workspaces.id, row.id))
    updated++
  }

  console.log(
    `Module backfill done: ${updated} updated, ${skipped} already in sync.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
