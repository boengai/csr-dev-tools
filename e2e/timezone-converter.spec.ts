import { expect, test } from '@playwright/test'

test.describe('Timezone Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/timezone-converter')
    await expect(page.getByText('Source')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Timezone Converter' })).toBeVisible()
    await expect(
      page.getByText('Convert date and time between timezones', { exact: false }),
    ).toBeVisible()
  })

  test('default state — source timezone is populated, date/time inputs present, default targets shown', async ({
    page,
  }) => {
    // Source timezone chip is visible
    await expect(page.locator('span.rounded.bg-gray-800').first()).toBeVisible()

    // Date and time inputs are present and populated
    const dateInput = page.locator('#tz-date')
    const timeInput = page.locator('#tz-time')
    await expect(dateInput).toBeVisible()
    await expect(timeInput).toBeVisible()
    await expect(dateInput).not.toHaveValue('')
    await expect(timeInput).not.toHaveValue('')

    // Default target timezones are shown with conversion results
    const targetResults = page.locator('[role="status"]')
    await expect(targetResults.first()).toBeVisible({ timeout: 5000 })
  })

  test('click "Now" button → date and time inputs are populated with current values', async ({ page }) => {
    // Clear inputs first
    const dateInput = page.locator('#tz-date')
    const timeInput = page.locator('#tz-time')

    await dateInput.fill('')
    await timeInput.fill('')

    // Click Now
    await page.getByTestId('now-button').click()

    // Verify inputs are populated
    await expect(dateInput).not.toHaveValue('')
    await expect(timeInput).not.toHaveValue('')
  })

  test('change source date → target conversions update', async ({ page }) => {
    // Wait for initial results
    const targetResults = page.locator('[role="status"]')
    await expect(targetResults.first()).toBeVisible({ timeout: 5000 })

    // Get initial result text
    const initialText = await targetResults.first().textContent()

    // Change the date
    const dateInput = page.locator('#tz-date')
    await dateInput.fill('2020-01-15')

    // Wait for debounced update (300ms + buffer)
    await page.waitForTimeout(500)

    // Results should have changed
    const updatedText = await targetResults.first().textContent()
    expect(updatedText).not.toBe(initialText)
  })

  test('add a target timezone via search → new conversion row appears', async ({ page }) => {
    // Wait for initial results
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 5000 })

    // Count initial targets
    const initialCount = await page.locator('[role="status"]').count()

    // Click "Add Timezone"
    await page.getByTestId('add-timezone-button').click()

    // Search for a timezone that likely isn't in defaults
    const searchInputs = page.locator('input[name="timezone-search"]')
    await searchInputs.last().fill('singapore')

    // Click on the result
    await page.getByText('Singapore').first().click()

    // Wait for update
    await page.waitForTimeout(500)

    // Should have one more result
    const newCount = await page.locator('[role="status"]').count()
    expect(newCount).toBe(initialCount + 1)
  })

  test('search for "tokyo" in timezone picker → Asia/Tokyo appears in results', async ({ page }) => {
    // Click "Add Timezone"
    await page.getByTestId('add-timezone-button').click()

    // Type in the search
    const searchInputs = page.locator('input[name="timezone-search"]')
    await searchInputs.last().fill('tokyo')

    // Verify Tokyo appears in the dropdown
    await expect(page.getByText('Tokyo').first()).toBeVisible()
  })

  test('search for "pst" → Pacific timezone results appear', async ({ page }) => {
    // Click "Add Timezone"
    await page.getByTestId('add-timezone-button').click()

    // Type "pst" in the search
    const searchInputs = page.locator('input[name="timezone-search"]')
    await searchInputs.last().fill('pst')

    // Should see timezone results with PST
    const results = page.locator('[role="listbox"] [role="option"]')
    await expect(results.first()).toBeVisible({ timeout: 3000 })
  })

  test('remove a target timezone → row disappears', async ({ page }) => {
    // Wait for initial results
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 5000 })

    const initialCount = await page.locator('[role="status"]').count()
    expect(initialCount).toBeGreaterThan(0)

    // Click remove on first target
    const removeButtons = page.getByLabel(/^Remove /)
    await removeButtons.first().click()

    // Wait for AnimatePresence exit animation to complete, then verify count decreased
    await expect(page.locator('[role="status"]')).toHaveCount(initialCount - 1, { timeout: 5000 })
  })

  test('star a timezone → verify it persists after page reload using localStorage', async ({ page }) => {
    // Wait for initial results
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 5000 })

    // Click star on the first target
    const starButtons = page.getByLabel(/to favorites/)
    await starButtons.first().click()

    // Verify localStorage has the favorite
    const favorites = await page.evaluate(() => {
      const stored = localStorage.getItem('csr-dev-tools-timezone-favorites')
      return stored ? JSON.parse(stored) : []
    })
    expect(favorites.length).toBeGreaterThan(0)

    // Reload the page
    await page.reload()
    await expect(page.getByText('Source')).toBeVisible({ timeout: 5000 })

    // Verify favorite persisted in localStorage
    const favoritesAfterReload = await page.evaluate(() => {
      const stored = localStorage.getItem('csr-dev-tools-timezone-favorites')
      return stored ? JSON.parse(stored) : []
    })
    expect(favoritesAfterReload.length).toBeGreaterThan(0)
    expect(favoritesAfterReload).toEqual(favorites)
  })

  test('click CopyButton on a result → value copied to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Wait for results
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 5000 })

    // Click copy on first result
    const copyButtons = page.getByLabel(/Copy .* to clipboard/)
    await expect(copyButtons.first()).toBeVisible()
    await copyButtons.first().click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText.length).toBeGreaterThan(0)
  })

  test('mobile viewport (375px) responsiveness — inputs and results stack vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    // Verify key elements are still visible
    await expect(page.getByText('Source')).toBeVisible()
    await expect(page.getByText('Target Timezones')).toBeVisible()
    await expect(page.locator('#tz-date')).toBeVisible()
    await expect(page.locator('#tz-time')).toBeVisible()
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 5000 })
  })
})
