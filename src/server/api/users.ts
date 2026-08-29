import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { updateUserProfile } from '#/server/users/service'
import type { JsonValue } from '#/lib/json'

export const updateProfileFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      displayName: z.string().trim().min(1).max(255).optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await updateUserProfile({
      displayName: data.displayName,
      preferences: data.theme !== undefined ? { theme: data.theme } : undefined,
    })
    return { ...user, preferences: (user.preferences ?? {}) as JsonValue }
  })
