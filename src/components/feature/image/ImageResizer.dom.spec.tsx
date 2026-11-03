import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { processImage } from '@/utils/image'

import { ImageResizer } from './ImageResizer'

vi.mock('@/utils/image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/image')>()),
  processImage: vi.fn(),
}))
vi.mock('@/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/file')>()),
  parseDataUrlToBlob: vi.fn(async () => new Blob(['x'])),
}))

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL

const upload = (files: Array<File>) => {
  const input = document.querySelector('input[name="images"]') as HTMLInputElement
  fireEvent.change(input, { target: { files } })
}

/** Open the Radix "Resize mode" select with the keyboard and choose `label`. */
const pickMode = (label: string) => {
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Resize mode' }), { key: 'ArrowDown' })
  fireEvent.keyDown(screen.getByRole('option', { name: label }), { key: 'Enter' })
}

const settle = async () => {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
}

beforeEach(() => {
  // Radix Select scrolls the highlighted option into view; jsdom has no layout.
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  )
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  vi.mocked(processImage).mockResolvedValue({
    dataUrl: 'data:image/png;base64,',
    format: 'image/png',
    height: 50,
    ratio: 2,
    size: 1,
    width: 100,
  })
  // jsdom has no encoder: claim PNG/JPEG/WebP support, but not GIF.
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((type = 'image/png') =>
    type === 'image/gif' ? 'data:image/png;base64,' : `data:${type};base64,`,
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllMocks()
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
})

describe('ImageResizer', () => {
  it('needs a max width or height before resizing', () => {
    render(<ImageResizer />)
    upload([new File(['x'], 'a.png', { type: 'image/png' })])

    expect(screen.getByRole('button', { name: 'Resize' })).toBeDisabled()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Max width' }), { target: { value: '100' } })
    expect(screen.getByRole('button', { name: 'Resize' })).toBeEnabled()
  })

  it('fits every image within the box, keeping each original format by default', async () => {
    render(<ImageResizer />)
    upload([
      new File(['x'], 'a.png', { type: 'image/png' }),
      new File(['x'], 'b.jpg', { type: 'image/jpeg' }),
      new File(['x'], 'c.gif', { type: 'image/gif' }),
    ])
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Max width' }), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Resize 3 images' }))
    await settle()

    const calls = vi.mocked(processImage).mock.calls.map(([, opts]) => opts)
    expect(calls).toEqual([
      { format: 'image/png', maxHeight: undefined, maxWidth: 100, quality: 1, strategy: 'stretch' },
      { format: 'image/jpeg', maxHeight: undefined, maxWidth: 100, quality: 0.9, strategy: 'stretch' },
      // The browser can't encode GIF, so "keep original" falls back to PNG.
      { format: 'image/png', maxHeight: undefined, maxWidth: 100, quality: 1, strategy: 'stretch' },
    ])
    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByText(/100 × 50/)).toHaveLength(3)
  })

  it('explains the quality setting while keeping original formats', () => {
    render(<ImageResizer />)
    upload([new File(['x'], 'a.png', { type: 'image/png' })])

    expect(screen.getByText(/Quality applies to JPEG, WebP, and AVIF images/)).toBeInTheDocument()
  })

  it('resizes to an exact size with crop-to-fill, and needs both sides', async () => {
    render(<ImageResizer />)
    upload([new File(['x'], 'a.png', { type: 'image/png' }), new File(['x'], 'b.png', { type: 'image/png' })])
    pickMode('Exact — crop to fill')

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: '300' } })
    expect(screen.getByRole('button', { name: 'Resize 2 images' })).toBeDisabled()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Height' }), { target: { value: '200' } })
    fireEvent.click(screen.getByRole('button', { name: 'Resize 2 images' }))
    await settle()

    const runCalls = vi
      .mocked(processImage)
      .mock.calls.slice(-2)
      .map(([, opts]) => opts)
    expect(runCalls).toEqual([
      { format: 'image/png', height: 200, quality: 1, strategy: 'cover', width: 300 },
      { format: 'image/png', height: 200, quality: 1, strategy: 'cover', width: 300 },
    ])
  })

  it('stretches to an exact size', async () => {
    render(<ImageResizer />)
    upload([new File(['x'], 'a.png', { type: 'image/png' })])
    pickMode('Exact — stretch')
    expect(screen.getByText(/stretched to fill/)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: '64' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Height' }), { target: { value: '32' } })
    fireEvent.click(screen.getByRole('button', { name: 'Resize' }))
    await settle()

    expect(vi.mocked(processImage).mock.lastCall?.[1]).toEqual({
      format: 'image/png',
      height: 32,
      quality: 1,
      strategy: 'stretch',
      width: 64,
    })
  })
})
