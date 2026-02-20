import { expect, test } from '@playwright/test'

test.describe('ENV File Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/env-file-converter')
  })

  test('converts .env to JSON', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('FOO=bar\nBAZ=123')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })

  test('converts JSON to .env', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // Dispatch click on mode button behind dialog overlay to switch mode
    await page.locator('button', { hasText: /JSON → \.env/i }).first().dispatchEvent('click')

    const input = dialog.locator('textarea').first()
    await input.fill('{"FOO":"bar","BAZ":"123"}')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})
