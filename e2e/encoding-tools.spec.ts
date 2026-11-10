import { expect, test } from '@playwright/test'

import { base64 } from './helpers/fixtures'
import { codeInputIn, toolSurface } from './helpers/selectors'

test.describe('Base64 Codec', () => {
  test('encodes text to base64', async ({ page }) => {
    await page.goto('/tools/base64-codec')

    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await codeInputIn.fill(page, dialog, base64.valid.decoded)

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('URL Encoder/Decoder', () => {
  test('encodes URL string', async ({ page }) => {
    await page.goto('/tools/url-encoder-decoder')

    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await codeInputIn.fill(page, dialog, 'hello world & foo=bar')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('URL Parser', () => {
  test('parses URL into components', async ({ page }) => {
    await page.goto('/tools/url-parser')

    const input = page
      .locator('fieldset')
      .filter({ has: page.locator('label:text-is("URL")') })
      .locator('input')
    await input.fill('https://example.com:8080/path?key=value#section')

    const output = toolSurface(page).locator('[data-slot="tool-output"]')
    await expect(output.getByText('example.com', { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(output.getByText('Protocol', { exact: true })).toBeVisible()
    await expect(output.getByText('Hostname', { exact: true })).toBeVisible()
    await expect(output.getByText('Query: key', { exact: true })).toBeVisible()
  })

  test('shows an invalid URL in the status slot', async ({ page }) => {
    await page.goto('/tools/url-parser')

    const input = page
      .locator('fieldset')
      .filter({ has: page.locator('label:text-is("URL")') })
      .locator('input')
    await input.fill('not a url')

    await expect(toolSurface(page).locator('[data-slot="tool-status"]').getByRole('alert')).toContainText(
      'Invalid URL',
      { timeout: 3000 },
    )
  })
})
