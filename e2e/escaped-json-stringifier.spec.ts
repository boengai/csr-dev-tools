import { expect, test } from '@playwright/test'

test.describe('Escaped JSON Stringifier', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/escaped-json-stringifier')
  })

  test('stringifies valid JSON', async ({ page }) => {
    await page.getByRole('button', { name: /Stringify/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('{"name":"John"}')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })

  test('parses escaped JSON string', async ({ page }) => {
    await page.getByRole('button', { name: /Parse/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('{\\"name\\":\\"John\\"}')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})
