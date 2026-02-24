import { expect, test } from '@playwright/test'

import { card, copyButton, toast } from './helpers/selectors'

test.describe('RSA Key Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/rsa-key-generator')
    await expect(page.getByRole('button', { name: 'Generate RSA key pair' })).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title, description, and security banner', async ({ page }) => {
    await expect(card.title(page, 'RSA Key Generator')).toBeVisible()
    await expect(
      page.getByText(
        'Generate RSA key pairs entirely in your browser using Web Crypto API. Download public and private keys in PEM format. Keys never leave your browser.',
      ),
    ).toBeVisible()
    await expect(
      page.getByText('Keys are generated entirely in your browser. No data is sent to any server.'),
    ).toBeVisible()
  })

  test('default key size is 2048 and generate button is enabled', async ({ page }) => {
    const button2048 = page.getByRole('button', { name: '2048 bits' })
    await expect(button2048).toHaveAttribute('aria-pressed', 'true')

    const generateButton = page.getByRole('button', { name: 'Generate RSA key pair' })
    await expect(generateButton).toBeEnabled()
  })

  test('generate 2048-bit keys → shows valid PEM public and private keys', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate RSA key pair' }).click()

    const publicKeyArea = page.locator('textarea[name="public-key-output"]')
    const privateKeyArea = page.locator('textarea[name="private-key-output"]')

    await expect(publicKeyArea).toBeVisible({ timeout: 5000 })
    await expect(privateKeyArea).toBeVisible()

    const publicKey = await publicKeyArea.inputValue()
    const privateKey = await privateKeyArea.inputValue()

    expect(publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/)
    expect(publicKey).toMatch(/-----END PUBLIC KEY-----$/)
    expect(privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/)
    expect(privateKey).toMatch(/-----END PRIVATE KEY-----$/)
  })

  test('generate 4096-bit keys → both keys generated', async ({ page }) => {
    await page.getByRole('button', { name: '4096 bits' }).click()
    await page.getByRole('button', { name: 'Generate RSA key pair' }).click()

    const publicKeyArea = page.locator('textarea[name="public-key-output"]')
    await expect(publicKeyArea).toBeVisible({ timeout: 10000 })

    const publicKey = await publicKeyArea.inputValue()
    expect(publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/)

    const privateKeyArea = page.locator('textarea[name="private-key-output"]')
    const privateKey = await privateKeyArea.inputValue()
    expect(privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/)
  })

  test('CopyButton on public key copies PEM text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByRole('button', { name: 'Generate RSA key pair' }).click()
    await expect(page.locator('textarea[name="public-key-output"]')).toBeVisible({ timeout: 5000 })

    await copyButton.byLabel(page, 'public key').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('CopyButton on private key copies PEM text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByRole('button', { name: 'Generate RSA key pair' }).click()
    await expect(page.locator('textarea[name="private-key-output"]')).toBeVisible({ timeout: 5000 })

    await copyButton.byLabel(page, 'private key').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('download buttons trigger file downloads', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate RSA key pair' }).click()
    await expect(page.locator('textarea[name="public-key-output"]')).toBeVisible({ timeout: 5000 })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download public key' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('public.pem')
  })

  test('generating a second time replaces previous keys', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate RSA key pair' }).click()
    const publicKeyArea = page.locator('textarea[name="public-key-output"]')
    await expect(publicKeyArea).toBeVisible({ timeout: 5000 })
    const firstPublicKey = await publicKeyArea.inputValue()

    await page.getByRole('button', { name: 'Generate RSA key pair' }).click()
    // Wait for the new key to appear (the value should change)
    await expect(async () => {
      const newKey = await publicKeyArea.inputValue()
      expect(newKey).not.toBe(firstPublicKey)
    }).toPass({ timeout: 5000 })
  })

  test('mobile viewport (375px) responsiveness', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.getByRole('button', { name: '2048 bits' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate RSA key pair' })).toBeVisible()
    await expect(
      page.getByText('Keys are generated entirely in your browser. No data is sent to any server.'),
    ).toBeVisible()
  })
})
