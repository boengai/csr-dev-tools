import { expect, test } from '@playwright/test'

import { commandPalette, sidebar } from '../helpers/selectors'

const TOOL_ROUTES = [
  '/tools/text-case-converter',
  '/tools/word-counter',
  '/tools/base64-encoder',
  '/tools/url-parser',
  '/tools/box-shadow-generator',
  '/tools/http-status-codes',
  '/tools/password-generator',
  '/tools/uuid-generator',
  '/tools/css-gradient-generator',
  '/tools/hash-generator',
]

test.describe('Navigation', () => {
  test('sidebar shows tool categories', async ({ page }) => {
    await page.goto('/')
    await sidebar.toggleButton(page).click()
    await expect(sidebar.nav(page)).toBeVisible()

    // Verify key categories are listed
    for (const category of ['Code', 'CSS', 'Data', 'Encoding', 'Text']) {
      await expect(sidebar.nav(page).getByText(category, { exact: true }).first()).toBeVisible()
    }
  })

  test('command palette finds tools by name', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('main').click()
    await page.keyboard.press('Control+k')

    await expect(commandPalette.searchInput(page)).toBeVisible()
    await commandPalette.searchInput(page).fill('Base64')

    await expect(commandPalette.resultOption(page, /Base64 Encoder/)).toBeVisible({ timeout: 3000 })
  })

  test('tool routes load without error', async ({ page }) => {
    for (const route of TOOL_ROUTES) {
      await page.goto(route)
      // Each tool page should have an h3 heading (the tool title)
      await expect(page.locator('h3').first()).toBeVisible({ timeout: 5000 })
      // No crash - page should not show an error boundary
      await expect(page.getByText('Something went wrong')).not.toBeVisible()
    }
  })
})
