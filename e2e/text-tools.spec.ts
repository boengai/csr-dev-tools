import { expect, test } from '@playwright/test'

import { textToolData } from './helpers/fixtures'
import { toolSurface } from './helpers/selectors'

test.describe('Text Case Converter', () => {
  test('opens dialog and converts text cases', async ({ page }) => {
    await page.goto('/tools/text-case-converter')
    // Dialog auto-opens on dedicated route
    const textarea = toolSurface(page).locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 5000 })
    await textarea.fill(textToolData.caseInput)

    // One row per case, each with its own Copy button.
    await expect(page.getByText('helloWorldExample', { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('hello_world_example', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy camelCase to clipboard' })).toBeEnabled()
  })
})

test.describe('Word Counter', () => {
  test('opens dialog and counts words', async ({ page }) => {
    await page.goto('/tools/word-counter')
    // Dialog auto-opens on dedicated route
    const textarea = toolSurface(page).locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 5000 })
    await textarea.fill(textToolData.wordCountInput)

    // Stats replace the placeholder; counts have no Copy button.
    const output = toolSurface(page).locator('[data-slot="tool-output"]')
    await expect(output).toHaveAttribute('data-has-value', '', { timeout: 3000 })
    await expect(output.getByText('Words', { exact: true })).toBeVisible()
    await expect(output.getByText('14', { exact: true })).toBeVisible()
    await expect(output.getByRole('button', { name: /^Copy / })).toHaveCount(0)
  })
})

test.describe('Text Sort & Dedupe', () => {
  test('sorts multiline text', async ({ page }) => {
    await page.goto('/tools/text-sort-dedupe')

    const textarea = page
      .locator('fieldset')
      .filter({ has: page.locator('label:text-is("Input (one item per line)")') })
      .locator('textarea')
    await textarea.fill(textToolData.sortInput)

    // Sorted output fills the shell's output block.
    await expect(toolSurface(page).locator('pre[data-has-value]')).toHaveText(textToolData.sortedOutput, {
      timeout: 3000,
    })
  })
})
