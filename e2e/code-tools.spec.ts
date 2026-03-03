import { expect, test } from '@playwright/test'

import { codeData } from './helpers/fixtures'
import { codeInputIn } from './helpers/selectors'

test.describe('JSON Formatter', () => {
  test('opens dialog and formats JSON', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    // Dialog auto-opens on dedicated route
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog.locator('.cm-editor').first()).toBeVisible({ timeout: 5000 })
    await codeInputIn.fill(page, dialog, codeData.jsonInput)

    // Verify formatted output appears in the output pre block
    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Markdown Table Generator', () => {
  test('renders with table grid visible', async ({ page }) => {
    await page.goto('/tools/markdown-table-generator')

    await expect(page.getByRole('table')).toBeVisible({ timeout: 3000 })
  })
})
