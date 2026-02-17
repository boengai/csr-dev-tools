import { expect, test } from '@playwright/test'

import { codeData } from './helpers/fixtures'

test.describe('JSON Formatter', () => {
  test('opens dialog and formats JSON', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    // Dialog auto-opens on dedicated route
    const input = page.locator('[role="dialog"] textarea').first()
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill(codeData.jsonInput)

    // Verify formatted output appears in the second textarea
    const output = page.locator('[role="dialog"] textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('Markdown Table Generator', () => {
  test('renders with table grid visible', async ({ page }) => {
    await page.goto('/tools/markdown-table-generator')

    await expect(page.getByRole('table')).toBeVisible({ timeout: 3000 })
  })
})
