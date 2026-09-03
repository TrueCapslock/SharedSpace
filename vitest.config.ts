import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.integration.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/routeTree.gen.ts'],
      thresholds: {
        statements: 20,
        branches: 15,
        functions: 12,
        lines: 20,
        'src/server/authorization/authorize.ts': {
          lines: 55,
        },
        'src/server/invitations/service.ts': {
          lines: 70,
        },
        'src/server/memberships/service.ts': {
          lines: 50,
        },
        'src/server/notifications/service.ts': {
          lines: 65,
        },
        'src/server/roles/service.ts': {
          lines: 90,
        },
        'src/server/workspaces/templates.ts': {
          lines: 85,
        },
        'src/server/tasks/service.ts': {
          lines: 70,
        },
        'src/server/documents/service.ts': {
          lines: 75,
        },
        'src/server/records/service.ts': {
          lines: 70,
        },
      },
    },
  },
})
