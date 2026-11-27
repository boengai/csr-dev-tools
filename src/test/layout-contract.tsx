/**
 * Layout contract (ADR-0027, docs/ux/README.md). One shared suite per layout
 * type, run over every tool tagged with that layout in `tool-routes.ts` that
 * is no longer pending migration. Adding a tool to a shell adds it here with
 * no per-tool test work; the error path needs one bad-input fixture per tool —
 * saved input seeded into localStorage, or input typed into the opened dialog —
 * and tools without one are reported as `todo`, never silently passed.
 */
import { EditorView } from '@codemirror/view'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Suspense } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { TOOL_REGISTRY } from '@/constants'
import type { ToolLayout, ToolRegistryEntry, ToolRegistryKey } from '@/types'

import type { LayoutErrorFixture, LayoutFixtureStep } from '../../e2e/parity/layout-fixtures'
import { LAYOUT_MIGRATION_PENDING } from './layout-migration'

type LayoutContractOptions = {
  /**
   * Whether this output carries Copy in its label (default: always). An
   * output kind that puts Copy on each row (Transformer `fields`), or takes
   * the output away with Download instead (`image`), returns false.
   */
  expectsLabelCopy?: (output: HTMLElement) => boolean
  /** Extra per-layout assertions on the opened, empty dialog. */
  extra?: (dialog: HTMLElement) => void
  fixtures: Partial<Record<ToolRegistryKey, LayoutErrorFixture>>
  /**
   * What the output shows once the dialog opens. `placeholder` (default): the
   * empty state, for layouts that wait for input. `output`: a value, for
   * layouts that produce one on open with default options (Generator).
   */
  opensWith?: 'output' | 'placeholder'
  /**
   * Why a tool of this layout can have no bad-input fixture (e.g. files are
   * never persisted). Tools without a fixture are still reported as `todo`,
   * with this reason in the title.
   */
  fixturesUnavailable?: string
  /**
   * The button that takes the output away, and whether it is already there
   * on the empty state. Defaults to the text shells' Copy, present while empty.
   */
  outputAction?: { inEmptyState: boolean; name: RegExp }
  /** Finds the output region inside the dialog. */
  output: (dialog: HTMLElement) => HTMLElement
  /** True when the output region shows its empty-state placeholder, not a value. */
  showsPlaceholder: (output: HTMLElement) => boolean
  /** Assertions on the closed tile (rendered without `autoOpen`). */
  tile?: (tile: HTMLElement) => void
}

const COPY_ACTION = { inEmptyState: true, name: /^Copy .*to clipboard$/ }

const openTool = async (entry: ToolRegistryEntry): Promise<HTMLElement> => {
  const Tool = entry.component
  render(
    <Suspense fallback={null}>
      <Tool autoOpen />
    </Suspense>,
  )
  return screen.findByRole('dialog', {}, { timeout: 5000 })
}

const statusSlot = (dialog: HTMLElement): HTMLElement => {
  const slot = dialog.querySelector<HTMLElement>('[data-slot="tool-status"]')
  if (!slot) throw new Error('No [data-slot="tool-status"] in the dialog')
  return slot
}

/** The element a `type` step writes to: the shell's source, or a field by its accessible name. */
const findField = (dialog: HTMLElement, field: string): HTMLElement => {
  if (field !== 'source') return within(dialog).getByLabelText(field)
  const source = dialog.querySelector<HTMLElement>(
    '[data-testid="code-input-dialog-source"] .cm-content, [name="dialog-source"]',
  )
  if (!source) throw new Error('No source field (CodeMirror or [name="dialog-source"]) in the dialog')
  return source
}

const runStep = async (dialog: HTMLElement, step: LayoutFixtureStep): Promise<void> => {
  if ('click' in step) {
    fireEvent.click(within(dialog).getByRole('button', { name: step.click }))
    return
  }
  if ('select' in step) {
    // Radix Select opens on Enter and picks an item on a non-mouse click; its list is portaled.
    fireEvent.keyDown(within(dialog).getByRole('combobox', { name: step.select }), { key: 'Enter' })
    fireEvent.click(await screen.findByRole('option', { name: step.option }))
    return
  }
  const el = findField(dialog, step.field ?? 'source')
  const editor = el.closest<HTMLElement>('.cm-editor')
  if (editor) {
    // CodeMirror owns its contenteditable; jsdom can't type into it, so set the doc directly.
    const view = EditorView.findFromDOM(editor)
    if (!view) throw new Error('No CodeMirror view for the field')
    act(() => view.dispatch({ changes: { from: 0, insert: step.type, to: view.state.doc.length } }))
    return
  }
  fireEvent.change(el, { target: { value: step.type } })
}

export const toolsWithLayout = (layout: Exclude<ToolLayout, 'custom'>): Array<ToolRegistryEntry> =>
  TOOL_REGISTRY.filter((e) => e.layout === layout && !LAYOUT_MIGRATION_PENDING.has(e.key))

