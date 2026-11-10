import { expect, test } from '@playwright/test'

import { cryptoData } from './helpers/fixtures'
import { toolSurface } from './helpers/selectors'

test.describe('Hash Generator', () => {
  test('generates hash from input text', async ({ page }) => {
    await page.goto('/tools/hash-generator')
    const input = page.locator('textarea').first()
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill(cryptoData.hashInput)

    // SHA-256 of "Hello, World!" fills the shell's output block.
    await expect(toolSurface(page).locator('pre[data-has-value]')).toHaveText(
      'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f',
      { timeout: 5000 },
    )
  })

  test('switching algorithm relabels and recomputes the output', async ({ page }) => {
    await page.goto('/tools/hash-generator')
    const dialog = toolSurface(page)
    await dialog.locator('textarea').first().fill(cryptoData.hashInput)
    await expect(dialog.locator('pre[data-has-value]')).toBeVisible({ timeout: 5000 })

    await dialog.getByRole('button', { name: 'Select MD5 algorithm' }).click()
    await expect(dialog.getByText('MD5 Hash', { exact: true })).toBeVisible()
    await expect(dialog.locator('pre[data-has-value]')).toHaveText('65a8e27d8879283831b664bd8b7f0ad4', {
      timeout: 5000,
    })
  })
})

test.describe('HMAC Generator', () => {
  test('generates HMAC from text and secret', async ({ page }) => {
    await page.goto('/tools/hmac-generator')
    const textInput = page.locator('textarea').first()
    await expect(textInput).toBeVisible({ timeout: 5000 })
    await textInput.fill(cryptoData.hashInput)

    // No key yet: the output is still its placeholder, not an error.
    const dialog = toolSurface(page)
    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toHaveCount(0)
    await expect(dialog.locator('pre[data-has-value]')).toHaveCount(0)

    const secretInput = page.locator('input[name="hmac-secret-key"]')
    await secretInput.fill(cryptoData.hmacSecret)

    await expect(dialog.locator('pre[data-has-value]')).toHaveText(/^[0-9a-f]{64}$/, { timeout: 5000 })
  })
})

test.describe('AES Encrypt/Decrypt', () => {
  test('shows encrypt/decrypt interface', async ({ page }) => {
    await page.goto('/tools/aes-encrypt-decrypt')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.locator('.cm-editor').first()).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Decrypt mode' })).toBeVisible()
  })

  test('round-trips through encrypt and decrypt, and shows a wrong password in the status slot', async ({ page }) => {
    await page.goto('/tools/aes-encrypt-decrypt')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.locator('.cm-content').first().click()
    await page.keyboard.insertText('top secret')
    await dialog.getByLabel('Password', { exact: true }).fill('hunter2')
    const cipher = dialog.locator('pre[data-has-value]')
    await expect(cipher).toBeVisible({ timeout: 10000 })
    const encrypted = (await cipher.textContent()) ?? ''

    await dialog.getByRole('button', { name: 'Decrypt mode' }).click()
    await dialog.locator('.cm-content').first().click()
    await page.keyboard.insertText(encrypted)
    await expect(dialog.locator('pre[data-has-value]')).toHaveText('top secret', { timeout: 10000 })

    await dialog.getByLabel('Password', { exact: true }).fill('wrong')
    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toContainText('Decryption failed', {
      timeout: 10000,
    })
    await expect(dialog.locator('pre[data-has-value]')).toHaveCount(0)
  })
})

test.describe('Password Generator', () => {
  test('generates password on load', async ({ page }) => {
    await page.goto('/tools/password-generator')
    const dialog = toolSurface(page)
    await expect(dialog.getByText(/^Passwords \(1\)$/)).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByRole('button', { name: 'Copy password 1 to clipboard' })).toBeEnabled()
  })

  test('Generate rerolls the password', async ({ page }) => {
    await page.goto('/tools/password-generator')
    const dialog = toolSurface(page)
    const first = dialog.locator('[data-slot="tool-output"] li').first()
    await expect(first).toBeVisible({ timeout: 5000 })
    const before = await first.textContent()

    await dialog.getByRole('button', { exact: true, name: 'Generate' }).click()
    await expect(async () => {
      expect(await first.textContent()).not.toBe(before)
    }).toPass({ timeout: 3000 })
  })
})
