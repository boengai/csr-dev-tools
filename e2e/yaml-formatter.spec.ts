import { expect, test } from '@playwright/test'

import { codeInputIn, copyButton, toast, toolSurface } from './helpers/selectors'

test.describe('YAML Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/yaml-formatter')
  })

  test('renders tool with title and description', async ({ page }) => {
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { level: 1, name: 'YAML Formatter' })).toBeVisible({ timeout: 5000 })
    await expect(
      page.locator('text=Format and validate YAML with configurable indentation and key sorting'),
    ).toBeVisible()
  })

  test('formats valid YAML input', async ({ page }) => {
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, 'name: John\nage: 30\ntags:\n  - dev\n  - tools')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('shows invalid YAML in the status slot', async ({ page }) => {
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, 'key: [unclosed')

    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toContainText(/Invalid YAML/, {
      timeout: 3000,
    })
  })

  test('copy button triggers toast notification', async ({ page }) => {
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, 'name: John\nage: 30')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })

    await copyButton.byLabel(page, 'formatted YAML').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 2000 })
  })

  test('sort keys option reorders keys alphabetically', async ({ page }) => {
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.getByLabel('Sort Keys').check()

    await codeInputIn.fill(page, dialog, 'z: 1\na: 2\nm: 3')

    const output = dialog.locator('pre').first()
    await expect(output).toContainText('a: 2', { timeout: 3000 })
  })
})
