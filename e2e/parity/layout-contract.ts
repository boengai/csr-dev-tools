/**
 * The layout contract in a real browser (docs/ux/parity.md → Layout contract
 * suite). The same checks as the jsdom suites (`src/test/layout-contract.tsx`),
 * written against the DOM contract only — roles, accessible names, `data-slot`
 * and `data-has-value` — so the same suite runs against React and Dioxus.
 */
import { expect, type Locator, type Page } from '@playwright/test'

import type { ToolRegistryKey, ToolRoute } from '../../src/types/constants/tool-registry'
import type { BadInputFixture, LayoutErrorFixture, LayoutFixtureStep, ShellLayout } from './layout-fixtures'
import { TOOL_TIMEOUT } from './page'
import { SHELL_LAYOUTS, toolsWithLayout } from './tools'

export type LayoutSpec = {
  /** Whether this output carries Copy in its label, by its `data-output-kind` (default: always). */
  expectsLabelCopy?: (outputKind: null | string) => boolean
  /** Extra per-layout checks on the opened, empty Tool. */
  extra?: (surface: Locator) => Promise<void>
  /** Why a Tool of this layout can have no bad-input fixture. */
  fixturesUnavailable?: string
  /** `placeholder`: the empty state on open. `output`: a value on open (Generator). */
  opensWith: 'output' | 'placeholder'
  /** The button that takes the output away, and whether the empty state already has it. */
  outputAction: { inEmptyState: boolean; name: RegExp }
  /** Finds the output region in the Tool. */
  output: (surface: Locator) => Promise<Locator>
  /**
   * True when the output region shows its empty-state placeholder, not a value.
   * Runs in the page, so it may use nothing but its argument.
   */
  showsPlaceholder: (output: Element) => boolean
  /** Checks on the closed dashboard tile. */
  tile?: (tile: Locator) => Promise<void>
}

const COPY_ACTION = { inEmptyState: true, name: /^Copy .*to clipboard$/ }

/** `[data-slot="tool-output"]`, for the shells that mark their output themselves. */
const slottedOutput = async (surface: Locator): Promise<Locator> => {
  const out = surface.locator('[data-slot="tool-output"]').first()
  await expect(out, 'no [data-slot="tool-output"] in the Tool').toBeAttached()
  return out
}

/** The `CodeOutput` block: its `<pre>`, or the fieldset around it. */
const codeOutput = async (surface: Locator): Promise<Locator> => {
  const pre = surface.locator('pre').first()
  await expect(pre, 'no CodeOutput <pre> in the Tool').toBeAttached()
  const fieldset = pre.locator('xpath=ancestor::fieldset[1]')
  return (await fieldset.count()) > 0 ? fieldset : pre
}

export const LAYOUT_SPECS: Record<ShellLayout, LayoutSpec> = {
  codec: {
    extra: async (surface) => {
      // One mode toggle, exactly one mode pressed.
      const pressed = await surface
        .locator('button[aria-pressed]')
        .evaluateAll((buttons) =>
          buttons
            .filter((b) => /mode$/.test(b.getAttribute('aria-label') ?? ''))
            .map((b) => b.getAttribute('aria-pressed')),
        )
      expect(pressed.length).toBeGreaterThanOrEqual(2)
      expect(pressed.filter((p) => p === 'true')).toHaveLength(1)
    },
    opensWith: 'placeholder',
    output: codeOutput,
    outputAction: COPY_ACTION,
    showsPlaceholder: (out) => {
      const pre = out.querySelector('pre') ?? out
      return !pre.hasAttribute('data-has-value') && (pre.textContent ?? '').trim().length > 0
    },
  },
  comparator: {
    opensWith: 'placeholder',
    output: slottedOutput,
    outputAction: COPY_ACTION,
    showsPlaceholder: (out) => out.querySelector('[data-slot="empty-state"]') !== null,
  },
  'file-processor': {
    extra: async (surface) => {
      // The upload area is the only way in, and it takes a file.
      const area = surface.getByRole('region', { exact: true, name: 'Upload area' })
      await expect(area.locator('input[type="file"]')).toHaveCount(1)
      // Nothing to process yet: no Process / "Choose another" input pane.
      await expect(surface.locator('[data-slot="tool-input"]')).toHaveCount(0)
    },
    fixturesUnavailable: 'files are never persisted, so there is no stored bad input — see FileProcessorShell.dom.spec',
    opensWith: 'placeholder',
    output: async (surface) => {
      const out = surface.locator('[data-slot="upload-area"], [data-slot="tool-output"]').first()
      await expect(out, 'no upload area or [data-slot="tool-output"] in the Tool').toBeAttached()
      return out
    },
    outputAction: { inEmptyState: false, name: /^Download/ },
    showsPlaceholder: (out) => out.getAttribute('data-slot') === 'upload-area',
    tile: async (tile) => {
      // One way in: the tile is a plain button that opens the dialog, not an upload control.
      await expect(tile.getByRole('button')).toHaveCount(1)
      await expect(tile.locator('input[type="file"]')).toHaveCount(0)
    },
  },
  generator: {
    // `image` takes the output away with Download, not Copy.
    expectsLabelCopy: (kind) => kind !== 'image',
    opensWith: 'output',
    output: slottedOutput,
    outputAction: COPY_ACTION,
    showsPlaceholder: (out) => !out.hasAttribute('data-has-value') && (out.textContent ?? '').trim().length > 0,
  },
  transformer: {
    // `fields` puts Copy on each row; `image` takes the output away with Download.
    expectsLabelCopy: (kind) => kind === 'text' || kind === 'markup',
    opensWith: 'placeholder',
    output: slottedOutput,
    outputAction: COPY_ACTION,
    showsPlaceholder: (out) => {
      if (out.hasAttribute('data-has-value')) return false
      const placeholder = out.querySelector('[data-slot="output-placeholder"]') ?? out.querySelector('pre')
      return (placeholder?.textContent ?? '').trim().length > 0
    },
  },
}

