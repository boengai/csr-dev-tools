import { expect, test } from '@playwright/test'

test.describe('Escaped JSON Stringifier', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/escaped-json-stringifier')
  })

  test('stringifies valid JSON', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('{"name":"John"}')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('parses escaped JSON string', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // Dispatch click on mode button behind dialog overlay to switch mode
    await page.locator('button', { hasText: /^Parse$/ }).first().dispatchEvent('click')

    const input = dialog.locator('textarea').first()
    await input.fill('{\\"name\\":\\"John\\"}')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})
