/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UseToolComputationPersistedResult } from '@/types'
import type { CompileResultDto } from '@/types/wasm/pdf'

import { MarkupToPdfShell } from './MarkupToPdfShell'

// FieldForm type="code" wraps CodeMirror (contenteditable; not reachable via
// fireEvent.change in jsdom). The shell's interesting behavior is the pipeline
// state → UI mapping, not CodeMirror integration — so we drive the shell by
// mocking the persisted-pipeline hook's return value. Mirrors the pattern in
// BidirectionalConverter.dom.spec.tsx and the now-retired per-Tool specs.

const EMPTY_RESULT: CompileResultDto = { svgs: [], pdf: new Uint8Array(0) }
const NONEMPTY_RESULT: CompileResultDto = {
  svgs: ['<svg xmlns="http://www.w3.org/2000/svg"><text>page-svg</text></svg>'],
  pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // "%PDF"
}

const baseReturn = (
  overrides: Partial<UseToolComputationPersistedResult<string, CompileResultDto>> = {},
): UseToolComputationPersistedResult<string, CompileResultDto> => ({
  error: null,
  input: '',
  isPending: false,
  recompute: vi.fn(),
  result: EMPTY_RESULT,
  setInput: vi.fn(),
  setInputImmediate: vi.fn(),
  ...overrides,
})

const mockHook = vi.fn((_opts: unknown) => baseReturn())

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks')
  return {
    ...actual,
    useToolComputationPersisted: (opts: unknown) => mockHook(opts),
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

const renderShell = () =>
  render(
    <MarkupToPdfShell
      autoOpen
      compute={vi.fn()}
      filenameSlug="html"
      inputName="markup-source"
      onAfterDialogClose={() => {}}
      placeholder="placeholder"
      sourceLabel="Source"
      storageKey="csr-dev-tools-markup-test"
      title="Markup to PDF"
      triggerLabel="Convert"
    />,
  )

describe('MarkupToPdfShell', () => {
  it('renders the empty preview placeholder when the result has no svg pages and no error', () => {
    renderShell()
    expect(screen.getByLabelText('Empty preview')).toBeInTheDocument()
  })

  it('disables the download button until the pdf bytes are non-empty', () => {
    renderShell()
    const button = screen.getByRole('button', { name: /^Download$/i })
    expect(button).toBeDisabled()
  })

  it('renders the svg preview and arms the download button when the result is non-empty', () => {
    mockHook.mockImplementation((_opts: unknown) =>
      baseReturn({ input: '# Hi', result: NONEMPTY_RESULT }),
    )

    renderShell()

    expect(screen.getByLabelText('Page 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Download$/i })).not.toBeDisabled()
  })

  it('suppresses the preview and the download when the pipeline error is set, and surfaces err.message', () => {
    // Stale-result scenario: prior successful compute left NONEMPTY_RESULT, then
    // the next compute rejected. The shell must hide both the stale preview AND
    // the stale download bytes (preventing a misleading download), and render
    // the error message inline.
    mockHook.mockImplementation(() =>
      baseReturn({
        error: new Error('Input too large (300000 bytes). Maximum is 262144 bytes.'),
        input: 'huge',
        result: NONEMPTY_RESULT,
      }),
    )

    renderShell()

    expect(screen.queryByLabelText('Page 1')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Download$/i })).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent('Input too large (300000 bytes). Maximum is 262144 bytes.')
  })

  it('falls back to a generic banner message when the rejection is not an Error instance', () => {
    mockHook.mockImplementation((_opts: unknown) =>
      baseReturn({ error: 'not an Error', input: 'x', result: EMPTY_RESULT }),
    )

    renderShell()

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to render PDF')
  })

  it('passes the storageKey + isEmpty trim rule through to the persisted hook', () => {
    renderShell()

    expect(mockHook).toHaveBeenCalled()
    const opts = mockHook.mock.calls[0][0] as {
      storageKey: string
      isEmpty: (val: string) => boolean
      initialResult: CompileResultDto
    }
    expect(opts.storageKey).toBe('csr-dev-tools-markup-test')
    expect(opts.isEmpty('')).toBe(true)
    expect(opts.isEmpty('   \n  ')).toBe(true)
    expect(opts.isEmpty('# Hi')).toBe(false)
    // EMPTY_RESULT pairing — shell must hand the hook the exact same empty shape
    // the empty-bypass returns to; either side alone would flash stale output.
    expect(opts.initialResult.svgs).toEqual([])
    expect(opts.initialResult.pdf.byteLength).toBe(0)
  })
})
