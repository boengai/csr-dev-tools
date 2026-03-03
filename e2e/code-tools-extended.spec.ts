import { expect, test } from '@playwright/test'

import { codeFormattingData } from './helpers/fixtures'
import { codeInputIn } from './helpers/selectors'

test.describe('HTML Formatter', () => {
  test('formats HTML input', async ({ page }) => {
    await page.goto('/tools/html-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, codeFormattingData.html)

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('minifies HTML input', async ({ page }) => {
    await page.goto('/tools/html-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Switch to minify mode
    const trigger = dialog.locator('[role="combobox"]').first()
    await trigger.click()
    await page.locator('[role="option"]').filter({ hasText: /minify/i }).click()

    await codeInputIn.fill(page, dialog, '<div>\n  <p>hello</p>\n</div>')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('CSS Formatter', () => {
  test('formats CSS input', async ({ page }) => {
    await page.goto('/tools/css-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, codeFormattingData.css)

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('minifies CSS input', async ({ page }) => {
    await page.goto('/tools/css-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const trigger = dialog.locator('[role="combobox"]').first()
    await trigger.click()
    await page.locator('[role="option"]').filter({ hasText: /minify/i }).click()

    await codeInputIn.fill(page, dialog, 'body {\n  color: red;\n  margin: 0;\n}')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('JavaScript Minifier', () => {
  test('minifies JavaScript input', async ({ page }) => {
    await page.goto('/tools/javascript-minifier')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, codeFormattingData.js)

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('beautifies JavaScript input', async ({ page }) => {
    await page.goto('/tools/javascript-minifier')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const trigger = dialog.locator('[role="combobox"]').first()
    await trigger.click()
    await page.locator('[role="option"]').filter({ hasText: /beautify/i }).click()

    await codeInputIn.fill(page, dialog, 'function hello(){return"world"}')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('SQL Formatter', () => {
  test('formats SQL input', async ({ page }) => {
    await page.goto('/tools/sql-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, codeFormattingData.sql)

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })

  test('formats SQL with dialect change', async ({ page }) => {
    await page.goto('/tools/sql-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const trigger = dialog.locator('[role="combobox"]').first()
    await trigger.click()
    await page.locator('[role="option"]').filter({ hasText: /postgresql/i }).click()

    await codeInputIn.fill(page, dialog, 'select * from users limit 10')

    const output = dialog.locator('pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Markdown Preview', () => {
  test('renders markdown preview', async ({ page }) => {
    await page.goto('/tools/markdown-preview')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, codeFormattingData.markdown)

    // Should render the heading in preview
    await expect(dialog.getByText('Hello').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('JSON to TypeScript', () => {
  test('converts JSON to TypeScript interface', async ({ page }) => {
    await page.goto('/tools/json-to-typescript')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, codeFormattingData.jsonForTs)

    // Should show interface/type output
    const output = dialog.locator('.cm-editor, pre, code').nth(1)
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('JSON Schema Validator', () => {
  test('shows two code editor areas', async ({ page }) => {
    await page.goto('/tools/json-schema-validator')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const editors = dialog.locator('.cm-editor')
    await expect(editors.first()).toBeVisible()
    await expect(editors.nth(1)).toBeVisible()
  })
})
