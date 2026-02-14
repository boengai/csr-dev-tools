import { expect, test } from '@playwright/test'

import { toolNames } from '../helpers/fixtures'
import { commandPalette, sidebar } from '../helpers/selectors'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders 6 tool cards on the dashboard', async ({ page }) => {
    // Default layout has all 6 tools assigned to positions
    const sections = page.locator('main section')
    await expect(sections).toHaveCount(6)

    // Verify at least some tool cards rendered with their names
    for (const name of toolNames) {
      await expect(page.getByRole('heading', { level: 3, name })).toBeVisible()
    }
  })

  test('sidebar opens when toggle button is clicked', async ({ page }) => {
    await sidebar.toggleButton(page).click()
    await expect(sidebar.nav(page)).toBeVisible()
  })

  test('command palette opens on keyboard shortcut', async ({ page }) => {
    // Wait for dashboard to fully render before sending keyboard shortcut
    await page.waitForLoadState('networkidle')
    await page.locator('main').click()
    await page.keyboard.press('Control+k')
    await expect(commandPalette.searchInput(page)).toBeVisible()
  })

  test('navigate to a tool via its dedicated route', async ({ page }) => {
    await page.goto('/tools/color-converter')
    await expect(page.getByRole('heading', { level: 3, name: 'Color Converter' })).toBeVisible()
  })
})
