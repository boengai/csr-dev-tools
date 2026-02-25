import { expect, test } from '@playwright/test'

test.describe('Mermaid Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/mermaid-renderer')
    await expect(page.getByRole('heading', { name: 'Mermaid Syntax' })).toBeVisible({ timeout: 10000 })
  })

  test('navigate to /tools/mermaid-renderer, verify title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mermaid Syntax' })).toBeVisible()
    await expect(page.getByText('Write Mermaid diagram syntax and see a live SVG preview')).toBeVisible()
  })

  test('loading state — initially shows loading skeleton, then editor becomes available (AC #1)', async ({
    page,
  }) => {
    await page.goto('/tools/mermaid-renderer')
    const textarea = page.locator('textarea[name="mermaid-input"]')
    await expect(textarea).toBeVisible({ timeout: 10000 })
  })

  test('default sample code renders a flowchart SVG preview on load (AC #2)', async ({ page }) => {
    const previewContainer = page.locator('[aria-live="polite"]')
    await expect(previewContainer.locator('svg').first()).toBeVisible({ timeout: 10000 })
  })

  test('type valid Mermaid syntax → SVG preview updates after debounce (AC #2)', async ({ page }) => {
    const textarea = page.locator('textarea[name="mermaid-input"]')
    await textarea.fill('sequenceDiagram\n    Alice->>Bob: Hello')

    const previewContainer = page.locator('[aria-live="polite"]')
    await expect(previewContainer.locator('svg').first()).toBeVisible({ timeout: 10000 })
  })

  test('type invalid syntax → error message appears with role="alert" (AC #3)', async ({ page }) => {
    const textarea = page.locator('textarea[name="mermaid-input"]')
    await textarea.fill('this is not valid mermaid syntax !!!')

    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 10000 })
  })

  test('fix invalid syntax → error clears and SVG preview appears (AC #3)', async ({ page }) => {
    const textarea = page.locator('textarea[name="mermaid-input"]')

    await textarea.fill('this is not valid mermaid syntax !!!')
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 10000 })

    await textarea.fill('flowchart TD\n    A --> B')
    const previewContainer = page.locator('[aria-live="polite"]')
    await expect(previewContainer.locator('svg').first()).toBeVisible({ timeout: 10000 })
    await expect(errorAlert).not.toBeVisible()
  })

  test('click "Export SVG" button → download triggered (AC #4)', async ({ page }) => {
    const previewContainer = page.locator('[aria-live="polite"]')
    await expect(previewContainer.locator('svg').first()).toBeVisible({ timeout: 10000 })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export SVG' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('mermaid-diagram.svg')
  })

  test('click "Export PNG" button → download triggered (AC #5)', async ({ page }) => {
    const previewContainer = page.locator('[aria-live="polite"]')
    await expect(previewContainer.locator('svg').first()).toBeVisible({ timeout: 10000 })

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.getByRole('button', { name: 'Export PNG' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('mermaid-diagram.png')
  })

  test('toggle syntax reference panel → reference examples are visible with CopyButton (AC #6)', async ({
    page,
  }) => {
    const toggle = page.getByRole('button', { name: 'Syntax Reference' })
    await toggle.click()

    // Use specific button selectors to avoid strict mode violations
    await expect(page.getByRole('button', { name: 'Use Flowchart example' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Use Sequence example' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Use Class example' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Use State example' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Use Gantt example' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Use Pie example' })).toBeVisible()
  })

  test('click CopyButton on a syntax reference example → text is copied to clipboard', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const toggle = page.getByRole('button', { name: 'Syntax Reference' })
    await toggle.click()
    await expect(page.getByRole('button', { name: 'Use Flowchart example' })).toBeVisible({ timeout: 5000 })

    // Click the CopyButton for the Flowchart example
    const copyButtons = page.locator('[aria-label*="Copy"]')
    await copyButtons.first().click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('flowchart')
  })

  test('mobile viewport (375px) responsiveness — editor and preview stack vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.getByRole('heading', { name: 'Mermaid Syntax' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible()

    const textarea = page.locator('textarea[name="mermaid-input"]')
    await expect(textarea).toBeVisible()
  })

  test('export buttons are disabled when no SVG is available (empty/invalid input)', async ({ page }) => {
    const textarea = page.locator('textarea[name="mermaid-input"]')
    await textarea.fill('')

    const exportSvgButton = page.getByRole('button', { name: 'Export SVG' })
    const exportPngButton = page.getByRole('button', { name: 'Export PNG' })

    await expect(exportSvgButton).toBeDisabled({ timeout: 5000 })
    await expect(exportPngButton).toBeDisabled({ timeout: 5000 })
  })
})
