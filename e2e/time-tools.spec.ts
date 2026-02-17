import { expect, test } from '@playwright/test'

test.describe('Unix Timestamp', () => {
  test('displays current timestamp', async ({ page }) => {
    await page.goto('/tools/unix-timestamp')
    // No dialog - renders directly
    await expect(page.getByText(/\d{10}/).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Cron Expression Parser', () => {
  test('parses cron expression', async ({ page }) => {
    await page.goto('/tools/cron-expression-parser')
    // No dialog - renders directly
    const input = page.locator('input').first()
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('* * * * *')

    await expect(page.getByText(/minute/i).first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Crontab Generator', () => {
  test('shows cron expression output', async ({ page }) => {
    await page.goto('/tools/crontab-generator')
    // No dialog - renders directly, should show generated cron expression
    await expect(page.getByText(/Expression|Cron/i).first()).toBeVisible({ timeout: 5000 })
  })
})
