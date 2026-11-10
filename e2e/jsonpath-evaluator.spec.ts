import { expect, type Page, test } from '@playwright/test'

import { card, codeInput, toolSurface } from './helpers/selectors'

// TransformerShell: the JSON is the source (`dialog-source`), the expression a control.
const output = (page: Page) => toolSurface(page).locator('[data-slot="tool-output"]')
const statusAlert = (page: Page) => toolSurface(page).locator('[data-slot="tool-status"]').getByRole('alert')
const expressionInput = (page: Page) => page.locator('input[name="jsonpath-expression"]')
const matchValue = (page: Page, text: string) => output(page).locator('dd').filter({ hasText: text })
const matchCopyButtons = (page: Page) => output(page).getByRole('button', { name: /^Copy \$.* to clipboard$/ })

test.describe('JSONPath Evaluator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/jsonpath-evaluator')
    const editor = codeInput.byName(page, 'dialog-source').locator('.cm-editor')
    await expect(editor).toBeVisible({ timeout: 10000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'JSONPath Evaluator')).toBeVisible()
    await expect(page.getByText('Evaluate JSONPath expressions against JSON data', { exact: false })).toBeVisible()
  })

  test('opens empty with the default expression; Load sample fills the JSON and shows matches', async ({ page }) => {
    await expect(expressionInput(page)).toHaveValue('$.store.book[*].author')
    await expect(output(page).locator('[data-slot="output-placeholder"]')).toBeVisible()

    await page.getByRole('button', { name: 'Load sample' }).click()

    await expect(codeInput.content(page, 'dialog-source')).toContainText('store')
    await expect(matchCopyButtons(page)).toHaveCount(4, { timeout: 5000 })
    await expect(matchValue(page, 'Nigel Rees')).toBeVisible()
    await expect(matchValue(page, 'Evelyn Waugh')).toBeVisible()
  })

  test('type valid JSON + valid JSONPath → results display with paths and values', async ({ page }) => {
    await codeInput.fill(page, 'dialog-source', '{"users": [{"name": "Alice"}, {"name": "Bob"}]}')
    await expressionInput(page).fill('$.users[*].name')

    await expect(matchCopyButtons(page)).toHaveCount(2, { timeout: 5000 })
    await expect(matchValue(page, 'Alice')).toBeVisible()
    await expect(matchValue(page, 'Bob')).toBeVisible()
  })

  test('type JSONPath that matches multiple values → all results shown', async ({ page }) => {
    await page.getByRole('button', { name: 'Load sample' }).click()

    await expect(matchCopyButtons(page)).toHaveCount(4, { timeout: 5000 })
    await expect(matchValue(page, 'Nigel Rees')).toBeVisible()
    await expect(matchValue(page, 'Herman Melville')).toBeVisible()
    await expect(matchValue(page, 'J. R. R. Tolkien')).toBeVisible()
  })

  test('type invalid JSONPath expression → error in the status slot', async ({ page }) => {
    await page.getByRole('button', { name: 'Load sample' }).click()
    await expressionInput(page).fill('$[?(@.price<)]')

    await expect(statusAlert(page)).toBeVisible({ timeout: 5000 })
  })

  test('type JSONPath that matches nothing → "No matches" displayed', async ({ page }) => {
    await page.getByRole('button', { name: 'Load sample' }).click()
    await expressionInput(page).fill('$.nonExistent')

    await expect(output(page).getByText('No matches', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('toggle cheatsheet → common patterns shown; click example → expression updated', async ({ page }) => {
    await page.getByRole('button', { name: 'Load sample' }).click()
    await page.getByRole('button', { name: /JSONPath Cheatsheet/ }).click()

    await expect(page.getByText('Root object')).toBeVisible()
    await expect(page.getByText('Recursive descent')).toBeVisible()

    await page.getByRole('button', { name: 'Use expression: $.*' }).click()

    await expect(expressionInput(page)).toHaveValue('$.*')
    await expect(matchCopyButtons(page)).toHaveCount(1, { timeout: 5000 })
  })

  test('type invalid JSON → parse error in the status slot', async ({ page }) => {
    await codeInput.fill(page, 'dialog-source', '{invalid json}')

    await expect(statusAlert(page)).toBeVisible({ timeout: 5000 })
  })

  test('click Copy on a result → value copied to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: 'Load sample' }).click()

    await expect(matchCopyButtons(page)).toHaveCount(4, { timeout: 5000 })
    await matchCopyButtons(page).first().click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('Nigel Rees')
  })

  test('click Copy all → every match copied as one JSON array', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: 'Load sample' }).click()

    await expect(matchCopyButtons(page)).toHaveCount(4, { timeout: 5000 })
    await output(page).getByRole('button', { name: 'Copy Matches to clipboard' }).click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(JSON.parse(clipboardText)).toHaveLength(4)
  })

  test('mobile viewport (375px) responsiveness — inputs and results stack vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    const editor = codeInput.byName(page, 'dialog-source').locator('.cm-editor')
    await expect(editor).toBeVisible()
    await expect(expressionInput(page)).toBeVisible()
    await page.getByRole('button', { name: 'Load sample' }).click()
    await expect(matchCopyButtons(page)).toHaveCount(4, { timeout: 5000 })
  })

  test('filter expression $..book[?(@.price<10)] → returns filtered books', async ({ page }) => {
    await page.getByRole('button', { name: 'Load sample' }).click()
    await expressionInput(page).fill('$..book[?(@.price<10)]')

    await expect(matchCopyButtons(page)).toHaveCount(2, { timeout: 5000 })
    await expect(matchValue(page, 'Sayings of the Century')).toBeVisible()
    await expect(matchValue(page, 'Moby Dick')).toBeVisible()
  })
})
