/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ImageToPdf } from './ImageToPdf'

vi.mock('@/utils/image-to-pdf', async () => ({
  imagesToPdf: vi.fn(async (items: Array<{ file: File; rotation?: number }>) => {
    if (items.length === 0) return { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }
    return {
      pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      pageCount: items.length,
      skipped: [],
    }
  }),
}))

beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock'),
    configurable: true,
    writable: true,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  })
  // crypto.randomUUID may not be available in jsdom default — polyfill
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

describe('ImageToPdf', () => {
  it('renders dropzone in initial state', async () => {
    render(<ImageToPdf autoOpen onAfterDialogClose={() => {}} />)
    expect(await screen.findByText(/Drop images here or click to choose/i)).toBeInTheDocument()
  })

  it('renders thumbnails and enables download after files are chosen', async () => {
    render(<ImageToPdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const files = [makeFile('a.png', 'image/png'), makeFile('b.jpg', 'image/jpeg')]
    fireEvent.change(input, { target: { files } })

    await waitFor(() => {
      expect(screen.getByText(/Page 1/i)).toBeInTheDocument()
      expect(screen.getByText(/Page 2/i)).toBeInTheDocument()
    })

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /^Download$/i })
      expect(button).not.toBeDisabled()
    })
  })

  it('removes an image when its X button is clicked', async () => {
    render(<ImageToPdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const files = [makeFile('a.png', 'image/png'), makeFile('b.jpg', 'image/jpeg')]
    fireEvent.change(input, { target: { files } })

    await waitFor(() => {
      expect(screen.getByText(/Page 1/i)).toBeInTheDocument()
      expect(screen.getByText(/Page 2/i)).toBeInTheDocument()
    })

    const removeBtn = screen.getByRole('button', { name: /Remove a\.png/i })
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(screen.queryByText(/a\.png/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Page 1/i)).toBeInTheDocument()
    })
  })

  it('surfaces skipped files', async () => {
    render(<ImageToPdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const files = [makeFile('a.png', 'image/png'), makeFile('weird.webp', 'image/webp')]
    fireEvent.change(input, { target: { files } })

    await waitFor(() => {
      expect(screen.getByText(/Skipped 1 unsupported file/i)).toBeInTheDocument()
    })
  })

  it('shows an error banner when the preview cannot render', async () => {
    render(<ImageToPdf autoOpen onAfterDialogClose={() => {}} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [makeFile('a.png', 'image/png')] } })

    // Wait for the thumbnail to appear (confirms the file was accepted)
    await waitFor(() => expect(screen.getByText(/Page 1/i)).toBeInTheDocument())

    // pdf.js will reject the mock %PDF\x00 bytes — error banner should appear
    await waitFor(
      () => expect(screen.getByRole('alert')).toBeInTheDocument(),
      { timeout: 3000 },
    )
  })
})