/**
 * The Tool the dashboard-dialog run uses for each layout: one already on the
 * default dashboard where there is one. Another build falls back to the first
 * ported Tool of that layout.
 */
export const DIALOG_TOOL: Record<ShellLayout, ToolRegistryKey> = {
  codec: 'base64-codec',
  comparator: 'json-diff-checker',
  'file-processor': 'image-converter',
  generator: 'uuid-generator',
  transformer: 'json-formatter',
}

/** The Tool of `layout` that this run opens in the dashboard dialog, if it has any Tool of that layout. */
export const dialogToolFor = (layout: ShellLayout): ToolRoute | undefined => {
  const tools = toolsWithLayout(layout)
  return tools.find((tool) => tool.key === DIALOG_TOOL[layout]) ?? tools[0]
}

/** The one dashboard dialog axe checks: the Transformer's, else the first layout this run has. */
export const dashboardDialogTool = (): ToolRoute | undefined =>
  (['transformer', ...SHELL_LAYOUTS] as const).map(dialogToolFor).find(Boolean)

/** Writes localStorage entries before any page script runs. Values are JSON-encoded, as the Tools store them. */
export const seedStorage = async (page: Page, entries: Record<string, unknown>): Promise<void> => {
  const encoded = Object.fromEntries(Object.entries(entries).map(([key, value]) => [key, JSON.stringify(value)]))
  await page.addInitScript((items: Record<string, string>) => {
    try {
      for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value)
    } catch {
      // A sandboxed frame has no storage.
    }
  }, encoded)
}

/** Opens the Tool on its own route, where it renders inline (ADR-0029). */
export const openOnRoute = async (page: Page, tool: ToolRoute): Promise<Locator> => {
  await page.goto(tool.routePath)
  const surface = page.locator('[data-slot="tool-surface"]')
  await expect(surface).toBeVisible({ timeout: TOOL_TIMEOUT })
  return surface
}

/** The dashboard widget showing `tool`, once the dashboard holds only that Tool (see `seedDashboard`). */
export const dashboardWidget = (page: Page, tool: ToolRoute): Locator =>
  page
    .getByTestId('dashboard-widget')
    .filter({ has: page.getByRole('heading', { exact: true, level: 3, name: tool.name }) })

/** The Tool's tile inside its widget: the card body, without the card's own close control. */
export const dashboardTile = (page: Page, tool: ToolRoute): Locator =>
  dashboardWidget(page, tool).locator('article > div').last()

/** Puts `tool` alone on the dashboard: the saved layout (`feature_layout`, version 2) with every other slot closed. */
export const seedDashboard = async (page: Page, tool: ToolRoute): Promise<void> => {
  const value = { 0: tool.key, 1: null, 2: null, 3: null, 4: null, 5: null }
  await seedStorage(page, { feature_layout: { state: { value }, version: 2 } })
}

/** Opens the Tool from its dashboard tile, in the dialog. Call `seedDashboard` first, then go to `/`. */
export const openInDialog = async (page: Page, tool: ToolRoute): Promise<Locator> => {
  const tile = dashboardTile(page, tool)
  await expect(tile.getByRole('button').first()).toBeVisible({ timeout: TOOL_TIMEOUT })
  await tile.getByRole('button').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: TOOL_TIMEOUT })
  return dialog
}

export const statusSlot = (surface: Locator): Locator => surface.locator('[data-slot="tool-status"]').first()

