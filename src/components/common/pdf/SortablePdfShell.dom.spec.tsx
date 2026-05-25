/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BytesPdfResult, UseToolComputationResult } from '@/types'

import { SortablePdfShell } from './SortablePdfShell'

const EMPTY_RESULT: BytesPdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }
const NONEMPTY_RESULT: BytesPdfResult = {
  pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // "%PDF"
  pageCount: 1,
  skipped: [],
}

type Item = { id: string; label: string }

// Stable spy across all renders so the mirror-effect test can observe calls
// after a state update triggers a re-render. vi.clearAllMocks() in afterEach
// resets call history without replacing the reference.
const setInputSpy = vi.fn()

const baseReturn = (
  overrides: Partial<UseToolComputationResult<{ items: Array<Item>; extras: Record<string, never> }, BytesPdfResult>> = {},
): UseToolComputationResult<{ items: Array<Item>; extras: Record<string, never> }, BytesPdfResult> => ({
  error: null,
  isPending: false,
  recompute: vi.fn(),
  result: EMPTY_RESULT,
  setInput: setInputSpy,
  setInputImmediate: vi.fn(),
  ...overrides,
})

const mockHook = vi.fn((_opts: unknown) => baseReturn())

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks')
  return {
    ...actual,
    useToolComputation: (_compute: unknown, opts: unknown) => mockHook(opts),
  }
})

beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock'),
    configurable: true,
    writable: true,
  })
})

afterEach(() => {
  vi.clearAllMocks()
  mockHook.mockImplementation((_opts: unknown) => baseReturn())
})

const renderShell = (overrides: Partial<React.ComponentProps<typeof SortablePdfShell<Item>>> = {}) =>
  render(
    <SortablePdfShell<Item>
      accept="image/*"
      autoOpen
      compute={vi.fn().mockResolvedValue(EMPTY_RESULT)}
      extensionRe={/\.(png|jpe?g)$/i}
      filenameSlug="test"
      onAcceptedFiles={vi.fn()}
      renderCard={(item, { position, onRemove }) => (
        <div data-testid={`card-${item.id}`}>
          <span>{item.label}</span>
          <span>p{position}</span>
          <button onClick={onRemove} type="button">Remove</button>
        </div>
      )}
      title="Sortable PDF Test"
      triggers={[{ label: 'Open' }]}
      uploadButtonLabel="Select files"
      uploadInputName="sortable-pdf-test"
      {...overrides}
    />,
  )

describe('SortablePdfShell', () => {
  it('hides download + preview when there is no result and no error', () => {
    renderShell()
    expect(screen.queryByRole('button', { name: /^Download$/i })).toBeNull()
    // PdfBytesPreview returns null for empty bytes and is gated on hasResult
    // in the shell — "PDF preview" heading must also be absent.
    expect(screen.queryByText(/PDF preview/i)).toBeNull()
  })

  it('renders the download button when result.pdf is non-empty', () => {
    mockHook.mockImplementation(() => baseReturn({ result: NONEMPTY_RESULT }))
    renderShell()
    expect(screen.getByRole('button', { name: /^Download$/i })).not.toBeDisabled()
  })

  it('suppresses download + preview when the pipeline error is set, and surfaces err.message', () => {
    // Stale-result scenario: prior successful compute left NONEMPTY_RESULT,
    // then the next compute rejected. The shell must hide both the stale
    // preview AND the stale download bytes (preventing a misleading download),
    // and render the error message inline.
    mockHook.mockImplementation(() =>
      baseReturn({ error: new Error('Failed to decode page 3'), result: NONEMPTY_RESULT }),
    )

    renderShell()

    expect(screen.queryByRole('button', { name: /^Download$/i })).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to decode page 3')
  })

  it('falls back to a generic banner message when the rejection is not an Error instance', () => {
    mockHook.mockImplementation(() => baseReturn({ error: 'not an Error', result: EMPTY_RESULT }))
    renderShell()
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to generate PDF')
  })

  it('passes the items-length isEmpty rule + EMPTY_RESULT initial through to the pipeline hook', () => {
    renderShell()
    expect(mockHook).toHaveBeenCalled()
    const opts = mockHook.mock.calls[0][0] as {
      isEmpty: (input: { items: Array<Item>; extras: Record<string, never> }) => boolean
      initial: BytesPdfResult
    }
    expect(opts.isEmpty({ items: [], extras: {} })).toBe(true)
    expect(opts.isEmpty({ items: [{ id: '1', label: 'a' }], extras: {} })).toBe(false)
    // EMPTY_RESULT pairing — shell must hand the hook the same empty shape
    // the empty-bypass returns to. Either side alone would flash stale output.
    expect(opts.initial.pdf.byteLength).toBe(0)
    expect(opts.initial.pageCount).toBe(0)
    expect(opts.initial.skipped).toEqual([])
  })

  it('routes upload through the extension filter and forwards accepted files to onAcceptedFiles', () => {
    const onAcceptedFiles = vi.fn()
    renderShell({ onAcceptedFiles })

    const png = new File(['a'], 'pic.png', { type: 'image/png' })
    const txt = new File(['b'], 'note.txt', { type: 'text/plain' })

    const input = screen.getByLabelText(/Select files/i) as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [png, txt], configurable: true })
    fireEvent.change(input)

    expect(onAcceptedFiles).toHaveBeenCalledTimes(1)
    const [accepted] = onAcceptedFiles.mock.calls[0]
    expect(accepted).toEqual([png])

    // The shell auto-rejected note.txt — skipped banner should be visible.
    expect(screen.getByText(/Skipped 1 unsupported file: note\.txt/i)).toBeInTheDocument()
  })

  it('passes initialExtras to renderControls ctx', () => {
    const renderControls = vi.fn((_ctx) => <span data-testid="controls" />)
    renderShell({
      initialExtras: { mode: 'a' as const },
      renderControls: renderControls as never,
    } as never)

    expect(screen.getByTestId('controls')).toBeInTheDocument()
    expect(renderControls).toHaveBeenCalled()
    const ctx = renderControls.mock.calls.at(-1)![0]
    expect(ctx.extras).toEqual({ mode: 'a' })
  })

  it('reflects setExtras changes back into compute via the mirror effect', () => {
    // Render a controls slot that exposes a button which calls setExtras.
    // Asserting via setInputSpy captures the round-trip: setExtras →
    // state update → mirror effect → setInput({ items, extras: merged }).
    const renderControls = vi.fn(
      ({ setExtras }: { setExtras: (p: Partial<{ mode: string }>) => void }) => (
        <button data-testid="toggle" onClick={() => setExtras({ mode: 'b' })} type="button">
          Toggle
        </button>
      ),
    )

    renderShell({
      initialExtras: { mode: 'a' as const },
      renderControls: renderControls as never,
    } as never)

    setInputSpy.mockClear()

    fireEvent.click(screen.getByTestId('toggle'))

    // The mirror effect runs after the extras state update commits.
    expect(setInputSpy).toHaveBeenCalled()
    const last = setInputSpy.mock.calls.at(-1)![0] as { items: Array<unknown>; extras: { mode: string } }
    expect(last.extras).toEqual({ mode: 'b' })
  })
})
