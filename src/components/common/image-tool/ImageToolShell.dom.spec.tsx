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

type TestControls = Record<string, unknown>

const echoProcess = async (file: File, _controls: TestControls): Promise<Blob> => file

const RenderShell = (overrides: Partial<React.ComponentProps<typeof ImageToolShell<TestControls>>> = {}) => (
  <ImageToolShell<TestControls>
    accept="image/png,image/jpeg,image/webp"
    getDownloadFilename={() => 'out.png'}
    initialControls={{}}
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
    const { container } = render(<RenderShell initialControls={{ k: 7 }} process={process} />)
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
    const renderPreview = vi.fn((_: ImageToolShellPreviewContext<TestControls>) => null)
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
    const renderPreview = vi.fn((_: ImageToolShellPreviewContext<TestControls>) => null)
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
    const getDownloadFilename = vi.fn(
      ({ sourceName }: ImageToolShellDownloadContext<TestControls>) => `out-${sourceName}`,
    )
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

  it('calls onAfterClose when the dialog closes', () => {
    const onAfterClose = vi.fn()
    const { container } = render(<RenderShell onAfterClose={onAfterClose} />)
    uploadFile(container, pngFile())
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onAfterClose).toHaveBeenCalledTimes(1)
  })

  it('clears source after dialog closes — next upload starts fresh', async () => {
    const renderPreview = vi.fn((_: ImageToolShellPreviewContext<TestControls>) => null)
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
    const renderPreview = ({ recompute }: ImageToolShellPreviewContext<TestControls>) => {
      captured.recompute = recompute
      return null
    }
    const { container } = render(
      <RenderShell initialControls={{ k: 2 }} process={process} renderPreview={renderPreview} />,
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
    const renderControls = ({ recompute }: ImageToolShellControlsContext<TestControls>) => {
      captured.recompute = recompute
      return null
    }
    const { container } = render(
      <RenderShell initialControls={{ k: 1 }} process={process} renderControls={renderControls} />,
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

  it('setControls merges partial into bag, re-fires process with merged controls', async () => {
    const process = vi.fn(echoProcess)
    const captured: { setControls: ((p: Partial<{ a: number; b: number }>) => void) | null } = { setControls: null }
    const renderControls = ({ setControls }: ImageToolShellControlsContext<{ a: number; b: number }>) => {
      captured.setControls = setControls
      return null
    }
    const { container } = render(
      <ImageToolShell<{ a: number; b: number }>
        accept="image/*"
        getDownloadFilename={() => 'out.png'}
        initialControls={{ a: 1, b: 2 }}
        process={process}
        renderControls={renderControls}
        renderPreview={() => null}
        title="setControls Shell"
        uploadLabel="Upload"
      />,
    )
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process.mock.calls[0][1]).toEqual({ a: 1, b: 2 })

    await act(async () => {
      captured.setControls?.({ a: 9 })
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(2)
    expect(process.mock.calls[1][1]).toEqual({ a: 9, b: 2 })
  })

  it('setControls composes same-tick partials before re-firing process once', async () => {
    const process = vi.fn(echoProcess)
    const captured: { setControls: ((p: Partial<{ a: number; b: number }>) => void) | null } = { setControls: null }
    const renderControls = ({ setControls }: ImageToolShellControlsContext<{ a: number; b: number }>) => {
      captured.setControls = setControls
      return null
    }
    const { container } = render(
      <ImageToolShell<{ a: number; b: number }>
        accept="image/*"
        getDownloadFilename={() => 'out.png'}
        initialControls={{ a: 1, b: 2 }}
        process={process}
        renderControls={renderControls}
        renderPreview={() => null}
        title="merge Shell"
        uploadLabel="Upload"
      />,
    )
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(1)

    await act(async () => {
      captured.setControls?.({ a: 9 })
      captured.setControls?.({ b: 8 })
      await vi.advanceTimersByTimeAsync(0)
    })
    // setInputImmediate fires per call, but the pipeline's stale-safety drops
    // the older one; the surviving call sees both partials merged.
    const lastCall = process.mock.calls.at(-1)
    if (!lastCall) throw new Error('process not invoked')
    expect(lastCall[1]).toEqual({ a: 9, b: 8 })
  })

  it('resets controls to initialControls when the dialog closes', async () => {
    const process = vi.fn(echoProcess)
    const captured: { setControls: ((p: Partial<{ a: number }>) => void) | null } = { setControls: null }
    const renderControls = ({ setControls }: ImageToolShellControlsContext<{ a: number }>) => {
      captured.setControls = setControls
      return null
    }
    const { container } = render(
      <ImageToolShell<{ a: number }>
        accept="image/*"
        getDownloadFilename={() => 'out.png'}
        initialControls={{ a: 1 }}
        process={process}
        renderControls={renderControls}
        renderPreview={() => null}
        title="reset Shell"
        uploadLabel="Upload"
      />,
    )
    uploadFile(container, pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    await act(async () => {
      captured.setControls?.({ a: 42 })
      await vi.advanceTimersByTimeAsync(0)
    })
    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    // Re-upload; process should fire with reset controls
    uploadFile(container, pngFile('second.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process.mock.calls.at(-1)?.[1]).toEqual({ a: 1 })
  })
})
