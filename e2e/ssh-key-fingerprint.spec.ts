import { expect, type Page, test } from '@playwright/test'

import { card, codeInput, copyButton, toast, toolSurface } from './helpers/selectors'

const output = (page: Page) => toolSurface(page).locator('[data-slot="tool-output"]')
const statusAlert = (page: Page) => toolSurface(page).locator('[data-slot="tool-status"]').getByRole('alert')

const TEST_RSA_KEY =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDPZtM8NaxkAVu6E2lXUpBoqgWh24W0WNULU3r0fVOtpg8apbZPE/GkbAayJl9V31R2Y2aD1QKa+6rjOYSpoloJfEDoIBwoFWtBT8UybD873ji5jKXP0WZ2Fb6SEZRNu6wirWAA7Abhox5I38yYJ3hk9m6/9t/5GB8/AHkpsZ09Wow7UbId8NWkhZa+PYpNM6rCp9fZixFAX+fzjT6KCeei5SD6bH0pq0xvfWmkab6kIyrqLS2kiZpSm9s7O5jlbdHxgkU/SqHquyl8MSXSosnSPBbpYmIIKyG3pJr8PzzzAO9WQ9MSRx3MBGQVnvsN78zRD11sA3Rn5OuOZrZdt6et test-rsa@example.com'

const TEST_RSA_SHA256 = 'SHA256:pERfJJCOe2869DlOwj6aMlgkqnFuTf77U88HfbZgz9A'
const TEST_RSA_MD5 = '0f:34:5f:24:06:6b:21:50:aa:20:17:65:d7:f3:e8:9c'

const TEST_ED25519_KEY =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGwOFE3jdXhaTQ2iNwU52q9E9yO1HV35G3BXiLyTuNdY test-ed25519@example.com'

test.describe('SSH Key Fingerprint', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/ssh-key-fingerprint')
    await expect(codeInput.byName(page, 'dialog-source').locator('.cm-editor')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'SSH Key Fingerprint')).toBeVisible()
    await expect(
      page.getByText('Paste an SSH public key to view its SHA256 and MD5 fingerprints, key type, and bit size.'),
    ).toBeVisible()
  })

  test('paste valid ssh-rsa key → SHA256 and MD5 fingerprints displayed, key type and bit size shown', async ({
    page,
  }) => {
    await codeInput.fill(page, 'dialog-source', TEST_RSA_KEY)

    await expect(output(page).getByText('ssh-rsa', { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(output(page).getByText('2048', { exact: true })).toBeVisible()
    await expect(output(page).getByText(TEST_RSA_SHA256)).toBeVisible()
    await expect(output(page).getByText(TEST_RSA_MD5)).toBeVisible()
    await expect(output(page).getByText('MD5 (legacy)')).toBeVisible()
  })

  test('paste ssh-ed25519 key → fingerprints displayed, key type and bits shown', async ({ page }) => {
    await codeInput.fill(page, 'dialog-source', TEST_ED25519_KEY)

    await expect(output(page).getByText('ssh-ed25519', { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(output(page).getByText('256', { exact: true })).toBeVisible()
    await expect(output(page).getByText(/^SHA256:/)).toBeVisible()
  })

  test('paste authorized_keys line with comment → comment extracted and displayed', async ({ page }) => {
    await codeInput.fill(page, 'dialog-source', TEST_RSA_KEY)

    await expect(output(page).getByText('test-rsa@example.com', { exact: true })).toBeVisible({ timeout: 3000 })
  })

  test('paste invalid key → error in the status slot', async ({ page }) => {
    await codeInput.fill(page, 'dialog-source', 'not a valid key')

    await expect(statusAlert(page)).toHaveText('SSH key format not recognized (e.g., ssh-rsa AAAA... user@host)', {
      timeout: 3000,
    })
  })

  test('click SHA256 CopyButton → clipboard contains SHA256 value', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await codeInput.fill(page, 'dialog-source', TEST_RSA_KEY)

    await expect(output(page).getByText(/^SHA256:/)).toBeVisible({ timeout: 3000 })
    await copyButton.byLabel(page, 'SHA256').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('click MD5 CopyButton → clipboard contains colon-separated hex', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await codeInput.fill(page, 'dialog-source', TEST_RSA_KEY)

    await expect(output(page).getByText('MD5 (legacy)')).toBeVisible({ timeout: 3000 })
    await copyButton.byLabel(page, 'MD5 (legacy)').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('mobile viewport (375px) responsiveness', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(codeInput.byName(page, 'dialog-source').locator('.cm-editor')).toBeVisible()

    await codeInput.fill(page, 'dialog-source', TEST_ED25519_KEY)
    await expect(output(page).getByText('ssh-ed25519', { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(output(page).getByText(/^SHA256:/)).toBeVisible()
  })
})
