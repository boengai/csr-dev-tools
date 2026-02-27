import { expect, test } from '@playwright/test'

test.describe('HTML Entity Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/html-entity-converter')
  })

  test('encodes special characters to HTML entities', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('<div>')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('decodes HTML entities back to text', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // Dispatch click on mode button behind dialog overlay to switch mode
    await page.locator('button', { hasText: /^Decode$/ }).first().dispatchEvent('click')

    const input = dialog.locator('textarea').first()
    await input.fill('&lt;div&gt;')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})
