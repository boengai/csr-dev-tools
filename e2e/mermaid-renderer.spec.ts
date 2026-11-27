import { expect, type Page, test } from '@playwright/test'

import { codeInput } from './helpers/selectors'

const SOURCE = 'dialog-source'

test.describe('Mermaid Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/mermaid-renderer')
    // Dialog auto-opens; wait for the CodeMirror editor inside it
    const editor = codeInput.byName(page, SOURCE).locator('.cm-editor')
    await expect(editor).toBeVisible({ timeout: 10000 })
  })

  const preview = (page: Page) => page.locator('[data-slot="tool-output"][data-has-value]')
  // The rendered diagram. A bare `svg` would also match the copy button's icon.
  const diagram = (page: Page) => preview(page).locator('svg[id^="mermaid-render-"]')

  test('navigate to /tools/mermaid-renderer, verify title and description', async ({ page }) => {
    await expect(page.getByText('Mermaid Syntax', { exact: true })).toBeVisible()
    await expect(page.getByText('Write Mermaid diagram syntax and see a live SVG preview')).toBeVisible()
  })

  test('opens on the placeholder, with no default diagram', async ({ page }) => {
    await expect(page.getByText('Write Mermaid syntax, or pick an example, to see the diagram')).toBeVisible()
    await expect(preview(page)).toHaveCount(0)
  })

  test('type valid Mermaid syntax → SVG preview updates after debounce', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'sequenceDiagram\n    Alice->>Bob: Hello')
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })
  })

  // Labels drawn as HTML in <foreignObject> are stripped by the sanitizer, so
  // each diagram must draw its node and edge labels as SVG text. Single words:
  // SVG labels split into one <tspan> per word.
  const LABELLED_DIAGRAMS = [
    { code: 'flowchart TD\n    A[Start] -->|go| B[Finish]', kind: 'flowchart', labels: ['Start', 'go', 'Finish'] },
    {
      code: 'classDiagram\n    Animal <|-- Duck : inherits\n    Duck : +swim()',
      kind: 'class',
      labels: ['Animal', 'inherits', 'Duck', 'swim'],
    },
    { code: 'erDiagram\n    CUSTOMER ||--o{ ORDER : places', kind: 'ER', labels: ['CUSTOMER', 'places', 'ORDER'] },
    {
      code: 'stateDiagram-v2\n    [*] --> Active\n    Active --> Done : finish',
      kind: 'state',
      labels: ['Active', 'finish', 'Done'],
    },
    { code: 'mindmap\n  Root\n    Leaf', kind: 'mindmap', labels: ['Root', 'Leaf'] },
  ]

  // Frontmatter config is merged over the site config, so a diagram must not be
  // able to turn HTML labels back on. The root key is the one that did; the
  // deprecated nested key is already outranked by the root, and stays guarded.
  const FRONTMATTERS = [
    { frontmatter: '', titleSuffix: '' },
    { frontmatter: '---\nconfig:\n  htmlLabels: true\n---\n', titleSuffix: ' with frontmatter htmlLabels: true' },
    {
      frontmatter: '---\nconfig:\n  flowchart:\n    htmlLabels: true\n---\n',
      titleSuffix: ' with frontmatter flowchart.htmlLabels: true',
    },
  ]

  for (const { code, kind, labels } of LABELLED_DIAGRAMS) {
    for (const { frontmatter, titleSuffix } of FRONTMATTERS) {
      test(`${kind} diagram${titleSuffix} draws its labels as SVG text`, async ({ page }) => {
        await codeInput.fill(page, SOURCE, frontmatter + code)
        const svg = diagram(page)
        await expect(svg).toBeVisible({ timeout: 10000 })

        for (const label of labels) {
          await expect(svg.locator('text', { hasText: label }).first()).toBeVisible()
        }
        await expect(svg.locator('foreignObject')).toHaveCount(0)
      })
    }
  }

  test('frontmatter theme still applies', async ({ page }) => {
    await codeInput.fill(page, SOURCE, '---\nconfig:\n  theme: forest\n---\nflowchart TD\n    A[Start] --> B[Finish]')
    // Forest's node fill; the site's dark theme does not use it.
    await expect(diagram(page).locator('style')).toContainText('#cde498', { timeout: 10000 })
  })

  test('pick an example → it renders', async ({ page }) => {
    await page.getByRole('button', { name: 'Use Flowchart example' }).click()
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })
    for (const label of ['Sequence', 'Class', 'State', 'Gantt', 'Pie']) {
      await expect(page.getByRole('button', { name: `Use ${label} example` })).toBeVisible()
    }
  })

  test('type invalid syntax → error in the status slot, output cleared', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'this is not valid mermaid syntax !!!')

    const errorAlert = page.locator('[data-slot="tool-status"] [role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 10000 })
    await expect(preview(page)).toHaveCount(0)
  })

  test('Auto-fix in the status slot repairs a missing diagram type', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'A --> B')
    const status = page.locator('[data-slot="tool-status"]')
    await expect(status.getByRole('alert')).toBeVisible({ timeout: 10000 })

    await status.getByRole('button', { name: /^Auto-fix/ }).click()
    await expect(status.getByRole('alert')).toHaveCount(0, { timeout: 10000 })
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })
  })

  test('fix invalid syntax → error clears and SVG preview appears', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'this is not valid mermaid syntax !!!')
    const errorAlert = page.locator('[data-slot="tool-status"] [role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 10000 })

    await codeInput.fill(page, SOURCE, 'flowchart TD\n    A --> B')
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })
    await expect(errorAlert).not.toBeVisible()
  })

  test('Download SVG in the output label → download triggered', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'flowchart TD\n    A --> B')
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download SVG' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('mermaid-diagram.svg')
  })

  test('Download PNG in the output label → download triggered', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'flowchart TD\n    A --> B')
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('mermaid-diagram.png')
  })

  test('mobile viewport (375px) responsiveness — editor and preview stack vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.getByText('Mermaid Syntax', { exact: true })).toBeVisible()
    await expect(page.getByText('Preview', { exact: true })).toBeVisible()

    const editor = codeInput.byName(page, SOURCE).locator('.cm-editor')
    await expect(editor).toBeVisible()
  })

  test('downloads are disabled when there is no diagram (empty/invalid input)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Download SVG' })).toBeDisabled({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled({ timeout: 5000 })
  })
})
