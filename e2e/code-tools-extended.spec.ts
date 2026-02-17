import { expect, test } from '@playwright/test'

import { codeFormattingData } from './helpers/fixtures'

test.describe('HTML Formatter', () => {
  test('formats HTML input', async ({ page }) => {
    await page.goto('/tools/html-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(codeFormattingData.html)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('CSS Formatter', () => {
  test('formats CSS input', async ({ page }) => {
    await page.goto('/tools/css-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(codeFormattingData.css)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('JavaScript Minifier', () => {
  test('minifies JavaScript input', async ({ page }) => {
    await page.goto('/tools/javascript-minifier')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(codeFormattingData.js)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('SQL Formatter', () => {
  test('formats SQL input', async ({ page }) => {
    await page.goto('/tools/sql-formatter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(codeFormattingData.sql)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('Markdown Preview', () => {
  test('renders markdown preview', async ({ page }) => {
    await page.goto('/tools/markdown-preview')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(codeFormattingData.markdown)

    // Should render the heading in preview
    await expect(dialog.getByText('Hello').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('JSON to TypeScript', () => {
  test('converts JSON to TypeScript interface', async ({ page }) => {
    await page.goto('/tools/json-to-typescript')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(codeFormattingData.jsonForTs)

    // Should show interface/type output
    const output = dialog.locator('textarea, pre, code').nth(1)
    await expect(output).toBeVisible({ timeout: 3000 })
  })
})

test.describe('JSON Schema Validator', () => {
  test('shows two textarea areas', async ({ page }) => {
    await page.goto('/tools/json-schema-validator')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const textareas = dialog.locator('textarea')
    await expect(textareas.first()).toBeVisible()
    await expect(textareas.nth(1)).toBeVisible()
  })
})
