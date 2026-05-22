/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UseToolInputResult } from '@/types'
import type { CompileResultDto } from '@/types/wasm/pdf'

import { MarkdownToPdf } from './MarkdownToPdf'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock compileMarkdownToPdf so no real WASM round-trip occurs.
vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils')
  return {
    ...actual,
    compileMarkdownToPdf: vi.fn(async (md: string) => {
      if (md.trim().length === 0) {
        return { svgs: [], pdf: new Uint8Array(0) }
      }
      return {
        svgs: ['<svg xmlns="http://www.w3.org/2000/svg"><text>page-svg</text></svg>'],
        pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // "%PDF"
      }
    }),
  }
})

// ---------------------------------------------------------------------------
// Note: FieldForm type="code" uses CodeMirror which renders a contenteditable
// div — onChange is NOT reachable via fireEvent.change in jsdom. Tests that
// need to assert on a non-empty result drive the component via mocked
// useToolInput return values, bypassing the input pipeline. This mirrors the
// documented pattern in BidirectionalConverter.dom.spec.tsx.
// ---------------------------------------------------------------------------

const EMPTY_RESULT = { svgs: [], pdf: new Uint8Array(0) }
const PDF_RESULT = {
  svgs: ['<svg xmlns="http://www.w3.org/2000/svg"><text>page-svg</text></svg>'],
  pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
}

// Default to empty result (what the component gets before any input).
const mockUseToolInput = vi.fn(
  (): UseToolInputResult<string, CompileResultDto> => ({
    input: '',
    result: EMPTY_RESULT,
    setInput: vi.fn(),
    setInputImmediate: vi.fn(),
    reset: vi.fn(),
    error: null,
    isPending: false,
    recompute: vi.fn(),
  }),
)

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks')
  return {
    ...actual,
    useToolInput: (...args: Parameters<typeof mockUseToolInput>) => mockUseToolInput(...args),
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
  mockUseToolInput.mockImplementation((): UseToolInputResult<string, CompileResultDto> => ({
    input: '',
    result: EMPTY_RESULT,
    setInput: vi.fn(),
    setInputImmediate: vi.fn(),
    reset: vi.fn(),
    error: null,
    isPending: false,
    recompute: vi.fn(),
  }))
})

describe('MarkdownToPdf', () => {
  it('renders empty state before any input', () => {
    render(<MarkdownToPdf autoOpen onAfterDialogClose={() => {}} />)
    expect(screen.getByLabelText('Empty preview')).toBeInTheDocument()
  })

  it('renders the SVG preview when result has pages', () => {
    mockUseToolInput.mockImplementation((): UseToolInputResult<string, CompileResultDto> => ({
      input: '# Hello',
      result: PDF_RESULT,
      setInput: vi.fn(),
      setInputImmediate: vi.fn(),
      reset: vi.fn(),
      error: null,
      isPending: false,
      recompute: vi.fn(),
    }))

    render(<MarkdownToPdf autoOpen onAfterDialogClose={() => {}} />)
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument()
  })

  it('enables the download button once the PDF is non-empty', () => {
    mockUseToolInput.mockImplementation((): UseToolInputResult<string, CompileResultDto> => ({
      input: '# Hello',
      result: PDF_RESULT,
      setInput: vi.fn(),
      setInputImmediate: vi.fn(),
      reset: vi.fn(),
      error: null,
      isPending: false,
      recompute: vi.fn(),
    }))

    render(<MarkdownToPdf autoOpen onAfterDialogClose={() => {}} />)

    const button = screen.getByRole('button', { name: /^Download$/i })
    expect(button).not.toBeDisabled()
  })
})