/** The element a `type` step writes to: the shell's source, or a field by its accessible name. */
const typeInto = async (page: Page, surface: Locator, field: string, text: string): Promise<void> => {
  if (field !== 'source') {
    await surface.getByLabel(field, { exact: true }).fill(text)
    return
  }
  const source = surface.locator('[data-testid="code-input-dialog-source"] .cm-content, [name="dialog-source"]').first()
  await expect(source, 'no source field in the Tool').toBeVisible()
  if (await source.evaluate((el) => el.getAttribute('contenteditable') === 'true')) {
    await source.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.insertText(text)
    return
  }
  await source.fill(text)
}

export const runStep = async (page: Page, surface: Locator, step: LayoutFixtureStep): Promise<void> => {
  if ('click' in step) {
    await surface.getByRole('button', { exact: true, name: step.click }).click()
    return
  }
  if ('select' in step) {
    await surface.getByRole('combobox', { exact: true, name: step.select }).click()
    await page.getByRole('option', { exact: true, name: step.option }).click()
    return
  }
  await typeInto(page, surface, step.field ?? 'source', step.type)
}

/** The fixture's bad input, or `null` when the Tool has none to apply. */
export const badInput = (fixture: LayoutErrorFixture | undefined): BadInputFixture | null =>
  fixture && !('never' in fixture) ? fixture : null

/** Why a Tool has no bad input, for the skipped error-path test's title. */
export const noBadInputReason = (fixture: LayoutErrorFixture | undefined, spec: LayoutSpec): string =>
  fixture && 'never' in fixture
    ? `input cannot be invalid: ${fixture.never}`
    : (spec.fixturesUnavailable ?? 'needs a bad-input fixture')

/** Seeds the fixture's storage. Call before the Tool opens. */
export const seedBadInput = async (page: Page, fixture: BadInputFixture) => {
  if (fixture.storage) await seedStorage(page, fixture.storage)
}

/** Runs the fixture's steps on the open Tool and waits for the error in the status slot. */
export const applyBadInput = async (page: Page, surface: Locator, fixture: BadInputFixture): Promise<Locator> => {
  for (const step of fixture.steps ?? []) await runStep(page, surface, step)
  const alert = statusSlot(surface).getByRole('alert').first()
  await expect(alert).toBeVisible({ timeout: 12_000 })
  return alert
}

const showsPlaceholder = async (surface: Locator, spec: LayoutSpec): Promise<boolean> =>
  (await spec.output(surface)).evaluate(spec.showsPlaceholder)

/**
 * The open Tool: status slot above the work area, the placeholder (or, for a
 * Generator, a value) in the output, the output's action beside it, no alert.
 */
export const expectOpenContract = async (surface: Locator, spec: LayoutSpec): Promise<void> => {
  const slot = statusSlot(surface)
  await expect(slot, 'no [data-slot="tool-status"] in the Tool').toBeAttached()

  if (spec.opensWith === 'placeholder') {
    // The empty state is the output's own placeholder, phrased by the Tool.
    expect(await showsPlaceholder(surface, spec), 'the output shows its placeholder').toBe(true)
  } else {
    await expect.poll(() => showsPlaceholder(surface, spec), { timeout: 12_000 }).toBe(false)
    expect(((await (await spec.output(surface)).textContent()) ?? '').trim()).not.toBe('')
  }

  const out = await spec.output(surface)
  // The status slot sits above the work area.
  const outHandle = await out.elementHandle()
  expect(
    await slot.evaluate(
      (s, o) => Boolean(o && s.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING),
      outHandle,
    ),
    'the status slot comes before the output',
  ).toBe(true)
  await outHandle?.dispose()

  // The action that takes the output away lives with the output. File output offers none before there is any.
  const expectsLabelCopy = spec.expectsLabelCopy ?? (() => true)
  if (expectsLabelCopy(await out.getAttribute('data-output-kind'))) {
    const { inEmptyState, name } = spec.outputAction
    if (inEmptyState || spec.opensWith === 'output') {
      const holder = out.locator(
        'xpath=ancestor-or-self::*[self::fieldset or (self::section and not(@data-slot="tool-surface")) or @data-slot="tool-output"][1]',
      )
      expect(await holder.getByRole('button', { name }).count(), `a ${name} button with the output`).toBeGreaterThan(0)
    } else {
      await expect(surface.getByRole('button', { name })).toHaveCount(0)
    }
  }

  // Nothing has gone wrong yet.
  await expect(surface.getByRole('alert')).toHaveCount(0)

  await spec.extra?.(surface)
}

/** After bad input: a message in the status slot, and the output back on its placeholder. */
export const expectBadInputContract = async (
  page: Page,
  surface: Locator,
  spec: LayoutSpec,
  fixture: BadInputFixture,
): Promise<void> => {
  const alert = await applyBadInput(page, surface, fixture)
  expect(((await alert.textContent()) ?? '').trim()).not.toBe('')
  await expect.poll(() => showsPlaceholder(surface, spec), { timeout: 5_000 }).toBe(true)
}
