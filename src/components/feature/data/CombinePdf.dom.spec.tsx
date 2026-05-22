/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CombinePdf } from './CombinePdf'

vi.mock('@/utils/combine-pdf', async () => ({
  combinePdfPages: vi.fn(async (items: Array<{ file: File; pageIndex: number }>) => {
    if (items.length === 0) return { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }
    return {
      pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      pageCount: items.length,
      skipped: [],
    }
  }),
  readPdfPages: vi.fn(async (file: File) => {
    if (!file.name.endsWith('.pdf')) return null
    return [
      { pageIndex: 0, thumbnailUrl: 'data:image/png;base64,mock1' },
      { pageIndex: 1, thumbnailUrl: 'data:image/png;base64,mock2' },
    ]
  }),
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

describe('CombinePdf (per-page)', () => {
  it('renders the upload button in initial state', async () => {
    render(<CombinePdf autoOpen onAfterDialogClose={() => {}} />)
    expect(await screen.findByText(/Select PDF files/i)).toBeInTheDocument()
  })

  it('renders one card per page across all uploaded files', async () => {
    render(<CombinePdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const files = [makeFile('a.pdf', 'application/pdf'), makeFile('b.pdf', 'application/pdf')]
    fireEvent.change(input, { target: { files } })

    // 2 files × 2 pages = 4 page cards
    await waitFor(() => {
      const cards = screen.getAllByText(/^p[12]$/)
      expect(cards.length).toBe(4)
    })

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /^Download$/i })
      expect(button).not.toBeDisabled()
    })
  })

  it('removes a single page card when its × is clicked', async () => {
    render(<CombinePdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [makeFile('a.pdf', 'application/pdf')] } })

    await waitFor(() => expect(screen.getAllByText(/^p[12]$/).length).toBe(2))

    const removeBtns = screen.getAllByRole('button', { name: /Remove a\.pdf page/i })
    expect(removeBtns.length).toBe(2)
    fireEvent.click(removeBtns[0])

    await waitFor(() => expect(screen.getAllByText(/^p[12]$/).length).toBe(1))
  })

  it('surfaces skipped non-PDF files', async () => {
    render(<CombinePdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const files = [makeFile('a.pdf', 'application/pdf'), makeFile('weird.png', 'image/png')]
    fireEvent.change(input, { target: { files } })

    await waitFor(() => expect(screen.getByText(/Skipped 1 unsupported file/i)).toBeInTheDocument())
  })
})
