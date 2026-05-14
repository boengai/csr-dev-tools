/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UploadDialogFrame } from './UploadDialogFrame'

const fileOf = (name: string, type = 'image/png') => new File(['x'], name, { type })

const renderFrame = (overrides: Partial<Parameters<typeof UploadDialogFrame>[0]> = {}) =>
  render(
    <UploadDialogFrame
      accept="image/*"
      buttonLabel="Select image"
      description="The thing this tool does"
      onUpload={() => undefined}
      title="Image Tool"
      uploadInputName="upload-test"
      {...overrides}
    >
      <p>dialog body</p>
    </UploadDialogFrame>,
  )

describe('UploadDialogFrame', () => {
  it('renders the description and upload tile; dialog body hidden until openDialog', () => {
    renderFrame()
    expect(screen.getByText('The thing this tool does')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Select image' })).toBeTruthy()
    expect(screen.queryByText('dialog body')).toBeNull()
  })

  it('calls onUpload with selected files and an openDialog callback; dialog stays closed until called', () => {
    const onUpload = vi.fn<(files: Array<File>, openDialog: () => void) => void>()
    const { container } = renderFrame({ onUpload })

    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [fileOf('a.png')] } })

    expect(onUpload).toHaveBeenCalledTimes(1)
    expect(onUpload.mock.calls[0][0][0].name).toBe('a.png')
    expect(typeof onUpload.mock.calls[0][1]).toBe('function')

    // openDialog has not been called → dialog body still hidden
    expect(screen.queryByText('dialog body')).toBeNull()
  })

  it('opens the dialog when openDialog is called from onUpload', () => {
    const onUpload = vi.fn((_files: Array<File>, openDialog: () => void) => {
      openDialog()
    })
    const { container } = renderFrame({ onUpload })

    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [fileOf('a.png')] } })

    expect(screen.getByText('dialog body')).toBeTruthy()
  })

  it('chains onReset then onAfterClose on dialog close', () => {
    const onReset = vi.fn()
    const onAfterClose = vi.fn()
    const onUpload = (_files: Array<File>, openDialog: () => void) => openDialog()

    const { container } = renderFrame({ onAfterClose, onReset, onUpload })

    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [fileOf('a.png')] } })

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onAfterClose).toHaveBeenCalledTimes(1)
    expect(onReset.mock.invocationCallOrder[0]).toBeLessThan(onAfterClose.mock.invocationCallOrder[0])
  })

  it('omits the description when not provided', () => {
    const { container } = renderFrame({ description: undefined })
    expect(container.querySelectorAll('p').length).toBe(0)
  })

  it('passes accept and multiple through to the underlying file input', () => {
    const { container } = renderFrame({ accept: 'image/png', multiple: true })
    const input = container.querySelector('input[type="file"]')!
    expect(input.getAttribute('accept')).toBe('image/png')
    expect(input.hasAttribute('multiple')).toBe(true)
  })
})
