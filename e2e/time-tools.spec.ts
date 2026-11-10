import { expect, test } from '@playwright/test'

import { toolSurface } from './helpers/selectors'

test.describe('Unix Timestamp', () => {
  test('Now fills a timestamp and shows it as dates', async ({ page }) => {
    await page.goto('/tools/unix-timestamp')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.getByRole('button', { name: 'Now' }).click()
    const output = dialog.locator('[data-slot="tool-output"][data-has-value]')
    await expect(output.getByText(/^\d{10}$/).first()).toBeVisible({ timeout: 5000 })
    await expect(output).toContainText('GMT')
  })

  test('shows an invalid timestamp in the status slot', async ({ page }) => {
    await page.goto('/tools/unix-timestamp')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.locator('input[name="dialog-source"]').fill('not-a-number')
    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toBeVisible({ timeout: 5000 })
    await expect(dialog.locator('[data-slot="tool-output"][data-has-value]')).toHaveCount(0)
  })
})

test.describe('Cron Expression Parser', () => {
  test('parses cron expression', async ({ page }) => {
    await page.goto('/tools/cron-expression-parser')
    const dialog = toolSurface(page)
    const input = dialog
      .locator('fieldset')
      .filter({ has: page.locator('label:text-is("Cron Expression")') })
      .locator('input')
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('* * * * *')

    // Scoped to the output: the preset chips above also say "minute".
    const output = dialog.locator('[data-slot="tool-output"]')
    await expect(output.getByText(/minute/i).first()).toBeVisible({ timeout: 3000 })
    await expect(output.getByText(/^Next \d+ runs \(UTC\)$/)).toBeVisible()
  })

  test('shows an invalid expression in the status slot', async ({ page }) => {
    await page.goto('/tools/cron-expression-parser')
    const dialog = toolSurface(page)
    const input = dialog
      .locator('fieldset')
      .filter({ has: page.locator('label:text-is("Cron Expression")') })
      .locator('input')
    await input.fill('* * *')

    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toContainText('Expected 5 fields', {
      timeout: 3000,
    })
  })
})

test.describe('Crontab Generator', () => {
  test('builds the expression live from the field editors', async ({ page }) => {
    await page.goto('/tools/crontab-generator')
    // Generator shell (live): the expression is built on open, with no button.
    const output = page.locator('[data-slot="tool-output"]')
    await expect(output.getByText('* * * * *')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Copy Cron expression to clipboard' })).toBeVisible()

    // Minute → Interval defaults to every 5 minutes.
    await page.getByRole('button', { name: 'Interval' }).first().click()
    await expect(output.getByText('*/5 * * * *')).toBeVisible({ timeout: 3000 })
    await expect(output.getByText(/Next \d+ runs \(UTC\)/)).toBeVisible()
  })
})
