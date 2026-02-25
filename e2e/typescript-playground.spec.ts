import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { copyButton, toast } from './helpers/selectors'

// Helper to set Monaco editor content via its global API
async function setTsEditorContent(page: Page, code: string) {
  await page.evaluate((content) => {
    // @monaco-editor/loader makes Monaco available as window.monaco after CDN load
    const m = (window as Record<string, unknown>).monaco as {
      editor: { getModels: () => Array<{ setValue: (v: string) => void }> }
    }
    if (m) {
      const models = m.editor.getModels()
      // First model is the TypeScript editor (created first)
      if (models.length > 0) {
        models[0].setValue(content)
      }
    }
  }, code)
}

// Our custom error list selector (avoids Monaco's own role="alert" elements)
const errorListSelector = '[aria-live="polite"].flex.flex-col'

test.describe('TypeScript Playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/typescript-playground')
    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 15000 })
    // Wait for Monaco to fully initialize including TypeScript worker
    await page.waitForTimeout(2000)
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'TypeScript Playground' })).toBeVisible()
    await expect(page.getByText('Write TypeScript with real-time type checking', { exact: false })).toBeVisible()
  })

  test('Monaco Editor loads with loading skeleton disappearing (AC #1)', async ({ page }) => {
    const editors = page.locator('.monaco-editor')
    await expect(editors.first()).toBeVisible()
    await expect(editors.nth(1)).toBeVisible()
  })

  test('default sample code is present on load with JS output generated (AC #2, #3)', async ({ page }) => {
    // Wait for transpilation
    await page.waitForTimeout(2000)

    // The JS output editor should have transpiled content
    const jsViewLines = page.locator('[aria-label="JavaScript output (read-only)"] .view-lines')
    await expect(jsViewLines).toBeVisible({ timeout: 10000 })

    const jsText = await jsViewLines.textContent()
    expect(jsText).toBeTruthy()
    expect(jsText!.length).toBeGreaterThan(0)
    // The transpiled output should contain the sample functions
    expect(jsText).toContain('greet')
  })

  test('type valid TypeScript → JS output shows transpiled JavaScript (AC #3)', async ({ page }) => {
    // Set TS editor content via Monaco API
    await setTsEditorContent(page, 'const x: number = 42')

    // Wait for debounced transpilation
    await page.waitForTimeout(2000)

    // Check the JS output contains the transpiled code (type annotation stripped)
    const jsViewLines = page.locator('[aria-label="JavaScript output (read-only)"] .view-lines')
    await expect(jsViewLines).toContainText('x = 42', { timeout: 10000 })
  })

  test('TypeScript with type error → error list shows error with line number (AC #4)', async ({ page }) => {
    // Set code with type error
    await setTsEditorContent(page, 'const x: number = "hello"')

    // Wait for validation to fire
    const errorList = page.locator(errorListSelector)
    await expect(errorList).toContainText('Line', { timeout: 15000 })
  })

  test('click CopyButton → transpiled JS is copied to clipboard (AC #5)', async ({ page }) => {
    // Wait for initial transpilation
    await page.waitForTimeout(2000)

    await copyButton.byLabel(page, 'Copy JS').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 5000 })
  })

  test('type valid code after error code → error list clears (AC #4)', async ({ page }) => {
    // Set code with error
    await setTsEditorContent(page, 'const x: number = "hello"')

    const errorList = page.locator(errorListSelector)
    await expect(errorList).toContainText('Line', { timeout: 15000 })

    // Fix the error
    await setTsEditorContent(page, 'const x: number = 42')

    await expect(errorList).toContainText('No errors', { timeout: 15000 })
  })

  test('mobile viewport (375px) responsiveness — editors stack vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    const tsEditor = page.locator('[aria-label="TypeScript code editor"]')
    const jsEditor = page.locator('[aria-label="JavaScript output (read-only)"]')

    await expect(tsEditor).toBeVisible()
    await expect(jsEditor).toBeVisible()

    const tsBounds = await tsEditor.boundingBox()
    const jsBounds = await jsEditor.boundingBox()

    expect(tsBounds).toBeTruthy()
    expect(jsBounds).toBeTruthy()

    if (tsBounds && jsBounds) {
      expect(jsBounds.y).toBeGreaterThan(tsBounds.y)
    }
  })
})
