import { expect, test } from '@playwright/test'

import { codeInputIn } from './helpers/selectors'

test.describe('HTML Entity Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/html-entity-converter')
  })

  test('encodes special characters to HTML entities', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, '<div>')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('decodes HTML entities back to text', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // Dispatch click on mode button behind dialog overlay to switch mode
    await page.locator('button', { hasText: 'Decode HTML Entities' }).first().dispatchEvent('click')

    await codeInputIn.fill(page, dialog, '&lt;div&gt;')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})
