import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks/state/useToast'
import { nth } from '@/test/nth'
import type {
  FileProcessorBatchProps,
  FileProcessorControlsContext,
  FileProcessorDownloadContext,
  FileProcessorPreviewContext,
  FileProcessorSingleProps,
} from '@/types'
import { downloadBlob } from '@/utils/download'
import { buildZipBlob } from '@/utils/zip'

import { ImageIcon } from '../icon'
import { FileProcessorShell } from './FileProcessorShell'

vi.mock('@/utils/zip', () => ({ buildZipBlob: vi.fn(async () => new Blob(['zip'])) }))
vi.mock('@/utils/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/download')>()),
  downloadBlob: vi.fn(),
}))

const IMAGE = { one: 'image', other: 'images' }

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const pngFile = (name = 'photo.png'): File => new File([PNG_BYTES], name, { type: 'image/png' })

const png = (name: string, body = 'x') => new File([body], name, { type: 'image/png' })

const textFile = () => new File(['hi'], 'doc.txt', { type: 'text/plain' })

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL

/** Pick files through the hidden input named `name` (inputs are named after the shell's `noun`). */
const pick = (name: string, files: Array<File>) => {
  const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement
  if (!input) throw new Error(`No input[name="${name}"]`)
  fireEvent.change(input, { target: { files } })
}

const uploadFile = (file: File) => pick('image', [file])

const dropFiles = (files: Array<File>) => {
  fireEvent.drop(screen.getByRole('region', { name: 'Upload area' }), { dataTransfer: { files } })
}

const closeDialog = () => fireEvent.click(screen.getByRole('button', { name: /close/i }))

const closeAndReopen = (title: RegExp | string) => {
  closeDialog()
  fireEvent.click(screen.getByRole('button', { name: title }))
}

const toastLabels = () => useToast.getState().items.map((t) => t.label)

beforeEach(() => {
  useToast.setState({ items: [] })
})

afterEach(() => {
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
  vi.clearAllMocks()
})

// ─── Single file ─────────────────────────────────────────────────────────────

type TestControls = Record<string, unknown>

const echoProcess = async (file: File, _controls: TestControls): Promise<Blob> => file

const RenderShell = (overrides: Partial<FileProcessorSingleProps<TestControls>> = {}) => (
  <FileProcessorShell<TestControls>
    accept="image/png,image/jpeg,image/webp"
    autoOpen
    getDownloadFilename={() => 'out.png'}
    initialControls={{}}
    noun={IMAGE}
    process={echoProcess}
    rejectToastLabel="Not an image"
    renderControls={() => null}
    renderResult={() => null}
    renderSource={() => null}
    title="Test Shell"
    triggerLabel="Test Shell"
    uploadLabel="Select test image"
    {...overrides}
  />
)

let blobUrlCounter = 0

