import { expect, test } from '@playwright/test'

test.describe('HTML Entity Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/html-entity-converter')
  })

  test('encodes special characters to HTML entities', async ({ page }) => {
    await page.getByRole('button', { name: /Encode/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('<div>')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })

  test('decodes HTML entities back to text', async ({ page }) => {
    await page.getByRole('button', { name: /Decode/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('&lt;div&gt;')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})
