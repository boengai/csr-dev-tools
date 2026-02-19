import { expect, test } from '@playwright/test'

import { card, copyButton, toast } from './helpers/selectors'

test.describe('YAML Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/yaml-formatter')
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'YAML Formatter')).toBeVisible()
    await expect(
      page.getByText('Format and validate YAML with configurable indentation and key sorting'),
    ).toBeVisible()
  })

  test('formats valid YAML input', async ({ page }) => {
    await page.getByRole('button', { name: /Format/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('name: John\nage: 30\ntags:\n  - dev\n  - tools')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })

  test('shows error toast for invalid YAML', async ({ page }) => {
    await page.getByRole('button', { name: /Format/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('key: [unclosed')

    await expect(page.getByText(/Invalid YAML/)).toBeVisible({ timeout: 3000 })
  })

  test('copy button triggers toast notification', async ({ page }) => {
    await page.getByRole('button', { name: /Format/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('name: John\nage: 30')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })

    await copyButton.byLabel(page, 'formatted YAML').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 2000 })
  })

  test('sort keys option reorders keys alphabetically', async ({ page }) => {
    await page.getByRole('button', { name: /Format/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.getByLabel('Sort Keys').check()

    const input = dialog.locator('textarea').first()
    await input.fill('z: 1\na: 2\nm: 3')

    const output = dialog.locator('textarea').nth(1)
    await expect(output).toContainText('a: 2', { timeout: 3000 })
  })
})
