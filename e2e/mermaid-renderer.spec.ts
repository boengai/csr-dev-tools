import { readFile } from 'node:fs/promises'

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
    // These renderers draw HTML labels whatever `htmlLabels` says; the
    // renderer redraws them as SVG text before sanitizing (#52). They never
    // read `htmlLabels`, so the frontmatter variants below would add nothing.
    {
      code: "eventmodeling\n\ntf 01 ui CartUI\ntf 02 cmd AddItem [[AddItem01]]\n\ndata AddItem01 {\n  description: 'john'\n}",
      ignoresHtmlLabels: true,
      kind: 'event-modeling',
      labels: ['CartUI', 'AddItem', 'description'],
    },
    {
      code: 'venn-beta\n  set A["Frontend"]\n    text A1["React"]\n  set B["Backend"]\n  union A,B["Shared"]\n    text AB1["OpenAPI"]',
      ignoresHtmlLabels: true,
      kind: 'venn',
      labels: ['Frontend', 'React', 'Shared', 'OpenAPI'],
    },
    {
      code: 'architecture-beta\n    service db "DB"[Database]\n    service api(server)[API]\n    db:R -- L:api',
      ignoresHtmlLabels: true,
      kind: 'architecture',
      labels: ['DB', 'Database', 'API'],
    },
    {
      code: 'swimlane-beta LR\n  subgraph Customer\n    Browse[Browse]\n  end\n  subgraph Warehouse\n    Ship[Ship]\n  end\n  Browse --> Ship',
      kind: 'swimlane',
      labels: ['Customer', 'Warehouse', 'Browse', 'Ship'],
    },
    {
      code: 'journey\n  title Day\n  section Morning\n    Coffee: 5: Me',
      ignoresHtmlLabels: true,
      kind: 'journey',
      labels: ['Morning', 'Coffee'],
    },
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

  for (const { code, ignoresHtmlLabels, kind, labels } of LABELLED_DIAGRAMS) {
    for (const { frontmatter, titleSuffix } of ignoresHtmlLabels ? FRONTMATTERS.slice(0, 1) : FRONTMATTERS) {
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

  // The redraw would also rescue these titles, so the loop above can't tell
  // whether `flowchart.htmlLabels: false` is set: mermaid's own SVG labels
  // (rotated with the lane) are what it buys.
  test("swimlane lane titles are mermaid's own SVG labels", async ({ page }) => {
    await codeInput.fill(
      page,
      SOURCE,
      'swimlane-beta LR\n  subgraph Customer\n    Browse[Browse]\n  end\n  subgraph Warehouse\n    Ship[Ship]\n  end\n  Browse --> Ship',
    )
    const svg = diagram(page)
    await expect(svg).toBeVisible({ timeout: 10000 })
    for (const lane of ['Customer', 'Warehouse']) {
      await expect(svg.locator('tspan.text-outer-tspan', { hasText: lane })).toHaveCount(1)
    }
  })

  // Measured with the browser's canvas: the icon is 80px and clips its text.
  test('a long architecture iconText stays inside its icon, cut at the line clamp', async ({ page }) => {
    await codeInput.fill(
      page,
      SOURCE,
      'architecture-beta\n    service db "Supercalifragilistic primary relational database cluster with replicas"[Database]',
    )
    const text = diagram(page).locator('text', { hasText: 'Supercal' })
    await expect(text).toBeVisible({ timeout: 10000 })

    // The preview pane's letter-spacing isn't in the downloaded SVG, which is
    // what the label is measured for; drop it to measure the same text.
    const rows = await text.locator('tspan').evaluateAll((tspans) => {
      for (const t of tspans) (t as SVGTSpanElement).style.letterSpacing = 'normal'
      return tspans.map((t) => ({ text: t.textContent ?? '', width: (t as SVGTSpanElement).getComputedTextLength() }))
    })
    // Mermaid's clamp for an 80px icon at 16px: floor(78 / 16) lines.
    expect(rows.length).toBe(4)
    expect(rows.at(-1)?.text).toMatch(/…$/)
    for (const { width } of rows) expect(width).toBeLessThanOrEqual(80)
  })

  test('frontmatter theme still applies', async ({ page }) => {
    await codeInput.fill(page, SOURCE, '---\nconfig:\n  theme: forest\n---\nflowchart TD\n    A[Start] --> B[Finish]')
    // Forest's node fill; the site's dark theme does not use it.
    await expect(diagram(page).locator('style')).toContainText('#cde498', { timeout: 10000 })
  })

  // The redrawn labels must keep the SVG loadable as an image: event-modeling
  // data has `&nbsp;`, which is not an XML entity.
  test('event-modeling diagram with data downloads as PNG', async ({ page }) => {
    await codeInput.fill(page, SOURCE, LABELLED_DIAGRAMS.find(({ kind }) => kind === 'event-modeling')!.code)
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('mermaid-diagram.png')
  })

  // Journey's root <svg> has `width="100%"`, which the PNG export read as 100px
  // wide and squashed the diagram into.
  test('journey diagram downloads as a PNG with the diagram’s proportions', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'journey\n  title Day\n  section Morning\n    Coffee: 5: Me')
    const viewBox = await diagram(page).getAttribute('viewBox', { timeout: 10000 })
    const [, , boxWidth = 0, boxHeight = 0] = (viewBox ?? '').split(/[\s,]+/).map(Number)

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ])
    // A PNG's IHDR chunk holds its width and height at bytes 16 and 20.
    const png = await readFile((await download.path())!)
    const ratio = png.readUInt32BE(16) / png.readUInt32BE(20)
    expect(ratio).toBeCloseTo(boxWidth / boxHeight, 1)
  })

  // `toBeVisible` ignores colour: the title used to be painted its box's fill.
  test("journey section title is not painted its section box's colour", async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'journey\n  title Day\n  section Morning\n    Coffee: 5: Me')
    const svg = diagram(page)
    await expect(svg).toBeVisible({ timeout: 10000 })

    const fill = (selector: string) =>
      svg
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).fill)
    expect(await fill('text.journey-section')).not.toBe(await fill('rect.journey-section'))
  })

  test('KaTeX labels it cannot draw → a notice in the status slot, diagram still shown', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'sequenceDiagram\n    Alice->>Bob: $$x^2$$\n    Bob->>Alice: Hello')
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-slot="tool-status"] [role="status"]')).toHaveText(
      "A math label ($$…$$) can't be drawn, so it's left out of the diagram.",
    )
    await expect(diagram(page).locator('text', { hasText: 'Hello' }).first()).toBeVisible()
  })

  test('KaTeX class label → the same notice, the rest of the class diagram still drawn', async ({ page }) => {
    await codeInput.fill(page, SOURCE, 'classDiagram\n    class Shape["$$\\pi r^2$$"]\n    Shape <|-- Circle')
    await expect(diagram(page)).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-slot="tool-status"] [role="status"]')).toHaveText(
      "A math label ($$…$$) can't be drawn, so it's left out of the diagram.",
    )
    await expect(diagram(page).locator('text', { hasText: 'Circle' }).first()).toBeVisible()
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
