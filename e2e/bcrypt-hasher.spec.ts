import { expect, test } from '@playwright/test'

import { card, copyButton, toast } from './helpers/selectors'

test.describe('Bcrypt Hasher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/bcrypt-hasher')
    await expect(page.getByRole('tab', { name: 'hash' })).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Bcrypt Hasher')).toBeVisible()
    await expect(
      page.getByText(
        'Hash passwords with bcrypt and verify plaintext against bcrypt hashes. Adjust cost factor, view hash breakdown, and track elapsed time.',
      ),
    ).toBeVisible()
  })

  test('enter password, click Hash → bcrypt hash displayed ($2b$ prefix, 60 chars)', async ({ page }) => {
    await page.getByPlaceholder('Enter password to hash...').fill('testpassword')
    await page.getByRole('button', { name: 'Hash Password' }).click()

    const hashOutput = page.locator('[aria-live="polite"]').first().locator('.font-mono').first()
    await expect(hashOutput).toBeVisible({ timeout: 15000 })
    const hashText = await hashOutput.textContent()
    expect(hashText).toMatch(/^\$2b\$10\$.{53}$/)
    expect(hashText).toHaveLength(60)
  })

  test('hash with different cost factor (4) → hash generated with correct rounds', async ({ page }) => {
    await page.getByPlaceholder('Enter password to hash...').fill('testpassword')

    // Change cost factor to 4
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: '4 (fast)' }).click()

    await page.getByRole('button', { name: 'Hash Password' }).click()

    const hashOutput = page.locator('[aria-live="polite"]').first().locator('.font-mono').first()
    await expect(hashOutput).toBeVisible({ timeout: 15000 })
    const hashText = await hashOutput.textContent()
    expect(hashText).toMatch(/^\$2b\$04\$/)
    expect(hashText).toHaveLength(60)
  })

  test('enter password + valid hash → "Match" result shown', async ({ page }) => {
    // First generate a hash
    await page.getByPlaceholder('Enter password to hash...').fill('matchtest')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: '4 (fast)' }).click()
    await page.getByRole('button', { name: 'Hash Password' }).click()

    const hashOutput = page.locator('[aria-live="polite"]').first().locator('.font-mono').first()
    await expect(hashOutput).toBeVisible({ timeout: 15000 })
    const generatedHash = await hashOutput.textContent()

    // Switch to Verify tab
    await page.getByRole('tab', { name: 'verify' }).click()
    await page.getByPlaceholder('Enter password...').fill('matchtest')
    await page.locator('textarea').fill(generatedHash!)
    await page.getByRole('button', { name: 'Verify Password' }).click()

    await expect(page.getByText('Password matches hash')).toBeVisible({ timeout: 15000 })
  })

  test('enter wrong password + hash → "No Match" result shown', async ({ page }) => {
    // First generate a hash
    await page.getByPlaceholder('Enter password to hash...').fill('correctpassword')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: '4 (fast)' }).click()
    await page.getByRole('button', { name: 'Hash Password' }).click()

    const hashOutput = page.locator('[aria-live="polite"]').first().locator('.font-mono').first()
    await expect(hashOutput).toBeVisible({ timeout: 15000 })
    const generatedHash = await hashOutput.textContent()

    // Switch to Verify tab with wrong password
    await page.getByRole('tab', { name: 'verify' }).click()
    await page.getByPlaceholder('Enter password...').fill('wrongpassword')
    await page.locator('textarea').fill(generatedHash!)
    await page.getByRole('button', { name: 'Verify Password' }).click()

    await expect(page.getByText('Password does not match')).toBeVisible({ timeout: 15000 })
  })

  test('enter invalid hash format → error toast shown', async ({ page }) => {
    await page.getByRole('tab', { name: 'verify' }).click()
    await page.getByPlaceholder('Enter password...').fill('test')
    await page.locator('textarea').fill('not-a-valid-hash')
    await page.getByRole('button', { name: 'Verify Password' }).click()

    await expect(
      toast.message(
        page,
        'Invalid bcrypt hash. Expected format: $2a$/$2b$/$2y$ followed by cost and 53 characters (e.g., $2b$10$...)',
      ),
    ).toBeVisible({ timeout: 3000 })
  })

  test('click CopyButton for hash → clipboard contains hash value', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByPlaceholder('Enter password to hash...').fill('copytest')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: '4 (fast)' }).click()
    await page.getByRole('button', { name: 'Hash Password' }).click()

    const hashOutput = page.locator('[aria-live="polite"]').first().locator('.font-mono').first()
    await expect(hashOutput).toBeVisible({ timeout: 15000 })

    await copyButton.byLabel(page, 'hash').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('mobile viewport (375px) responsiveness', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.getByRole('tab', { name: 'hash' })).toBeVisible()
    await expect(page.getByPlaceholder('Enter password to hash...')).toBeVisible()

    await page.getByPlaceholder('Enter password to hash...').fill('mobiletest')
    await page.getByRole('button', { name: 'Hash Password' }).click()

    const hashOutput = page.locator('[aria-live="polite"]').first().locator('.font-mono').first()
    await expect(hashOutput).toBeVisible({ timeout: 15000 })
  })

  test('elapsed time appears after hashing', async ({ page }) => {
    await page.getByPlaceholder('Enter password to hash...').fill('timertest')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: '4 (fast)' }).click()
    await page.getByRole('button', { name: 'Hash Password' }).click()

    await expect(page.getByText(/Generated in \d+\.\d+s/)).toBeVisible({ timeout: 15000 })
  })
})
