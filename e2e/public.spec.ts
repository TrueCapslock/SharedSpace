import { expect, test } from '@playwright/test'

test('renders the public home page', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Organize what you share.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Open your workspaces' }),
  ).toBeVisible()
})

test('offers sign-in when an anonymous visitor opens app pages', async ({
  page,
}) => {
  await page.goto('/app')

  await expect(
    page.getByRole('heading', { name: 'Sign in to access your workspaces' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
    'href',
    /\/sign-in/,
  )
})
