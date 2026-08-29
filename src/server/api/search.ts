import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { searchWorkspace } from '#/server/search/service'

export const searchInWorkspace = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      workspaceId: z.string().uuid(),
      query: z.string().trim().max(200),
    }),
  )
  .handler(async ({ data }) => searchWorkspace(data.workspaceId, data.query))
