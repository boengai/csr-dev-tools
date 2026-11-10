import { expect, test } from '@playwright/test'

import { jwtData } from './helpers/fixtures'
import { codeInputIn, toolSurface } from './helpers/selectors'

test.describe('UUID Generator', () => {
  test('generates UUID on load', async ({ page }) => {
    await page.goto('/tools/uuid-generator')
    // GeneratorShell: the dialog opens and generates with default options.
    const output = toolSurface(page).locator('[data-slot="tool-output"]')
    await expect(output.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i).first()).toBeVisible(
      {
        timeout: 5000,
      },
    )
    await expect(page.getByRole('button', { name: 'Copy all UUIDs to clipboard' })).toBeEnabled()
  })
})

test.describe('JWT Decoder', () => {
  test('decodes JWT token', async ({ page }) => {
    await page.goto('/tools/jwt-decoder')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, jwtData.token)

    const output = dialog.locator('[data-slot="tool-output"]')
    await expect(output.getByText(/John Doe/).first()).toBeVisible({ timeout: 3000 })
    await expect(output.getByRole('button', { name: 'Copy Payload to clipboard' })).toBeVisible()
  })

  test('shows a malformed token in the status slot', async ({ page }) => {
    await page.goto('/tools/jwt-decoder')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, 'not-a-jwt')

    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toBeVisible({ timeout: 3000 })
    await expect(dialog.locator('[data-slot="tool-output"] dd')).toHaveCount(0)
  })
})

test.describe('Regex Tester', () => {
  test('shows regex interface in dialog', async ({ page }) => {
    await page.goto('/tools/regex-tester')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Should have input field for pattern and CodeMirror editor for test string
    await expect(dialog.locator('input').first()).toBeVisible()
    await expect(dialog.locator('.cm-editor').first()).toBeVisible()
  })
})

test.describe('PX to REM', () => {
  test('converts px to rem', async ({ page }) => {
    await page.goto('/tools/px-to-rem')
    // No dialog - renders directly
    const input = page.locator('input').first()
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('16')

    await expect(page.getByText(/1/).first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Text Diff Checker', () => {
  test('shows diff interface in dialog', async ({ page }) => {
    await page.goto('/tools/text-diff-checker')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const editors = dialog.locator('.cm-editor')
    await expect(editors.first()).toBeVisible()
    await expect(editors.nth(1)).toBeVisible()
  })
})

test.describe('String Escape/Unescape', () => {
  test('shows escape interface in dialog', async ({ page }) => {
    await page.goto('/tools/string-escape-unescape')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await expect(dialog.locator('.cm-editor').first()).toBeVisible()
  })

  test('escapes HTML, then shows a malformed URL sequence in the status slot', async ({ page }) => {
    await page.goto('/tools/string-escape-unescape')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.locator('.cm-content').first().click()
    await page.keyboard.insertText('<b>&</b>')
    await expect(dialog.locator('pre[data-has-value]')).toHaveText('&lt;b&gt;&amp;&lt;/b&gt;', { timeout: 3000 })

    await dialog.getByRole('button', { name: 'Unescape mode' }).click()
    await dialog.getByRole('combobox', { name: 'Escape format' }).click()
    await page.getByRole('option', { name: 'URL' }).click()
    await dialog.locator('.cm-content').first().click()
    await page.keyboard.press('Meta+A')
    await page.keyboard.insertText('%E0%A4%A')

    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toHaveText(
      'Unable to unescape — input contains invalid sequences',
      { timeout: 3000 },
    )
    await expect(dialog.locator('pre[data-has-value]')).toHaveCount(0)
  })
})

test.describe('Lorem Ipsum Generator', () => {
  test('generates lorem ipsum text on load', async ({ page }) => {
    await page.goto('/tools/lorem-ipsum-generator')
    // GeneratorShell (live): output on open, no Generate button.
    const dialog = toolSurface(page)
    const output = dialog.locator('[data-slot="tool-output"] pre')
    await expect(output).toContainText('Lorem ipsum dolor sit amet', { timeout: 5000 })
    await expect(dialog.getByRole('button', { exact: true, name: 'Generate' })).toHaveCount(0)
  })
})
