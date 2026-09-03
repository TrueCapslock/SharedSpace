import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getOrCreateUser } from './service'

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@clerk/tanstack-react-start/server', () => ({ clerkClient: vi.fn() }))
vi.mock('#/env', () => ({ env: {} }))
vi.mock('#/server/auth', () => ({ getAuthInfo: vi.fn() }))
vi.mock('#/server/db', () => ({
  db: {
    query: { users: { findFirst: mocks.findUser } },
    insert: mocks.insert,
    update: mocks.update,
  },
}))

describe('user synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an unchanged existing user without writing', async () => {
    const existing = {
      id: 'user-1',
      clerkId: 'clerk-1',
      displayName: 'Test User',
      email: 'test@example.com',
    }
    mocks.findUser.mockResolvedValue(existing)

    await expect(
      getOrCreateUser({
        clerkId: 'clerk-1',
        displayName: 'Test User',
        email: 'test@example.com',
      }),
    ).resolves.toBe(existing)
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('updates a changed Clerk profile', async () => {
    mocks.findUser.mockResolvedValue({
      id: 'user-1',
      clerkId: 'clerk-1',
      displayName: 'Old Name',
      email: 'old@example.com',
    })
    const returning = vi.fn().mockResolvedValue([{ id: 'user-1' }])
    const where = vi.fn().mockReturnValue({ returning })
    const set = vi.fn().mockReturnValue({ where })
    mocks.update.mockReturnValue({ set })

    await expect(
      getOrCreateUser({
        clerkId: 'clerk-1',
        displayName: 'New Name',
        email: 'new@example.com',
      }),
    ).resolves.toEqual({ id: 'user-1' })
    expect(set).toHaveBeenCalledWith({
      displayName: 'New Name',
      email: 'new@example.com',
    })
  })

  it('creates an application user for a new Clerk identity', async () => {
    mocks.findUser.mockResolvedValue(undefined)
    const returning = vi.fn().mockResolvedValue([{ id: 'user-1' }])
    const values = vi.fn().mockReturnValue({ returning })
    mocks.insert.mockReturnValue({ values })

    await expect(
      getOrCreateUser({ clerkId: 'clerk-1', displayName: 'Test User' }),
    ).resolves.toEqual({ id: 'user-1' })
    expect(values).toHaveBeenCalledWith({
      clerkId: 'clerk-1',
      displayName: 'Test User',
      email: null,
    })
  })
})
