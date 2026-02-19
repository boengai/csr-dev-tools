import { expect, test } from '@playwright/test'

test.describe('ENV File Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/env-file-converter')
  })

  test('converts .env to JSON', async ({ page }) => {
    await page.getByRole('button', { name: /\.env → JSON/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('FOO=bar\nBAZ=123')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })

  test('converts JSON to .env', async ({ page }) => {
    await page.getByRole('button', { name: /JSON → \.env/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('{"FOO":"bar","BAZ":"123"}')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})
