import { expect, test } from '@playwright/test'

import { card, copyButton, toast } from './helpers/selectors'

test.describe('YAML Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/yaml-formatter')
  })

  test('renders tool with title and description', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // Card title is aria-hidden behind the dialog; use CSS locator
    await expect(page.locator('h3').filter({ hasText: 'YAML Formatter' })).toBeVisible({ timeout: 5000 })
    await expect(
      page.locator('text=Format and validate YAML with configurable indentation and key sorting'),
    ).toBeVisible()
  })

  test('formats valid YAML input', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('name: John\nage: 30\ntags:\n  - dev\n  - tools')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('shows error toast for invalid YAML', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('key: [unclosed')

    await expect(page.getByText(/Invalid YAML/).first()).toBeVisible({ timeout: 3000 })
  })

  test('copy button triggers toast notification', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill('name: John\nage: 30')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })

    await copyButton.byLabel(page, 'formatted YAML').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 2000 })
  })

  test('sort keys option reorders keys alphabetically', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.getByLabel('Sort Keys').check()

    const input = dialog.locator('textarea').first()
    await input.fill('z: 1\na: 2\nm: 3')

    const output = dialog.locator('pre').first()
    await expect(output).toContainText('a: 2', { timeout: 3000 })
  })
})
