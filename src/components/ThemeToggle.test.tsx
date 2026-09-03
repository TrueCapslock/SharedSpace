// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ThemeToggle from './ThemeToggle'

const mocks = vi.hoisted(() => ({ setTheme: vi.fn() }))

vi.mock('#/hooks/use-theme', () => ({
  useTheme: () => ({ theme: 'system', setTheme: mocks.setTheme }),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    mocks.setTheme.mockReset()
  })

  it('opens theme choices and persists the selected theme', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Change color theme' }))
    await user.click(screen.getByRole('menuitem', { name: 'Dark' }))

    expect(mocks.setTheme).toHaveBeenCalledWith('dark')
  })
})
