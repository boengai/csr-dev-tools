/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { generateFavicons } from '@/utils'

import { FaviconGenerator } from './FaviconGenerator'

vi.mock('@/utils/image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/image')>()),
  loadImageFromBlob: vi.fn(async (file: File) => ({ name: file.name, naturalHeight: 64, naturalWidth: 64 })),
}))

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  generateFavicons: vi.fn(async () => []),
}))

// Stand-in for the upload tile + dialog: one file input that calls onUpload, and the dialog body.
vi.mock('@/components/common/dialog/UploadDialogFrame', () => ({
  UploadDialogFrame: ({
    children,
    onUpload,
  }: {
    children: ReactNode
    onUpload: (files: Array<File>, openDialog: () => void) => void
  }) => (
    <div>
      <input
        aria-label="tile upload"
        onChange={(e) => onUpload(Array.from(e.target.files ?? []), () => undefined)}
        type="file"
      />
      {children}
    </div>
  ),
}))

const png = (name: string) => new File(['x'], name, { type: 'image/png' })

describe('FaviconGenerator', () => {
  it('regenerates the favicons for an image picked with "Upload New"', async () => {
    render(<FaviconGenerator />)
    fireEvent.change(screen.getByLabelText('tile upload'), { target: { files: [png('first.png')] } })
    await waitFor(() => expect(generateFavicons).toHaveBeenCalledTimes(1))

    fireEvent.click(await screen.findByRole('button', { name: 'Upload New' }))
    const picker = document.body.querySelector<HTMLInputElement>(':scope > input[type="file"]')
    await act(async () => {
      if (picker) fireEvent.change(picker, { target: { files: [png('second.png')] } })
    })

    await waitFor(() => expect(generateFavicons).toHaveBeenCalledTimes(2))
    expect(vi.mocked(generateFavicons).mock.calls.at(-1)?.[0]).toMatchObject({ name: 'second.png' })
  })

  it('does not regenerate when "Upload New" picks a file that is rejected', async () => {
    vi.mocked(generateFavicons).mockClear()
    render(<FaviconGenerator />)
    fireEvent.change(screen.getByLabelText('tile upload'), { target: { files: [png('first.png')] } })
    await waitFor(() => expect(generateFavicons).toHaveBeenCalledTimes(1))

    fireEvent.click(await screen.findByRole('button', { name: 'Upload New' }))
    const picker = document.body.querySelector<HTMLInputElement>(':scope > input[type="file"]')
    await act(async () => {
      if (picker)
        fireEvent.change(picker, { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } })
    })

    expect(generateFavicons).toHaveBeenCalledTimes(1)
  })
})
