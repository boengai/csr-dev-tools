/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ImageToolShellControlsContext,
  ImageToolShellDownloadContext,
  ImageToolShellPreviewContext,
} from '@/types'

import { ImageToolShell } from './ImageToolShell'

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const pngFile = (name = 'photo.png'): File => new File([PNG_BYTES], name, { type: 'image/png' })

const echoProcess = async (file: File, _controls: unknown): Promise<Blob> => file

const RenderShell = (overrides: Partial<React.ComponentProps<typeof ImageToolShell<undefined>>> = {}) => (
  <ImageToolShell
    accept="image/png,image/jpeg,image/webp"
    controls={undefined}
    getDownloadFilename={() => 'out.png'}
    process={echoProcess}
    renderControls={() => null}
    renderPreview={() => null}
    title="Test Shell"
    uploadLabel="Select test image"
    {...overrides}
  />
)

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL
let blobUrlCounter = 0

beforeEach(() => {
  vi.useFakeTimers()
  blobUrlCounter = 0
  URL.createObjectURL = vi.fn(() => `blob:test-${++blobUrlCounter}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
})

const uploadFile = (container: HTMLElement, file: File) => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
  fireEvent.change(input)
}

describe('ImageToolShell — closed state', () => {
  it('renders the upload button with the given uploadLabel', () => {
    render(<RenderShell />)
    expect(screen.getByRole('button', { name: 'Select test image' })).toBeTruthy()
  })

  it('renders the description when provided', () => {
    render(<RenderShell description="A test description." />)
    expect(screen.getByText('A test description.')).toBeTruthy()
  })

  it('does not render the dialog before a file is uploaded', () => {
    render(<RenderShell />)
    expect(screen.queryByRole('heading', { name: 'Test Shell' })).toBeNull()
  })
})

describe('ImageToolShell — upload + dialog', () => {
  it('opens the dialog when a valid file is uploaded', () => {
    const { container } = render(<RenderShell />)
    uploadFile(container, pngFile())
    expect(screen.getByRole('heading', { name: 'Test Shell' })).toBeTruthy()
  })
})

describe('ImageToolShell — MIME validation', () => {
  it('does not open dialog or call process for a non-image file', async () => {
    const process = vi.fn(echoProcess)
    const { container } = render(<RenderShell process={process} />)
    const txt = new File(['hi'], 'doc.txt', { type: 'text/plain' })
    uploadFile(container, txt)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Test Shell' })).toBeNull()
  })

  it('calls onRejectInvalidFile with the rejected file', () => {
    const onRejectInvalidFile = vi.fn()
    const { container } = render(<RenderShell onRejectInvalidFile={onRejectInvalidFile} />)
    const txt = new File(['hi'], 'doc.txt', { type: 'text/plain' })
    uploadFile(container, txt)
    expect(onRejectInvalidFile).toHaveBeenCalledTimes(1)
    expect((onRejectInvalidFile.mock.calls[0][0] as File).name).toBe('doc.txt')
  })

  it('does not call onRejectInvalidFile for a valid image', () => {
    const onRejectInvalidFile = vi.fn()
    const { container } = render(<RenderShell onRejectInvalidFile={onRejectInvalidFile} />)
    uploadFile(container, pngFile())
    expect(onRejectInvalidFile).not.toHaveBeenCalled()
  })
})

describe('ImageToolShell — process pipeline', () => {
  it('invokes process with the uploaded file and current controls', async () => {
    const process = vi.fn(echoProcess)
    const { container } = render(<RenderShell controls={{ k: 7 } as never} process={process} />)
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(1)
    expect(process.mock.calls[0][0]).toBeInstanceOf(File)
    expect((process.mock.calls[0][0] as File).name).toBe('photo.png')
    expect(process.mock.calls[0][1]).toEqual({ k: 7 })
  })

  it('renders renderControls inside the dialog after upload', () => {
    const renderControls = vi.fn(() => <div data-testid="controls-slot">controls here</div>)
    const { container } = render(<RenderShell renderControls={renderControls} />)
    uploadFile(container, pngFile())
    expect(screen.getByTestId('controls-slot')).toBeTruthy()
    expect(renderControls).toHaveBeenCalled()
  })

  it('passes source File and sourceUrl to renderPreview after upload', async () => {
    const renderPreview = vi.fn((_: ImageToolShellPreviewContext) => null)
    const { container } = render(<RenderShell renderPreview={renderPreview} />)
    uploadFile(container, pngFile('cat.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const lastCall = renderPreview.mock.calls.at(-1)
    if (!lastCall) throw new Error('renderPreview not invoked')
    const ctx = lastCall[0]
    expect(ctx.source).toBeInstanceOf(File)
    expect(ctx.source.name).toBe('cat.png')
    expect(ctx.sourceUrl).toMatch(/^blob:test-/)
  })

  it('passes result and resultUrl to renderPreview after process resolves', async () => {
    const resultBlob = new Blob(['xx'], { type: 'image/png' })
    const renderPreview = vi.fn((_: ImageToolShellPreviewContext) => null)
    const { container } = render(<RenderShell process={async () => resultBlob} renderPreview={renderPreview} />)
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const lastCall = renderPreview.mock.calls.at(-1)
    if (!lastCall) throw new Error('renderPreview not invoked')
    const ctx = lastCall[0]
    expect(ctx.result).toBe(resultBlob)
    expect(ctx.resultUrl).toMatch(/^blob:test-/)
  })

  it('renders Download button when result is ready', async () => {
    const { container } = render(<RenderShell process={async () => new Blob(['x'], { type: 'image/png' })} />)
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByRole('button', { name: /download/i })).toBeTruthy()
  })

  it('does not render Download button before result is ready', async () => {
    const resolver: { resolve: ((b: Blob) => void) | null } = { resolve: null }
    const slowProcess = (): Promise<Blob> =>
      new Promise<Blob>((resolve) => {
        resolver.resolve = resolve
      })
    const { container } = render(<RenderShell process={slowProcess} />)
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.queryByRole('button', { name: /download/i })).toBeNull()
    resolver.resolve?.(new Blob(['x']))
  })

  it('clicking Download invokes getDownloadFilename and triggers download anchor', async () => {
    const getDownloadFilename = vi.fn(({ sourceName }: ImageToolShellDownloadContext) => `out-${sourceName}`)
    const { container } = render(
      <RenderShell
        getDownloadFilename={getDownloadFilename}
        process={async () => new Blob(['x'], { type: 'image/png' })}
      />,
    )
    uploadFile(container, pngFile('cat.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    const anchorClicks: Array<{ download: string }> = []
    const origCreate = document.createElement.bind(document)
    document.createElement = ((tag: string) => {
      const el = origCreate(tag)
      if (tag.toLowerCase() === 'a') {
        const a = el as HTMLAnchorElement
        a.click = () => anchorClicks.push({ download: a.download })
      }
      return el
    }) as typeof document.createElement

    try {
      fireEvent.click(screen.getByRole('button', { name: /download/i }))
    } finally {
      document.createElement = origCreate
    }

    expect(getDownloadFilename).toHaveBeenCalledTimes(1)
    expect(getDownloadFilename.mock.calls[0][0].sourceName).toBe('cat.png')
    expect(anchorClicks).toHaveLength(1)
    expect(anchorClicks[0].download).toBe('out-cat.png')
  })

  it('closes the dialog when the close button is clicked', () => {
    const { container } = render(<RenderShell />)
    uploadFile(container, pngFile())
    expect(screen.getByRole('heading', { name: 'Test Shell' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('heading', { name: 'Test Shell' })).toBeNull()
  })

  it('calls onAfterDialogClose when the dialog closes', () => {
    const onAfterDialogClose = vi.fn()
    const { container } = render(<RenderShell onAfterDialogClose={onAfterDialogClose} />)
    uploadFile(container, pngFile())
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onAfterDialogClose).toHaveBeenCalledTimes(1)
  })

  it('clears source after dialog closes — next upload starts fresh', async () => {
    const renderPreview = vi.fn((_: ImageToolShellPreviewContext) => null)
    const { container } = render(<RenderShell renderPreview={renderPreview} />)
    uploadFile(container, pngFile('first.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    renderPreview.mockClear()

    uploadFile(container, pngFile('second.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const lastCall = renderPreview.mock.calls.at(-1)
    if (!lastCall) throw new Error('renderPreview not invoked')
    expect(lastCall[0].source.name).toBe('second.png')
  })

  it('renderPreview.recompute fires process again with current controls', async () => {
    const process = vi.fn(echoProcess)
    const captured: { recompute: (() => void) | null } = { recompute: null }
    const renderPreview = ({ recompute }: ImageToolShellPreviewContext) => {
      captured.recompute = recompute
      return null
    }
    const { container } = render(
      <RenderShell controls={{ k: 2 } as never} process={process} renderPreview={renderPreview} />,
    )
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(1)

    await act(async () => {
      captured.recompute?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(2)
    expect(process.mock.calls[1][1]).toEqual({ k: 2 })
  })

  it('renderControls.recompute fires process again with current controls', async () => {
    const process = vi.fn(echoProcess)
    const captured: { recompute: (() => void) | null } = { recompute: null }
    const renderControls = ({ recompute }: ImageToolShellControlsContext) => {
      captured.recompute = recompute
      return null
    }
    const { container } = render(
      <RenderShell controls={{ k: 1 } as never} process={process} renderControls={renderControls} />,
    )
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(1)

    await act(async () => {
      captured.recompute?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(2)
    expect(process.mock.calls[1][1]).toEqual({ k: 1 })
  })
})
