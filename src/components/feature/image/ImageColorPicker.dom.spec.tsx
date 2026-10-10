/** @vitest-environment jsdom */
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { type ReactNode, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ImageColorPicker } from './ImageColorPicker'

const drawImage = vi.fn()

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  getReadableContext2d: vi.fn(() => ({ drawImage })),
  loadImageFromBlob: vi.fn(async () => ({ naturalHeight: 20, naturalWidth: 40 })),
}))

// Stand-in for the dialog frame that lets the test unmount and remount the
// dialog body without resetting the Tool's state — the same thing that
// happens when the dialog content is torn down and reopened while the
// uploaded image is still held.
const frame: { toggle: () => void } = { toggle: () => undefined }
vi.mock('@/components/common/dialog/ToolDialogFrame', () => ({
  ToolDialogFrame: ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(true)
    frame.toggle = () => setOpen((prev) => !prev)
    return open ? <div>{children}</div> : null
  },
}))

const getCanvas = () => document.querySelector('canvas')

const upload = () => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } })
}

describe('ImageColorPicker', () => {
  beforeEach(() => {
    drawImage.mockClear()
  })

  it('draws the uploaded image onto the canvas', async () => {
    render(<ImageColorPicker autoOpen />)
    upload()
    await waitFor(() => expect(getCanvas()?.width).toBe(40))
    expect(drawImage).toHaveBeenCalledTimes(1)
  })

  it('redraws the image when the dialog body remounts with the image kept', async () => {
    render(<ImageColorPicker autoOpen />)
    upload()
    await waitFor(() => expect(getCanvas()?.width).toBe(40))
    const firstCanvas = getCanvas()

    act(() => frame.toggle())
    expect(getCanvas()).toBeNull()
    act(() => frame.toggle())

    await waitFor(() => {
      const canvas = getCanvas()
      expect(canvas).not.toBe(firstCanvas)
      expect(canvas?.width).toBe(40)
    })
    expect(drawImage).toHaveBeenCalledTimes(2)
  })
})
