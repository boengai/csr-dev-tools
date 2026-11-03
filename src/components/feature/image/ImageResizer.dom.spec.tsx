/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ImageResizer } from './ImageResizer'

// Stand-in for the upload tile + dialog: one file input that uploads, then the dialog body.
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

/** Upload `file` and let the "Original" preview finish loading, which seeds the controls. */
const uploadAndLoad = async (file: File) => {
  fireEvent.change(screen.getByLabelText('tile upload'), { target: { files: [file] } })
  const original = await screen.findByAltText('original')
  Object.defineProperties(original, { naturalHeight: { value: 600 }, naturalWidth: { value: 800 } })
  fireEvent.load(original)
}

describe('ImageResizer', () => {
  beforeEach(() => {
    // jsdom has no encoder: let the format picker's support probe see every format.
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
      (type = 'image/png') => `data:${type};base64,`,
    )
  })

  it('explains why quality is disabled for a lossless format', async () => {
    render(<ImageResizer />)

    await uploadAndLoad(new File(['x'], 'logo.png', { type: 'image/png' }))

    expect(await screen.findByText(/PNG is lossless, so it has no quality setting/)).toBeInTheDocument()
  })

  it('shows no such note when the format has a quality setting', async () => {
    render(<ImageResizer />)

    await uploadAndLoad(new File(['x'], 'photo.jpg', { type: 'image/jpeg' }))

    expect(await screen.findByDisplayValue('800')).toBeInTheDocument()
    expect(screen.queryByText(/has no quality setting/)).toBeNull()
  })
})