export const describeLayoutContract = (
  layout: Exclude<ToolLayout, 'custom'>,
  {
    expectsLabelCopy = () => true,
    extra,
    fixtures,
    fixturesUnavailable,
    opensWith = 'placeholder',
    outputAction = COPY_ACTION,
    output,
    showsPlaceholder,
    tile,
  }: LayoutContractOptions,
) => {
  const tools = toolsWithLayout(layout)
  const opening =
    opensWith === 'placeholder'
      ? 'opens on its empty state: status slot above the work area, placeholder output, copy beside the output'
      : 'opens with output: status slot above the work area, a value in the output, copy beside the output'

  describe(`${layout} layout contract`, () => {
    beforeAll(() => {
      globalThis.ResizeObserver ??= class {
        disconnect() {}
        observe() {}
        unobserve() {}
      }
      // CodeMirror measures text ranges; jsdom has no layout.
      Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
      Range.prototype.getBoundingClientRect ??= () => new DOMRect()
      // Radix Select scrolls the picked item into view when its list opens.
      Element.prototype.scrollIntoView ??= () => {}
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('covers at least one tool', () => {
      expect(tools.length).toBeGreaterThan(0)
    })

    describe.each(tools.map((t) => [t.key, t] as const))('%s', (key, entry) => {
      it(
        opening,
        async () => {
          const dialog = await openTool(entry)
          const slot = statusSlot(dialog)

          if (opensWith === 'placeholder') {
            // Q19: the empty state is the output's own placeholder, phrased by the tool.
            expect(showsPlaceholder(output(dialog))).toBe(true)
          } else {
            await waitFor(() => expect(showsPlaceholder(output(dialog))).toBe(false), { timeout: 12_000 })
            expect(output(dialog).textContent?.trim()).not.toBe('')
          }
          const out = output(dialog)
          // Q17: the status slot sits above the work area.
          expect(slot.compareDocumentPosition(out) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
          // Q18: the action that takes the output away lives with the output (a list
          // output has one per row too). File output offers none before there is any.
          if (expectsLabelCopy(out)) {
            if (outputAction.inEmptyState || opensWith === 'output') {
              expect(
                within(out.closest('fieldset, section, [data-slot="tool-output"]') ?? out).getAllByRole('button', {
                  name: outputAction.name,
                }).length,
              ).toBeGreaterThan(0)
            } else {
              expect(within(dialog).queryByRole('button', { name: outputAction.name })).toBeNull()
            }
          }
          // Nothing has gone wrong yet.
          expect(within(dialog).queryByRole('alert')).toBeNull()

          extra?.(dialog)
        },
        15_000,
      )

      if (tile) {
        it('renders its tile', async () => {
          const Tool = entry.component
          const { container } = render(
            <Suspense fallback={null}>
              <Tool />
            </Suspense>,
          )
          await waitFor(() => expect(container.querySelector('button')).not.toBeNull())
          tile(container)
        })
      }

      const fixture = fixtures[key]
      if (!fixture || 'never' in fixture) {
        const reason = fixture
          ? `input cannot be invalid: ${fixture.never}`
          : (fixturesUnavailable ?? 'needs a bad-input fixture')
        it.todo(`shows invalid input in the status slot and clears the output (${reason})`)
        return
      }

      it('shows invalid input in the status slot and clears the output', async () => {
        for (const [storageKey, value] of Object.entries(fixture.storage ?? {}))
          localStorage.setItem(storageKey, JSON.stringify(value))
        const dialog = await openTool(entry)
        for (const step of fixture.steps ?? []) await runStep(dialog, step)

        const alert = await within(statusSlot(dialog)).findByRole('alert', {}, { timeout: 12_000 })
        expect(alert.textContent?.trim()).not.toBe('')
        await waitFor(() => expect(showsPlaceholder(output(dialog))).toBe(true))
      }, 15_000)
    })
  })
}

/** Output region for the text shells (Codec, Transformer): the `CodeOutput` block. */
export const codeOutput = (dialog: HTMLElement): HTMLElement => {
  const pre = dialog.querySelector('pre')
  if (!pre) throw new Error('No CodeOutput <pre> in the dialog')
  return pre.closest('fieldset') ?? pre
}

export const codeOutputShowsPlaceholder = (out: HTMLElement): boolean => {
  const pre = out.querySelector('pre') ?? out
  return !pre.hasAttribute('data-has-value') && (pre.textContent ?? '').trim().length > 0
}

/**
 * Output region for shells that mark it themselves (`data-slot="tool-output"`,
 * `data-has-value` once there is a value) — any output kind, not only a
 * `CodeOutput` block. Used by the Transformer and Generator suites.
 */
export const slottedOutput = (dialog: HTMLElement): HTMLElement => {
  const out = dialog.querySelector<HTMLElement>('[data-slot="tool-output"]')
  if (!out) throw new Error('No [data-slot="tool-output"] in the dialog')
  return out
}

/**
 * Reads the placeholder itself — a `CodeOutput` `<pre>`, or an element marked
 * `data-slot="output-placeholder"` — not the whole region, whose label text
 * would pass for a placeholder.
 */
export const slottedOutputShowsPlaceholder = (out: HTMLElement): boolean => {
  if (out.hasAttribute('data-has-value')) return false
  const placeholder = out.querySelector('[data-slot="output-placeholder"]') ?? out.querySelector('pre')
  return (placeholder?.textContent ?? '').trim().length > 0
}

/** Generator outputs: placeholder = no `data-has-value` and some text in the region. */
export const toolOutputShowsPlaceholder = (out: HTMLElement): boolean =>
  !out.hasAttribute('data-has-value') && (out.textContent ?? '').trim().length > 0

/** Alias kept for the Generator suite. */
export const toolOutput = slottedOutput
