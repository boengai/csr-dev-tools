import { expect, test } from '@playwright/test'

import { cryptoData } from './helpers/fixtures'

test.describe('Hash Generator', () => {
  test('generates hash from input text', async ({ page }) => {
    await page.goto('/tools/hash-generator')
    const input = page.locator('textarea').first()
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill(cryptoData.hashInput)

    // Hash output appears in a span, wait for the em-dash to be replaced
    await expect(page.locator('.font-mono').first()).not.toHaveText('—', { timeout: 5000 })
  })
})

test.describe('HMAC Generator', () => {
  test('generates HMAC from text and secret', async ({ page }) => {
    await page.goto('/tools/hmac-generator')
    const textInput = page.locator('textarea').first()
    await expect(textInput).toBeVisible({ timeout: 5000 })
    await textInput.fill(cryptoData.hashInput)

    const secretInput = page.locator('input[name="hmac-secret-key"]')
    await secretInput.fill(cryptoData.hmacSecret)

    // HMAC output appears in a span
    await expect(page.locator('.font-mono').first()).not.toHaveText('—', { timeout: 5000 })
  })
})

test.describe('AES Encrypt/Decrypt', () => {
  test('shows encrypt/decrypt interface', async ({ page }) => {
    await page.goto('/tools/aes-encrypt-decrypt')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.locator('textarea').first()).toBeVisible()
  })
})

test.describe('Password Generator', () => {
  test('generates password on load', async ({ page }) => {
    await page.goto('/tools/password-generator')
    await expect(page.getByText('Generated Passwords').first()).toBeVisible({ timeout: 5000 })
  })
})
