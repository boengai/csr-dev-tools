/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks/state/useToast'
import { generateFavicons } from '@/utils'

import { FaviconGenerator } from './FaviconGenerator'

vi.mock('@/utils/image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/image')>()),
  loadImageFromBlob: vi.fn(async (file: File) => ({ name: file.name, naturalHeight: 64, naturalWidth: 64 })),
}))

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  generateFavicons: vi.fn(async () => [
    { blob: new Blob(['16']), dataUrl: '', size: { height: 16, name: 'favicon-16x16.png', rel: 'icon', width: 16 } },
  ]),
}))

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL

const png = (name: string) => new File(['x'], name, { type: 'image/png' })

const pick = async (name: string, file: File) => {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (!input) throw new Error(`No input[name="${name}"]`)
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } })
  })
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  useToast.setState({ items: [] })
})

afterEach(() => {
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
  vi.clearAllMocks()
})

describe('FaviconGenerator', () => {
  it('generates on upload: a card per favicon, the link tags with Copy, and Download ZIP', async () => {
    render(<FaviconGenerator autoOpen />)
    await pick('image', png('logo.png'))

    const output = await waitFor(() => {
      const out = document.querySelector<HTMLElement>('[data-slot="tool-output"]')
      expect(out?.querySelector('[data-has-value]')).not.toBeNull()
      return out as HTMLElement
    })
    expect(within(output).getByRole('button', { name: 'Download favicon-16x16.png' })).toBeTruthy()
    expect(within(output).getByRole('button', { name: 'Copy HTML link tags to clipboard' })).toBeTruthy()
    expect(within(output).getByRole('button', { name: 'Download ZIP' })).toBeTruthy()
  })

  it('regenerates the favicons for an image picked with "Choose another image"', async () => {
    render(<FaviconGenerator autoOpen />)
    await pick('image', png('first.png'))
    await waitFor(() => expect(generateFavicons).toHaveBeenCalledTimes(1))

    await pick('image-replace', png('second.png'))

    await waitFor(() => expect(generateFavicons).toHaveBeenCalledTimes(2))
    expect(vi.mocked(generateFavicons).mock.calls.at(-1)?.[0]).toMatchObject({ name: 'second.png' })
  })

  it('does not regenerate when "Choose another image" picks a file that is rejected', async () => {
    render(<FaviconGenerator autoOpen />)
    await pick('image', png('first.png'))
    await waitFor(() => expect(generateFavicons).toHaveBeenCalledTimes(1))

    await pick('image-replace', new File(['x'], 'notes.txt', { type: 'text/plain' }))

    expect(generateFavicons).toHaveBeenCalledTimes(1)
    expect(useToast.getState().items.map((t) => t.label)).toContain('Please select an image file')
  })

  it('shows a generation failure in the status slot, not as a toast', async () => {
    vi.mocked(generateFavicons).mockRejectedValueOnce(new Error('canvas exploded'))
    render(<FaviconGenerator autoOpen />)
    await pick('image', png('logo.png'))

    const slot = document.querySelector<HTMLElement>('[data-slot="tool-status"]') as HTMLElement
    expect((await within(slot).findByRole('alert')).textContent).toContain('Could not generate favicons')
    expect(screen.queryByRole('button', { name: 'Download ZIP' })).toBeNull()
    expect(useToast.getState().items).toEqual([])
  })
})
