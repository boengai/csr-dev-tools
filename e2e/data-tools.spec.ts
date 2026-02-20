import { expect, test } from '@playwright/test'

test.describe('HTTP Status Codes', () => {
  test('searches for 404 and finds Not Found', async ({ page }) => {
    await page.goto('/tools/http-status-codes')

    const searchInput = page.locator('fieldset').filter({ has: page.locator('label:text-is("Search")') }).locator('input')
    await searchInput.fill('404')

    await expect(page.getByText('Not Found')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('404')).toBeVisible()
  })
})

test.describe('OG Preview', () => {
  test('fills title and sees preview update', async ({ page }) => {
    await page.goto('/tools/og-preview')

    const titleInput = page.locator('fieldset').filter({ has: page.locator('label:text-is("og:title")') }).locator('input')
    await titleInput.fill('My Test Page')

    // Preview cards should show the title
    await expect(page.getByText('My Test Page').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('User Agent Parser', () => {
  test('clicks Use Mine and shows parsed result', async ({ page }) => {
    await page.goto('/tools/user-agent-parser')

    await page.getByRole('button', { name: 'Use my UA' }).click()

    // Should show parsed browser info
    await expect(page.getByText('Browser', { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('OS', { exact: true })).toBeVisible()
  })
})
