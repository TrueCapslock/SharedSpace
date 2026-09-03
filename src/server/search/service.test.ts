import { beforeEach, describe, expect, it, vi } from 'vitest'

import { searchWorkspace } from './service'

const mocks = vi.hoisted(() => ({ requireWorkspaceMembership: vi.fn() }))

vi.mock('#/server/db', () => ({ db: { select: vi.fn() } }))
vi.mock('#/server/authorization/authorize', () => ({
  requireWorkspaceMembership: mocks.requireWorkspaceMembership,
}))

describe('workspace search', () => {
  beforeEach(() => {
    mocks.requireWorkspaceMembership.mockReset()
    mocks.requireWorkspaceMembership.mockResolvedValue({ id: 'user-1' })
  })

  it('requires workspace membership before returning an empty query result', async () => {
    await expect(searchWorkspace('workspace-1', '   ')).resolves.toEqual([])
    expect(mocks.requireWorkspaceMembership).toHaveBeenCalledWith('workspace-1')
  })
})
