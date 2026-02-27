import { expect, test } from '@playwright/test'

import { base64 } from './helpers/fixtures'

test.describe('Base64 Encoder', () => {
  test('encodes text to base64', async ({ page }) => {
    await page.goto('/tools/base64-encoder')
    // Open the encode dialog
    await page.getByRole('button', { name: /^Encode$/ }).click()

    const input = page.locator('[role="dialog"] textarea').first()
    await input.fill(base64.valid.decoded)

    const output = page.locator('[role="dialog"] pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('URL Encoder/Decoder', () => {
  test('encodes URL string', async ({ page }) => {
    await page.goto('/tools/url-encoder-decoder')
    await page.getByRole('button', { name: /^Encode$/ }).click()

    const input = page.locator('[role="dialog"] textarea').first()
    await input.fill('hello world & foo=bar')

    const output = page.locator('[role="dialog"] pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('URL Parser', () => {
  test('parses URL into components', async ({ page }) => {
    await page.goto('/tools/url-parser')

    const input = page.locator('fieldset').filter({ has: page.locator('label:text-is("URL")') }).locator('input')
    await input.fill('https://example.com:8080/path?key=value#section')

    await expect(page.getByText('example.com')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('Protocol', { exact: true })).toBeVisible()
    await expect(page.getByText('Hostname', { exact: true })).toBeVisible()
  })
})
