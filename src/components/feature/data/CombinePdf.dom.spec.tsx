/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CombinePdf } from './CombinePdf'

vi.mock('@/utils/combine-pdf', async () => ({
  combinePdfs: vi.fn(async (items: Array<{ file: File }>) => {
    if (items.length === 0) return { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }
    return {
      pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      pageCount: items.length,
      skipped: [],
    }
  }),
  readPdfMeta: vi.fn(async () => ({ pageCount: 3, thumbnailUrl: 'data:image/png;base64,mock' })),
}))

beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), configurable: true, writable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true, writable: true })
  if (!('randomUUID' in globalThis.crypto)) {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: () => Math.random().toString(36).slice(2),
      configurable: true,
    })
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

const makeFile = (name: string, type: string): File => new File(['mock'], name, { type })

describe('CombinePdf', () => {
  it('renders the upload button in initial state', async () => {
    render(<CombinePdf autoOpen onAfterDialogClose={() => {}} />)
    expect(await screen.findByText(/Select PDF files/i)).toBeInTheDocument()
  })

  it('renders cards and enables download after PDF files are chosen', async () => {
    render(<CombinePdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const files = [makeFile('a.pdf', 'application/pdf'), makeFile('b.pdf', 'application/pdf')]
    fireEvent.change(input, { target: { files } })

    await waitFor(() => {
      expect(screen.getByText(/a\.pdf/i)).toBeInTheDocument()
      expect(screen.getByText(/b\.pdf/i)).toBeInTheDocument()
    })

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /^Download$/i })
      expect(button).not.toBeDisabled()
    })
  })

  it('removes a PDF when its × button is clicked', async () => {
    render(<CombinePdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const files = [makeFile('a.pdf', 'application/pdf'), makeFile('b.pdf', 'application/pdf')]
    fireEvent.change(input, { target: { files } })

    await waitFor(() => expect(screen.getByText(/a\.pdf/i)).toBeInTheDocument())

    const removeBtn = screen.getByRole('button', { name: /Remove a\.pdf/i })
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(screen.queryByText(/a\.pdf/i)).not.toBeInTheDocument()
      expect(screen.getByText(/b\.pdf/i)).toBeInTheDocument()
    })
  })

  it('surfaces skipped non-PDF files', async () => {
    render(<CombinePdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const files = [makeFile('a.pdf', 'application/pdf'), makeFile('weird.png', 'image/png')]
    fireEvent.change(input, { target: { files } })

    await waitFor(() => expect(screen.getByText(/Skipped 1 unsupported file/i)).toBeInTheDocument())
  })
})