describe('FileProcessorShell (single)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    blobUrlCounter = 0
    URL.createObjectURL = vi.fn(() => `blob:test-${++blobUrlCounter}`)
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('tile', () => {
    it('is one plain button, labelled with the title, that opens the dialog', () => {
      render(<RenderShell autoOpen={false} />)
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.querySelector('input[type="file"]')).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: 'Test Shell' }))
      expect(screen.getByRole('heading', { name: 'Test Shell' })).toBeTruthy()
    })

    it('renders the description when provided', () => {
      render(<RenderShell autoOpen={false} description="A test description." />)
      expect(screen.getByText('A test description.')).toBeTruthy()
    })
  })

  describe('upload area', () => {
    it('fills the dialog before a file is added, with the status slot above it and no Download', () => {
      const renderControls = vi.fn(() => <div data-testid="controls-slot" />)
      render(<RenderShell renderControls={renderControls} />)
      const dialog = screen.getByRole('dialog')
      const area = within(dialog).getByRole('region', { name: 'Upload area' })
      const slot = dialog.querySelector('[data-slot="tool-status"]') as HTMLElement
      expect(slot.compareDocumentPosition(area) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(within(area).getByRole('button', { name: 'Select test image' })).toBeTruthy()
      expect(within(area).getByText('Drop an image here, or')).toBeTruthy()
      expect(screen.queryByTestId('controls-slot')).toBeNull()
      expect(screen.queryByRole('button', { name: /download/i })).toBeNull()
    })

    it('takes a dropped file', async () => {
      const process = vi.fn(echoProcess)
      render(<RenderShell process={process} />)
      dropFiles([pngFile('dropped.png')])
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect((nth(nth(process.mock.calls, 0), 0) as File).name).toBe('dropped.png')
      expect(screen.queryByRole('region', { name: 'Upload area' })).toBeNull()
    })
  })

  describe('validation', () => {
    it('rejects a file that does not match accept with a toast, and stays on the upload area', async () => {
      const process = vi.fn(echoProcess)
      render(<RenderShell process={process} />)
      uploadFile(textFile())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(process).not.toHaveBeenCalled()
      expect(toastLabels()).toContain('Not an image')
      expect(screen.getByRole('region', { name: 'Upload area' })).toBeTruthy()
    })

    it('checks dropped files too — a drop bypasses accept', () => {
      const process = vi.fn(echoProcess)
      render(<RenderShell process={process} />)
      dropFiles([new File(['x'], 'anim.gif', { type: 'image/gif' })])
      expect(process).not.toHaveBeenCalled()
      expect(toastLabels()).toContain('Not an image')
    })

    it("uses the Tool's own validate over accept", async () => {
      const process = vi.fn(echoProcess)
      render(<RenderShell process={process} validate={(f) => f.name.endsWith('.txt')} />)
      uploadFile(textFile())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(process).toHaveBeenCalledTimes(1)
      expect(toastLabels()).toEqual([])
    })
  })

  describe('errors', () => {
    it('shows a process rejection in the status slot, clears the result and offers no Download', async () => {
      const renderResult = vi.fn<(ctx: FileProcessorPreviewContext<TestControls>) => null>(() => null)
      render(
        <RenderShell process={async () => Promise.reject(new Error('decode failed'))} renderResult={renderResult} />,
      )
      uploadFile(pngFile())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      const slot = screen.getByRole('dialog').querySelector('[data-slot="tool-status"]') as HTMLElement
      expect(within(slot).getByRole('alert').textContent).toContain('decode failed')
      expect(renderResult.mock.calls.at(-1)?.[0].result).toBeNull()
      expect(screen.queryByRole('button', { name: /download/i })).toBeNull()
      expect(toastLabels()).toEqual([])
    })

    it('shows errorLabel instead of the error message when set', async () => {
      render(<RenderShell errorLabel="Try another file" process={async () => Promise.reject(new Error('x'))} />)
      uploadFile(pngFile())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(screen.getByRole('alert').textContent).toContain('Try another file')
    })
  })

  describe('layout', () => {
    it('puts the source in the input pane and the result above Download in the output pane', async () => {
      render(
        <RenderShell
          process={async () => new Blob(['x'], { type: 'image/png' })}
          renderResult={() => <p>result here</p>}
          renderSource={() => <p>source here</p>}
        />,
      )
      uploadFile(pngFile())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      const dialog = screen.getByRole('dialog')
      const input = dialog.querySelector('[data-slot="tool-input"]') as HTMLElement
      const output = dialog.querySelector('[data-slot="tool-output"]') as HTMLElement
      expect(within(input).getByText('source here')).toBeTruthy()
      expect(within(input).getByRole('button', { name: 'Choose another image' })).toBeTruthy()
      expect(within(output).getByText('result here')).toBeTruthy()
      const download = within(output).getByRole('button', { name: 'Download' })
      expect(
        within(output).getByText('result here').compareDocumentPosition(download) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('"Choose another image" swaps the source without closing', async () => {
      const process = vi.fn(echoProcess)
      render(<RenderShell process={process} />)
      uploadFile(pngFile('first.png'))
      pick('image-replace', [pngFile('second.png')])
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(nth(nth(process.mock.calls, process.mock.calls.length - 1), 0).name).toBe('second.png')
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
  })

  describe('reset on close', () => {
    it('returns to the upload area when the dialog is reopened', async () => {
      render(<RenderShell />)
      uploadFile(pngFile())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(screen.queryByRole('region', { name: 'Upload area' })).toBeNull()
      closeAndReopen('Test Shell')
      expect(screen.getByRole('region', { name: 'Upload area' })).toBeTruthy()
    })
  })
})

describe('FileProcessorShell (single) — process pipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    blobUrlCounter = 0
    URL.createObjectURL = vi.fn(() => `blob:test-${++blobUrlCounter}`)
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('invokes process with the uploaded file and current controls', async () => {
    const process = vi.fn(echoProcess)
    render(<RenderShell initialControls={{ k: 7 }} process={process} />)
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(1)
    expect(nth(nth(process.mock.calls, 0), 0)).toBeInstanceOf(File)
    expect((nth(nth(process.mock.calls, 0), 0) as File).name).toBe('photo.png')
    expect(nth(nth(process.mock.calls, 0), 1)).toEqual({ k: 7 })
  })

  it('renders renderControls inside the dialog after upload', () => {
    const renderControls = vi.fn(() => <div data-testid="controls-slot">controls here</div>)
    render(<RenderShell renderControls={renderControls} />)
    uploadFile(pngFile())
    expect(screen.getByTestId('controls-slot')).toBeTruthy()
    expect(renderControls).toHaveBeenCalled()
  })

  it('passes source File and sourceUrl to renderSource after upload', async () => {
    const renderSource = vi.fn<(ctx: FileProcessorPreviewContext<TestControls>) => null>(() => null)
    render(<RenderShell renderSource={renderSource} />)
    uploadFile(pngFile('cat.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const lastCall = renderSource.mock.calls.at(-1)
    if (!lastCall) throw new Error('renderSource not invoked')
    const ctx = lastCall[0]
    expect(ctx.source).toBeInstanceOf(File)
    expect(ctx.source.name).toBe('cat.png')
    expect(ctx.sourceUrl).toMatch(/^blob:test-/)
  })

  it('passes result and resultUrl to renderResult after process resolves', async () => {
    const resultBlob = new Blob(['xx'], { type: 'image/png' })
    const renderResult = vi.fn<(ctx: FileProcessorPreviewContext<TestControls>) => null>(() => null)
    render(<RenderShell process={async () => resultBlob} renderResult={renderResult} />)
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const lastCall = renderResult.mock.calls.at(-1)
    if (!lastCall) throw new Error('renderResult not invoked')
    const ctx = lastCall[0]
    expect(ctx.result).toBe(resultBlob)
    expect(ctx.resultUrl).toMatch(/^blob:test-/)
  })

  it('renders Download button when result is ready', async () => {
    render(<RenderShell process={async () => new Blob(['x'], { type: 'image/png' })} />)
    uploadFile(pngFile())
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
    render(<RenderShell process={slowProcess} />)
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.queryByRole('button', { name: /download/i })).toBeNull()
    resolver.resolve?.(new Blob(['x']))
  })

  it('clicking Download downloads the result under getDownloadFilename', async () => {
    const getDownloadFilename = vi.fn(
      ({ sourceName }: FileProcessorDownloadContext<TestControls>) => `out-${sourceName}`,
    )
    const resultBlob = new Blob(['x'], { type: 'image/png' })
    render(<RenderShell getDownloadFilename={getDownloadFilename} process={async () => resultBlob} />)
    uploadFile(pngFile('cat.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    fireEvent.click(screen.getByRole('button', { name: /download/i }))

    expect(getDownloadFilename).toHaveBeenCalledTimes(1)
    expect(nth(nth(getDownloadFilename.mock.calls, 0), 0).sourceName).toBe('cat.png')
    expect(downloadBlob).toHaveBeenCalledWith(resultBlob, 'out-cat.png')
  })

  it('closes the dialog when the close button is clicked', () => {
    render(<RenderShell />)
    uploadFile(pngFile())
    expect(screen.getByRole('heading', { name: 'Test Shell' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('heading', { name: 'Test Shell' })).toBeNull()
  })

  it('calls onAfterClose when the dialog closes', () => {
    const onAfterClose = vi.fn()
    render(<RenderShell onAfterClose={onAfterClose} />)
    uploadFile(pngFile())
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onAfterClose).toHaveBeenCalledTimes(1)
  })

  it('clears source after dialog closes — next upload starts fresh', async () => {
    const renderSource = vi.fn<(ctx: FileProcessorPreviewContext<TestControls>) => null>(() => null)
    render(<RenderShell renderSource={renderSource} />)
    uploadFile(pngFile('first.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    closeAndReopen('Test Shell')
    renderSource.mockClear()

    uploadFile(pngFile('second.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const lastCall = renderSource.mock.calls.at(-1)
    if (!lastCall) throw new Error('renderSource not invoked')
    expect(lastCall[0].source.name).toBe('second.png')
  })

  it('renderSource.recompute fires process again with current controls', async () => {
    const process = vi.fn(echoProcess)
    const captured: { recompute: (() => void) | null } = { recompute: null }
    const renderSource = ({ recompute }: FileProcessorPreviewContext<TestControls>) => {
      captured.recompute = recompute
      return null
    }
    render(<RenderShell initialControls={{ k: 2 }} process={process} renderSource={renderSource} />)
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(1)

    await act(async () => {
      captured.recompute?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(2)
    expect(nth(nth(process.mock.calls, 1), 1)).toEqual({ k: 2 })
  })

  it('renderControls.recompute fires process again with current controls', async () => {
    const process = vi.fn(echoProcess)
    const captured: { recompute: (() => void) | null } = { recompute: null }
    const renderControls = ({ recompute }: FileProcessorControlsContext<TestControls>) => {
      captured.recompute = recompute
      return null
    }
    render(<RenderShell initialControls={{ k: 1 }} process={process} renderControls={renderControls} />)
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(1)

    await act(async () => {
      captured.recompute?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(2)
    expect(nth(nth(process.mock.calls, 1), 1)).toEqual({ k: 1 })
  })

  it('setControls merges partial into bag, re-fires process with merged controls', async () => {
    const process = vi.fn(echoProcess)
    const captured: { setControls: ((p: Partial<{ a: number; b: number }>) => void) | null } = { setControls: null }
    const renderControls = ({ setControls }: FileProcessorControlsContext<{ a: number; b: number }>) => {
      captured.setControls = setControls
      return null
    }
    render(
      <FileProcessorShell<{ a: number; b: number }>
        accept="image/*"
        getDownloadFilename={() => 'out.png'}
        initialControls={{ a: 1, b: 2 }}
        process={process}
        renderControls={renderControls}
        renderResult={() => null}
        renderSource={() => null}
        autoOpen
        noun={IMAGE}
        title="setControls Shell"
        triggerLabel="setControls Shell"
        rejectToastLabel="Not an image"
        uploadLabel="Upload"
      />,
    )
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(nth(nth(process.mock.calls, 0), 1)).toEqual({ a: 1, b: 2 })

    await act(async () => {
      captured.setControls?.({ a: 9 })
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(2)
    expect(nth(nth(process.mock.calls, 1), 1)).toEqual({ a: 9, b: 2 })
  })

  it('setControls composes same-tick partials before re-firing process once', async () => {
    const process = vi.fn(echoProcess)
    const captured: { setControls: ((p: Partial<{ a: number; b: number }>) => void) | null } = { setControls: null }
    const renderControls = ({ setControls }: FileProcessorControlsContext<{ a: number; b: number }>) => {
      captured.setControls = setControls
      return null
    }
    render(
      <FileProcessorShell<{ a: number; b: number }>
        accept="image/*"
        getDownloadFilename={() => 'out.png'}
        initialControls={{ a: 1, b: 2 }}
        process={process}
        renderControls={renderControls}
        renderResult={() => null}
        renderSource={() => null}
        autoOpen
        noun={IMAGE}
        title="merge Shell"
        triggerLabel="merge Shell"
        rejectToastLabel="Not an image"
        uploadLabel="Upload"
      />,
    )
    uploadFile(pngFile())
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

  it('with controlsDebounceMs, processes a burst of setControls once, after the quiet period', async () => {
    const process = vi.fn(echoProcess)
    const captured: { setControls: ((p: Partial<{ a: number }>) => void) | null } = { setControls: null }
    const renderControls = ({ setControls }: FileProcessorControlsContext<{ a: number }>) => {
      captured.setControls = setControls
      return null
    }
    render(
      <FileProcessorShell<{ a: number }>
        accept="image/*"
        controlsDebounceMs={250}
        getDownloadFilename={() => 'out.png'}
        initialControls={{ a: 1 }}
        process={process}
        renderControls={renderControls}
        renderResult={() => null}
        renderSource={() => null}
        autoOpen
        noun={IMAGE}
        title="debounce Shell"
        triggerLabel="debounce Shell"
        rejectToastLabel="Not an image"
        uploadLabel="Upload"
      />,
    )
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    // An upload still processes immediately.
    expect(process).toHaveBeenCalledTimes(1)

    // Typing "1", "15", "150" into a field, 100ms apart.
    await act(async () => {
      captured.setControls?.({ a: 1 })
      await vi.advanceTimersByTimeAsync(100)
      captured.setControls?.({ a: 15 })
      await vi.advanceTimersByTimeAsync(100)
      captured.setControls?.({ a: 150 })
      await vi.advanceTimersByTimeAsync(249)
    })
    expect(process).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(process).toHaveBeenCalledTimes(2)
    expect(nth(nth(process.mock.calls, 1), 1)).toEqual({ a: 150 })
  })

  it('with controlsDebounceMs, recompute() right after setControls processes at once, and only once', async () => {
    const process = vi.fn(echoProcess)
    const captured: {
      recompute: (() => void) | null
      setControls: ((p: Partial<{ a: number }>) => void) | null
    } = { recompute: null, setControls: null }
    const renderControls = ({ recompute, setControls }: FileProcessorControlsContext<{ a: number }>) => {
      captured.recompute = recompute
      captured.setControls = setControls
      return null
    }
    render(
      <FileProcessorShell<{ a: number }>
        accept="image/*"
        controlsDebounceMs={250}
        getDownloadFilename={() => 'out.png'}
        initialControls={{ a: 1 }}
        process={process}
        renderControls={renderControls}
        renderResult={() => null}
        renderSource={() => null}
        autoOpen
        noun={IMAGE}
        title="seed Shell"
        triggerLabel="seed Shell"
        rejectToastLabel="Not an image"
        uploadLabel="Upload"
      />,
    )
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(1)

    // ImageResizer seeds its controls from <img onLoad> this way.
    await act(async () => {
      captured.setControls?.({ a: 42 })
      captured.recompute?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process).toHaveBeenCalledTimes(2)
    expect(nth(nth(process.mock.calls, 1), 1)).toEqual({ a: 42 })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(process).toHaveBeenCalledTimes(2)
  })

  it('resets controls to initialControls when the dialog closes', async () => {
    const process = vi.fn(echoProcess)
    const captured: { setControls: ((p: Partial<{ a: number }>) => void) | null } = { setControls: null }
    const renderControls = ({ setControls }: FileProcessorControlsContext<{ a: number }>) => {
      captured.setControls = setControls
      return null
    }
    render(
      <FileProcessorShell<{ a: number }>
        accept="image/*"
        getDownloadFilename={() => 'out.png'}
        initialControls={{ a: 1 }}
        process={process}
        renderControls={renderControls}
        renderResult={() => null}
        renderSource={() => null}
        autoOpen
        noun={IMAGE}
        title="reset Shell"
        triggerLabel="reset Shell"
        rejectToastLabel="Not an image"
        uploadLabel="Upload"
      />,
    )
    uploadFile(pngFile())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    await act(async () => {
      captured.setControls?.({ a: 42 })
      await vi.advanceTimersByTimeAsync(0)
    })
    closeAndReopen('reset Shell')

    // Re-upload; process should fire with reset controls
    uploadFile(pngFile('second.png'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(process.mock.calls.at(-1)?.[1]).toEqual({ a: 1 })
  })
})

// ─── Batch ───────────────────────────────────────────────────────────────────

const settle = async () => {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
}

const renderBatch = (overrides: Partial<FileProcessorBatchProps> = {}) => {
  const process = vi.fn<FileProcessorBatchProps['process']>(async (file) => ({ blob: new Blob([`out-${file.name}`]) }))
  const props: FileProcessorBatchProps = {
    accept: 'image/*',
    actionIcon: <ImageIcon />,
    actionLabel: 'Run',
    autoOpen: true,
    failureToastLabel: 'all failed',
    getOutputName: (file) => `${file.name}.out`,
    multiple: true,
    noun: IMAGE,
    previewKey: 'k',
    process,
    rejectToastLabel: 'not an image',
    settings: <span>settings slot</span>,
    title: 'Batch dialog',
    triggerLabel: 'Batch dialog',
    uploadLabel: 'Select images',
    zipPrefix: 'test',
    ...overrides,
  }
  const { rerender } = render(<FileProcessorShell {...props} />)
  return {
    process: (overrides.process as typeof process | undefined) ?? process,
    rerender: (next: Partial<FileProcessorBatchProps>) => rerender(<FileProcessorShell {...props} {...next} />),
  }
}

const runButton = () => screen.getByRole('button', { name: /^Run/ })

describe('FileProcessorShell (batch)', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:test')
    URL.revokeObjectURL = vi.fn()
  })

  it('opens on the upload area; the tile is a plain button', () => {
    renderBatch({ autoOpen: false })
    expect(document.querySelector('input[type="file"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Batch dialog' }))

    const area = screen.getByRole('region', { name: 'Upload area' })
    expect(within(area).getByText('Drop images here, or')).toBeInTheDocument()
    expect(screen.queryByText('settings slot')).toBeNull()
  })

  it('queues picked images and appends more via "Add more images"', () => {
    renderBatch()
    pick('images', [png('a.png')])
    pick('images-add', [png('b.png'), png('c.png')])

    const list = screen.getByRole('list', { name: 'Selected images' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('settings slot')).toBeInTheDocument()
    expect(runButton()).toHaveTextContent('Run 3 images')
  })

  it('queues dropped images', () => {
    renderBatch()
    dropFiles([png('a.png'), png('b.png')])

    expect(within(screen.getByRole('list', { name: 'Selected images' })).getAllByRole('listitem')).toHaveLength(2)
  })

  it('puts Process under the queue, in the input pane', () => {
    renderBatch()
    pick('images', [png('a.png')])

    const input = screen.getByRole('dialog').querySelector('[data-slot="tool-input"]') as HTMLElement
    expect(within(input).getByRole('list', { name: 'Selected images' })).toBeInTheDocument()
    expect(within(input).getByRole('button', { name: 'Run' })).toBeInTheDocument()
  })

  it('gives the same file picked twice its own row, and removes only the clicked one', () => {
    renderBatch()
    const file = png('same.png')
    pick('images', [file])
    pick('images-add', [file])

    const list = screen.getByRole('list', { name: 'Selected images' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    fireEvent.click(nth(screen.getAllByRole('button', { name: 'Remove same.png' }), 0))
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
  })

  it('skips non-image files with a toast but keeps the valid ones', () => {
    renderBatch()
    pick('images', [png('a.png'), textFile()])

    expect(toastLabels()).toContain('not an image')
    expect(within(screen.getByRole('list', { name: 'Selected images' })).getAllByRole('listitem')).toHaveLength(1)
  })

  it('skips dropped files that fail validate', () => {
    renderBatch()
    dropFiles([png('a.png'), textFile()])

    expect(toastLabels()).toContain('not an image')
    expect(within(screen.getByRole('list', { name: 'Selected images' })).getAllByRole('listitem')).toHaveLength(1)
  })

  it('returns to the upload area when the last image is removed', () => {
    renderBatch()
    pick('images', [png('a.png')])
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }))

    expect(screen.getByRole('region', { name: 'Upload area' })).toBeInTheDocument()
    pick('images', [png('b.png')])
    expect(within(screen.getByRole('list', { name: 'Selected images' })).getAllByRole('listitem')).toHaveLength(1)
  })

  it('stays on the upload area when nothing valid was picked', () => {
    renderBatch()
    pick('images', [textFile()])

    expect(screen.getByRole('region', { name: 'Upload area' })).toBeInTheDocument()
  })

  it('clears the queue when the dialog closes', () => {
    renderBatch()
    pick('images', [png('a.png'), png('b.png')])
    closeAndReopen('Batch dialog')

    expect(screen.getByRole('region', { name: 'Upload area' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Selected images' })).toBeNull()
  })

  it('lists per-file results and zips every success for "Download ZIP" at the bottom of the output', async () => {
    renderBatch()
    pick('images', [png('a.png'), png('b.png')])
    fireEvent.click(runButton())
    await settle()

    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('2 of 2 images ready')).toBeInTheDocument()
    expect(downloadBlob).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Download b.png.out' }))
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'b.png.out')

    const output = screen.getByRole('dialog').querySelector('[data-slot="tool-output"]') as HTMLElement
    fireEvent.click(within(output).getByRole('button', { name: 'Download ZIP' }))
    await settle()
    expect(Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])).toEqual(['a.png.out', 'b.png.out'])
    expect(vi.mocked(downloadBlob).mock.lastCall?.[1]).toMatch(/^csr-dev-tools_test_\d+\.zip$/)
  })

  it('dedupes output names that collide within a run', async () => {
    renderBatch()
    pick('images', [png('a.png', 'one'), png('a.png', 'two!')])
    fireEvent.click(runButton())
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Download ZIP' }))
    await settle()

    expect(Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])).toEqual(['a.png.out', 'a.png-1.out'])
  })

  it('keeps going when one file fails, lists the failure, and notes it in the status slot', async () => {
    const process = vi.fn<FileProcessorBatchProps['process']>(async (file) => {
      if (file.name === 'bad.png') throw new Error('decode error')
      return { blob: new Blob(['ok']) }
    })
    renderBatch({ process })
    pick('images', [png('a.png'), png('bad.png'), png('c.png')])
    fireEvent.click(runButton())
    await settle()

    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Failed: decode error')).toBeInTheDocument()
    expect(screen.getByText('2 of 3 images ready')).toBeInTheDocument()
    const slot = screen.getByRole('dialog').querySelector('[data-slot="tool-status"]') as HTMLElement
    expect(slot).toHaveTextContent('1 image could not be processed and is left out of the download.')
    expect(within(slot).queryByRole('alert')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Download ZIP' }))
    await settle()
    expect(Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])).toEqual(['a.png.out', 'c.png.out'])
  })

  it('toasts and returns to the queue when every file fails', async () => {
    renderBatch({ process: vi.fn(async () => Promise.reject(new Error('nope'))) })
    pick('images', [png('a.png'), png('b.png')])
    fireEvent.click(runButton())
    await settle()

    expect(toastLabels()).toContain('all failed')
    expect(runButton()).toBeInTheDocument()
  })

  it('shows a before/after comparison for a single image with one Download button', async () => {
    renderBatch()
    pick('images', [png('a.png')])
    fireEvent.click(runButton())
    await settle()

    const compare = screen.getByRole('region', { name: 'Before and after' })
    expect(within(compare).getByText('Original')).toBeInTheDocument()
    expect(within(compare).getByText('Result')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download ZIP' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'a.png.out')
  })

  it('compares whichever result the user clicks', async () => {
    renderBatch()
    pick('images', [png('a.png'), png('b.png')])
    fireEvent.click(runButton())
    await settle()

    const compare = screen.getByRole('region', { name: 'Before and after' })
    expect(within(compare).getByText(/^a\.png ·/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Compare b.png' }))
    expect(within(compare).getByText(/^b\.png ·/)).toBeInTheDocument()
  })

  it('"Change settings" returns to the queue with the same files', async () => {
    renderBatch()
    pick('images', [png('a.png'), png('b.png')])
    fireEvent.click(runButton())
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Change settings' }))

    expect(within(screen.getByRole('list', { name: 'Selected images' })).getAllByRole('listitem')).toHaveLength(2)
  })

  it('disables the run button when canProcess is false', () => {
    renderBatch({ canProcess: false })
    pick('images', [png('a.png')])

    expect(runButton()).toBeDisabled()
  })

  it('runs on ⌘+Enter and Ctrl+Enter, and shows the key hint beside the button', async () => {
    renderBatch()
    pick('images', [png('a.png'), png('b.png')])

    const input = screen.getByRole('dialog').querySelector('[data-slot="tool-input"]') as HTMLElement
    expect(input.querySelector('kbd')?.textContent).toMatch(/↵$/)

    fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
    await settle()
    expect(screen.getByText('2 of 2 images ready')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Change settings' }))
    fireEvent.keyDown(document, { ctrlKey: true, key: 'Enter' })
    await settle()
    expect(screen.getByText('2 of 2 images ready')).toBeInTheDocument()
  })

  it('ignores ⌘+Enter when canProcess is false, on the upload area, and mid-run', async () => {
    const { process, rerender } = renderBatch({ canProcess: false })
    fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
    pick('images', [png('a.png')])
    fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
    await settle()
    expect(process).not.toHaveBeenCalled()
    expect(screen.queryByText(/ready$/)).toBeNull()

    let finish: (() => void) | undefined
    const slow = vi.fn<FileProcessorBatchProps['process']>(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ blob: new Blob(['ok']) })
        }),
    )
    rerender({ canProcess: true, process: slow })
    await settle()
    slow.mockClear()
    fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
    await settle()
    expect(slow).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
    await settle()
    expect(slow).toHaveBeenCalledTimes(1)
    await act(async () => finish?.())
    await settle()
    expect(screen.getByText('1 of 1 image ready')).toBeInTheDocument()
  })

  it('names rows with the default noun when none is given', () => {
    renderBatch({ noun: undefined })
    pick('files', [png('a.png'), png('b.png')])

    expect(screen.getByRole('list', { name: 'Selected files' })).toBeInTheDocument()
    expect(runButton()).toHaveTextContent('Run 2 files')
  })

  describe('live preview', () => {
    const previewedNames = (process: { mock: { calls: Array<[File, unknown]> } }) =>
      process.mock.calls.map(([file]) => file.name)

    it('previews the first queued image with the current settings', async () => {
      const { process } = renderBatch()
      pick('images', [png('a.png'), png('b.png')])

      const panel = screen.getByRole('region', { name: 'Live preview' })
      expect(await within(panel).findByAltText('result')).toBeInTheDocument()
      expect(previewedNames(process)).toEqual(['a.png'])
      expect(screen.getByRole('button', { name: 'Preview a.png' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('previews the row the user clicks', async () => {
      const { process } = renderBatch()
      pick('images', [png('a.png'), png('b.png')])
      await waitFor(() => expect(process).toHaveBeenCalledOnce())

      fireEvent.click(screen.getByRole('button', { name: 'Preview b.png' }))

      await waitFor(() => expect(previewedNames(process)).toEqual(['a.png', 'b.png']))
      expect(screen.getByRole('button', { name: 'Preview b.png' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('re-renders the preview when the settings change', async () => {
      const { process, rerender } = renderBatch()
      pick('images', [png('a.png')])
      await waitFor(() => expect(process).toHaveBeenCalledOnce())

      rerender({ previewKey: 'k2' })

      await waitFor(() => expect(process).toHaveBeenCalledTimes(2))
    })

    it('waits for settings that allow a run before previewing', async () => {
      const { process, rerender } = renderBatch({ canProcess: false })
      pick('images', [png('a.png')])

      expect(screen.getByText('Choose the options above to see a preview.')).toBeInTheDocument()
      await settle()
      expect(process).not.toHaveBeenCalled()

      rerender({ canProcess: true, previewKey: 'k2' })
      await waitFor(() => expect(process).toHaveBeenCalledOnce())
    })

    it('shows a preview failure in the status slot without a toast', async () => {
      renderBatch({ process: vi.fn(async () => Promise.reject(new Error('bad pixels'))) })
      pick('images', [png('a.png')])

      const slot = screen.getByRole('dialog').querySelector('[data-slot="tool-status"]') as HTMLElement
      expect(await within(slot).findByText('Preview failed: bad pixels')).toBeInTheDocument()
      expect(within(slot).getByRole('alert')).toBeInTheDocument()
      expect(useToast.getState().items).toEqual([])
    })
  })
})
