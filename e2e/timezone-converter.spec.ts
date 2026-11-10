import { expect, type Page, test } from '@playwright/test'

test.describe('Timezone Converter', () => {
  const source = (page: Page) => page.locator('input[name="dialog-source"]')
  const rows = (page: Page) => page.locator('[data-slot="tool-output"] dd')

  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/timezone-converter')
    await expect(source(page)).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Timezone Converter' })).toBeVisible()
    await expect(page.getByText('Convert date and time between timezones', { exact: false })).toBeVisible()
  })

  test('opens on the placeholder with the source timezone and default targets as controls', async ({ page }) => {
    await expect(source(page)).toHaveValue('')
    await expect(page.getByText('Enter a date and time (or press Now) to see it in each target timezone')).toBeVisible()
    await expect(page.getByLabel(/^Remove /).first()).toBeVisible()
  })

  test('click "Now" → source filled and one row per target zone', async ({ page }) => {
    await page.getByTestId('now-button').click()
    await expect(source(page)).toHaveValue(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    const targets = await page.getByLabel(/^Remove /).count()
    await expect(rows(page)).toHaveCount(targets, { timeout: 5000 })
  })

  test('change the date → target conversions update', async ({ page }) => {
    await source(page).fill('2020-01-15 12:00')
    await expect(rows(page).first()).toBeVisible({ timeout: 5000 })
    const initialText = await rows(page).first().textContent()

    await source(page).fill('2020-07-15 12:00')
    await expect(rows(page).first()).not.toHaveText(initialText ?? '', { timeout: 5000 })
  })

  test('bad date → error in the status slot, output cleared', async ({ page }) => {
    await source(page).fill('next tuesday')
    await expect(page.locator('[data-slot="tool-status"]').getByRole('alert')).toContainText('YYYY-MM-DD', {
      timeout: 5000,
    })
    await expect(rows(page)).toHaveCount(0)
  })

  test('add a target timezone via search → new conversion row appears', async ({ page }) => {
    await page.getByTestId('now-button').click()
    await expect(rows(page).first()).toBeVisible({ timeout: 5000 })
    const initialCount = await rows(page).count()

    await page.getByTestId('add-timezone-button').click()
    await page.getByLabel('Search timezones to add').fill('singapore')
    await page.getByRole('option').filter({ hasText: 'Singapore' }).first().click()

    await expect(rows(page)).toHaveCount(initialCount + 1, { timeout: 5000 })
  })

  test('search for "tokyo" in timezone picker → Asia/Tokyo appears in results', async ({ page }) => {
    await page.getByTestId('add-timezone-button').click()
    await page.getByLabel('Search timezones to add').fill('tokyo')
    await expect(page.getByRole('option').filter({ hasText: 'Tokyo' }).first()).toBeVisible()
  })

  test('search for "los angeles" → Pacific timezone results appear', async ({ page }) => {
    await page.getByTestId('add-timezone-button').click()
    await page.getByLabel('Search timezones to add').fill('los angeles')
    await expect(page.locator('[role="listbox"] [role="option"]').first()).toBeVisible({ timeout: 3000 })
  })

  test('remove a target timezone → row disappears', async ({ page }) => {
    await page.getByTestId('now-button').click()
    await expect(rows(page).first()).toBeVisible({ timeout: 5000 })
    const initialCount = await rows(page).count()
    expect(initialCount).toBeGreaterThan(0)

    await page
      .getByLabel(/^Remove /)
      .first()
      .click()
    await expect(rows(page)).toHaveCount(initialCount - 1, { timeout: 5000 })
  })

  test('star a timezone → it persists after page reload in localStorage', async ({ page }) => {
    await page
      .getByLabel(/to favorites/)
      .first()
      .click()

    const favorites = await page.evaluate(() => {
      const stored = localStorage.getItem('csr-dev-tools-timezone-favorites')
      return stored ? JSON.parse(stored) : []
    })
    expect(favorites.length).toBeGreaterThan(0)

    await page.reload()
    await expect(source(page)).toBeVisible({ timeout: 5000 })

    const favoritesAfterReload = await page.evaluate(() => {
      const stored = localStorage.getItem('csr-dev-tools-timezone-favorites')
      return stored ? JSON.parse(stored) : []
    })
    expect(favoritesAfterReload).toEqual(favorites)
  })

  test('click Copy on a row → value copied to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByTestId('now-button').click()
    await expect(rows(page).first()).toBeVisible({ timeout: 5000 })

    await page
      .locator('[data-slot="tool-output"]')
      .getByLabel(/Copy .* to clipboard/)
      .first()
      .click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText.length).toBeGreaterThan(0)
  })

  test('mobile viewport (375px) responsiveness — inputs and results stack vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })
    await page.getByTestId('now-button').click()

    await expect(source(page)).toBeVisible()
    await expect(page.getByText('Target timezones')).toBeVisible()
    await expect(rows(page).first()).toBeVisible({ timeout: 5000 })
  })
})
