import { expect, test } from '@playwright/test'

import { textToolData } from './helpers/fixtures'

test.describe('Text Case Converter', () => {
  test('opens dialog and converts text cases', async ({ page }) => {
    await page.goto('/tools/text-case-converter')
    // Dialog auto-opens on dedicated route
    const textarea = page.locator('[role="dialog"] textarea').first()
    await expect(textarea).toBeVisible({ timeout: 5000 })
    await textarea.fill(textToolData.caseInput)

    // Verify at least one conversion result appears
    await expect(page.getByText('camelCase', { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('snake_case', { exact: true })).toBeVisible()
  })
})

test.describe('Word Counter', () => {
  test('opens dialog and counts words', async ({ page }) => {
    await page.goto('/tools/word-counter')
    // Dialog auto-opens on dedicated route
    const textarea = page.locator('[role="dialog"] textarea').first()
    await expect(textarea).toBeVisible({ timeout: 5000 })
    await textarea.fill(textToolData.wordCountInput)

    // Verify word count stats appear
    await expect(page.getByText('Words', { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('Characters', { exact: true }).first()).toBeVisible()
  })
})

test.describe('Text Sort & Dedupe', () => {
  test('sorts multiline text', async ({ page }) => {
    await page.goto('/tools/text-sort-dedupe')

    const textarea = page.locator('fieldset').filter({ has: page.locator('label:text-is("Input (one item per line)")') }).locator('textarea')
    await textarea.fill(textToolData.sortInput)

    // Verify sorted output appears in the pre element
    await expect(page.locator('pre').first()).toContainText('apple', { timeout: 3000 })
  })
})
