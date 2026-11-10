import { expect, type Page, test } from '@playwright/test'

import { card, copyButton, toast, toolSurface } from './helpers/selectors'

// GeneratorShell (random + slow): a key pair is generated when the dialog
// opens, and again on Generate / ⌘+Enter / a key-size change.
const dialog = (page: Page) => toolSurface(page)
const generateButton = (page: Page) => dialog(page).getByRole('button', { exact: true, name: 'Generate key pair' })
const keyBlock = (page: Page, label: string) =>
  dialog(page).locator('fieldset').filter({ hasText: label }).locator('pre')
const publicKey = (page: Page) => keyBlock(page, 'Public key (SPKI)')
const privateKey = (page: Page) => keyBlock(page, 'Private key (PKCS#8)')

test.describe('RSA Key Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/rsa-key-generator')
    await expect(generateButton(page)).toBeVisible({ timeout: 5000 })
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

  test('default key size is 2048 and a key pair is generated on open', async ({ page }) => {
    await expect(dialog(page).getByRole('button', { name: '2048 bits' })).toHaveAttribute('aria-pressed', 'true')
    await expect(publicKey(page)).toContainText('-----BEGIN PUBLIC KEY-----', { timeout: 5000 })
    await expect(privateKey(page)).toContainText('-----BEGIN PRIVATE KEY-----')
    await expect(generateButton(page)).toBeEnabled()
  })

  test('switching to 4096 bits regenerates both keys', async ({ page }) => {
    await expect(publicKey(page)).toContainText('-----BEGIN PUBLIC KEY-----', { timeout: 5000 })
    const first = await publicKey(page).textContent()

    await dialog(page).getByRole('button', { name: '4096 bits' }).click()

    await expect(async () => {
      expect(await publicKey(page).textContent()).not.toBe(first)
    }).toPass({ timeout: 10000 })
    await expect(publicKey(page)).toContainText('-----BEGIN PUBLIC KEY-----', { timeout: 10000 })
    await expect(privateKey(page)).toContainText('-----BEGIN PRIVATE KEY-----')
  })

  test('CopyButton on public key copies PEM text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await expect(publicKey(page)).toContainText('-----BEGIN PUBLIC KEY-----', { timeout: 5000 })

    await copyButton.byLabel(page, 'Public key (SPKI)').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('CopyButton on private key copies PEM text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await expect(privateKey(page)).toContainText('-----BEGIN PRIVATE KEY-----', { timeout: 5000 })

    await copyButton.byLabel(page, 'Private key (PKCS#8)').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('download buttons at the bottom of the output trigger file downloads', async ({ page }) => {
    await expect(publicKey(page)).toContainText('-----BEGIN PUBLIC KEY-----', { timeout: 5000 })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog(page).getByRole('button', { name: 'Download public.pem' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('public.pem')
    await expect(dialog(page).getByRole('button', { name: 'Download all' })).toBeVisible()
  })

  test('Generate replaces the previous keys', async ({ page }) => {
    await expect(publicKey(page)).toContainText('-----BEGIN PUBLIC KEY-----', { timeout: 5000 })
    const first = await publicKey(page).textContent()

    await generateButton(page).click()
    await expect(async () => {
      expect(await publicKey(page).textContent()).not.toBe(first)
    }).toPass({ timeout: 5000 })
    await expect(publicKey(page)).toContainText('-----BEGIN PUBLIC KEY-----', { timeout: 5000 })
  })

  test('mobile viewport (375px) responsiveness', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(dialog(page).getByRole('button', { name: '2048 bits' })).toBeVisible()
    await expect(generateButton(page)).toBeVisible()
    await expect(
      page.getByText('Keys are generated entirely in your browser. No data is sent to any server.'),
    ).toBeVisible()
  })
})
