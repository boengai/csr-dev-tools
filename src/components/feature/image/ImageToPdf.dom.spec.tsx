/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ImageToPdf } from './ImageToPdf'

vi.mock('@/utils/image-to-pdf', () => ({
  imagesToPdf: vi.fn(async (files: Array<File>) => {
    if (files.length === 0) return { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }
    return {
      pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      pageCount: files.filter((f) => /\.(png|jpe?g)$/i.test(f.name)).length,
      skipped: files.filter((f) => !/\.(png|jpe?g)$/i.test(f.name)).map((f) => f.name),
    }
  }),
}))

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
  vi.clearAllMocks()
})

const makeFile = (name: string, type: string): File => new File(['mock'], name, { type })

const uploadFiles = (files: Array<File>) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { configurable: true, value: files })
  fireEvent.change(input)
}

describe('ImageToPdf', () => {
  it('renders empty state initially', async () => {
    render(<ImageToPdf autoOpen onAfterDialogClose={() => {}} />)
    expect(await screen.findByLabelText('Empty result')).toBeInTheDocument()
  })

  it('renders page count and download link after files are chosen', async () => {
    render(<ImageToPdf autoOpen onAfterDialogClose={() => {}} />)

    uploadFiles([makeFile('a.png', 'image/png'), makeFile('b.jpg', 'image/jpeg')])

    await waitFor(() => {
      expect(screen.getByText(/2 pages generated/i)).toBeInTheDocument()
    })

    const link = screen.getByRole('link', { name: /Download PDF/i })
    expect(link).toHaveAttribute('download', 'images.pdf')
  })

  it('surfaces skipped files', async () => {
    render(<ImageToPdf autoOpen onAfterDialogClose={() => {}} />)

    uploadFiles([makeFile('a.png', 'image/png'), makeFile('weird.webp', 'image/webp')])

    await waitFor(() => {
      expect(screen.getByText(/Skipped 1 unsupported file/i)).toBeInTheDocument()
      expect(screen.getByText(/weird\.webp/i)).toBeInTheDocument()
    })
  })
})
