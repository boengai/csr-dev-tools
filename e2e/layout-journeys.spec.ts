import { expect, type Locator, type Page, test } from '@playwright/test'

import { codeInputIn, copyButton, toast, toolSurface } from './helpers/selectors'

/**
 * One journey per layout shell (ADR-0027, docs/ux/<layout>.md): empty state →
 * result → invalid input in the status slot with the output cleared → copy →
 * reset. The per-tool vitest contract suites check structure; these check the
 * same journey in a real browser.
 */

const openDialog = async (page: Page, path: string): Promise<Locator> => {
  await page.goto(path)
  const dialog = toolSurface(page)
  await expect(dialog).toBeVisible({ timeout: 5000 })
  return dialog
}

const statusAlert = (dialog: Locator) => dialog.locator('[data-slot="tool-status"]').getByRole('alert')

test.describe('Codec journey (JSON ↔ YAML)', () => {
  test('converts, shows bad input in the status slot, switches mode, copies', async ({ page }) => {
    const dialog = await openDialog(page, '/tools/json-to-yaml-converter')
    await expect(dialog.locator('pre').first()).not.toHaveAttribute('data-has-value')

    await codeInputIn.fill(page, dialog, '{"name":"John"}')
    await expect(dialog.locator('pre[data-has-value]')).toContainText('name: John', { timeout: 3000 })

    await codeInputIn.fill(page, dialog, '{"name":')
    await expect(statusAlert(dialog)).toContainText(/Invalid JSON/, { timeout: 3000 })
    await expect(dialog.locator('pre[data-has-value]')).toHaveCount(0)

    await codeInputIn.fill(page, dialog, '{"name":"John"}')
    await expect(statusAlert(dialog)).toHaveCount(0, { timeout: 3000 })
    await copyButton.byLabel(page, 'result').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 2000 })

    await dialog.getByRole('button', { name: 'YAML → JSON mode' }).click()
    await expect(dialog.getByRole('button', { name: 'YAML → JSON mode' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('?mode= opens the tool route in that mode', async ({ page }) => {
    const dialog = await openDialog(page, '/tools/json-to-yaml-converter?mode=yaml-to-json')
    await expect(dialog.getByRole('button', { name: 'YAML → JSON mode' })).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Transformer journey (JSON Formatter)', () => {
  test('formats, shows bad input in the status slot with the output cleared', async ({ page }) => {
    const dialog = await openDialog(page, '/tools/json-formatter')

    await codeInputIn.fill(page, dialog, '{"a":1}')
    await expect(dialog.locator('pre[data-has-value]')).toContainText('"a": 1', { timeout: 3000 })

    await codeInputIn.fill(page, dialog, '{"a":')
    await expect(statusAlert(dialog)).toContainText(/Invalid JSON/, { timeout: 3000 })
    await expect(dialog.locator('pre[data-has-value]')).toHaveCount(0)
  })
})

test.describe('Comparator journey (JSON Diff)', () => {
  test('diffs, then shows invalid JSON in the status slot and clears the diff', async ({ page }) => {
    const dialog = await openDialog(page, '/tools/json-diff-checker')
    await expect(dialog.locator('[data-slot="empty-state"]')).toBeVisible()

    const editors = dialog.locator('.cm-content')
    await editors.nth(0).click()
    await page.keyboard.insertText('{"a":1}')
    await editors.nth(1).click()
    await page.keyboard.insertText('{"a":2}')
    await expect(dialog.locator('[data-slot="empty-state"]')).toHaveCount(0, { timeout: 3000 })

    await editors.nth(0).click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.insertText('{"a":')
    await expect(statusAlert(dialog)).toBeVisible({ timeout: 3000 })
    await expect(dialog.locator('[data-slot="empty-state"]')).toBeVisible()
  })
})

test.describe('Tool presentation (ADR-0029)', () => {
  test('the tool route renders the tool inline; its close control resets the input and goes home', async ({ page }) => {
    await page.goto('/tools/json-formatter')
    const surface = page.locator('[data-slot="tool-surface"]')
    await expect(surface).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: 'JSON Formatter' })).toBeVisible()

    await codeInputIn.fill(page, surface, '{"a":1}')
    await expect(surface.locator('pre[data-has-value]')).toContainText('"a": 1', { timeout: 3000 })

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.goto('/tools/json-formatter')
    const reopened = page.locator('[data-slot="tool-surface"]')
    await expect(reopened).toBeVisible({ timeout: 5000 })
    await expect(reopened.locator('.cm-content').first()).not.toContainText('"a":1')
    await expect(reopened.locator('pre[data-has-value]')).toHaveCount(0)
  })

  test('the dashboard opens the tool in a dialog; Escape closes it and resets the input', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { exact: true, name: 'Format' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, '{"a":1}')
    await expect(dialog.locator('pre[data-has-value]')).toContainText('"a": 1', { timeout: 3000 })

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)

    await page.getByRole('button', { exact: true, name: 'Format' }).click()
    const reopened = page.getByRole('dialog')
    await expect(reopened).toBeVisible({ timeout: 5000 })
    await expect(reopened.locator('.cm-content').first()).not.toContainText('"a":1')
    await expect(reopened.locator('pre[data-has-value]')).toHaveCount(0)
  })
})
