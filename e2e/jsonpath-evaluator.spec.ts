import { expect, test } from '@playwright/test'

import { card } from './helpers/selectors'

test.describe('JSONPath Evaluator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/jsonpath-evaluator')
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'JSONPath Evaluator')).toBeVisible()
    await expect(
      page.getByText('Evaluate JSONPath expressions against JSON data', { exact: false }),
    ).toBeVisible()
  })

  test('default sample JSON is present on load with default expression and results', async ({ page }) => {
    const textarea = page.locator('textarea')
    await expect(textarea).toHaveValue(/store/)

    const expressionInput = page.locator('input[name="jsonpath-expression"]')
    await expect(expressionInput).toHaveValue('$.store.book[*].author')

    const resultsPanel = page.locator('[aria-live="polite"]')
    await expect(page.getByRole('status')).toContainText('4 matches found', { timeout: 5000 })
    await expect(resultsPanel.locator('pre').filter({ hasText: 'Nigel Rees' })).toBeVisible()
    await expect(resultsPanel.locator('pre').filter({ hasText: 'Evelyn Waugh' })).toBeVisible()
  })

  test('type valid JSON + valid JSONPath → results display with paths and values', async ({ page }) => {
    await page.locator('textarea').fill('{"users": [{"name": "Alice"}, {"name": "Bob"}]}')

    // Wait for JSON parse to complete by checking that expression still evaluates
    await expect(page.getByRole('status')).toContainText(/match/, { timeout: 5000 })

    const expressionInput = page.locator('input[name="jsonpath-expression"]')
    await expressionInput.fill('$.users[*].name')

    const resultsPanel = page.locator('[aria-live="polite"]')
    await expect(page.getByRole('status')).toContainText('2 matches found', { timeout: 5000 })
    await expect(resultsPanel.locator('pre').filter({ hasText: 'Alice' })).toBeVisible()
    await expect(resultsPanel.locator('pre').filter({ hasText: 'Bob' })).toBeVisible()
  })

  test('type JSONPath that matches multiple values → all results shown', async ({ page }) => {
    const resultsPanel = page.locator('[aria-live="polite"]')
    await expect(page.getByRole('status')).toContainText('4 matches found', { timeout: 5000 })

    await expect(resultsPanel.locator('pre').filter({ hasText: 'Nigel Rees' })).toBeVisible()
    await expect(resultsPanel.locator('pre').filter({ hasText: 'Herman Melville' })).toBeVisible()
    await expect(resultsPanel.locator('pre').filter({ hasText: 'J. R. R. Tolkien' })).toBeVisible()
  })

  test('type invalid JSONPath expression → error message shown', async ({ page }) => {
    const expressionInput = page.locator('input[name="jsonpath-expression"]')
    await expressionInput.fill('$[?(@.price<)]')

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })

  test('type JSONPath that matches nothing → "No matches" displayed', async ({ page }) => {
    const expressionInput = page.locator('input[name="jsonpath-expression"]')
    await expressionInput.fill('$.nonExistent')

    await expect(page.getByRole('status')).toContainText('No matches', { timeout: 5000 })
  })

  test('toggle cheatsheet → common patterns shown; click example → expression updated', async ({ page }) => {
    await page.getByRole('button', { name: /JSONPath Cheatsheet/ }).click()

    await expect(page.getByText('Root object')).toBeVisible()
    await expect(page.getByText('Recursive descent')).toBeVisible()

    await page.getByRole('button', { name: 'Use expression: $.*' }).click()

    const expressionInput = page.locator('input[name="jsonpath-expression"]')
    await expect(expressionInput).toHaveValue('$.*')

    await expect(page.getByRole('status')).toContainText('match', { timeout: 5000 })
  })

  test('type invalid JSON → parse error shown', async ({ page }) => {
    await page.locator('textarea').fill('{invalid json}')

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })

  test('click CopyButton on a result → value copied to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await expect(page.getByRole('status')).toContainText('4 matches found', { timeout: 5000 })

    const copyButtons = page.getByLabel('Copy result value to clipboard')
    await expect(copyButtons.first()).toBeVisible()
    await copyButtons.first().click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('Nigel Rees')
  })

  test('mobile viewport (375px) responsiveness — inputs and results stack vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.locator('input[name="jsonpath-expression"]')).toBeVisible()
    await expect(page.getByRole('status')).toContainText('match', { timeout: 5000 })
  })

  test('filter expression $..book[?(@.price<10)] → returns filtered books', async ({ page }) => {
    const expressionInput = page.locator('input[name="jsonpath-expression"]')
    await expressionInput.fill('$..book[?(@.price<10)]')

    const resultsPanel = page.locator('[aria-live="polite"]')
    await expect(page.getByRole('status')).toContainText('2 matches found', { timeout: 5000 })
    await expect(resultsPanel.locator('pre').filter({ hasText: 'Sayings of the Century' })).toBeVisible()
    await expect(resultsPanel.locator('pre').filter({ hasText: 'Moby Dick' })).toBeVisible()
  })
})
