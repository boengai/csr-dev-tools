/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks/state/useToast'
import { nth } from '@/test/nth'

import { useBatchAssetPipeline } from './useBatchAssetPipeline'

vi.mock('@/utils/image', async () => {
  const actual = await vi.importActual<typeof import('@/utils/image')>('@/utils/image')
  return {
    ...actual,
    loadImageFromBlob: vi.fn(async (file: File) => {
      const img = new Image()
      Object.defineProperty(img, 'width', { value: 1024, configurable: true })
      Object.defineProperty(img, 'height', { value: 1024, configurable: true })
      Object.defineProperty(img, 'src', { value: `mock://${file.name}`, configurable: true })
      return img
    }),
  }
})

vi.mock('@/utils/download', () => ({
  downloadBlob: vi.fn(),
}))

vi.mock('@/utils/zip', () => ({
  buildZipBlob: vi.fn(async () => new Blob()),
}))

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL
let urlCounter = 0

beforeEach(() => {
  urlCounter = 0
  URL.createObjectURL = vi.fn((blob: Blob) => `blob:test-${blob.size}-${++urlCounter}`)
  URL.revokeObjectURL = vi.fn()
  useToast.setState({ items: [] })
})

afterEach(() => {
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
  vi.clearAllMocks()
  // A failed picker test must not leave its hidden input for the next one.
  for (const input of document.body.querySelectorAll(':scope > input[type="file"]')) input.remove()
})

/** Open the picker, fire `event` on its hidden input, and return what the picker resolved with. */
const pick = async (
  result: { current: { openFilePicker: () => Promise<boolean> } },
  fire: (input: HTMLInputElement) => void,
): Promise<boolean | undefined> => {
  let picking: Promise<boolean> | undefined
  act(() => {
    picking = result.current.openFilePicker()
  })
  const input = document.body.querySelector<HTMLInputElement>(':scope > input[type="file"]')
  let ok: boolean | undefined
  await act(async () => {
    if (input) fire(input)
    ok = await picking
  })
  return ok
}

const imageFile = (name = 'a.png') => new File(['x'], name, { type: 'image/png' })
const textFile = (name = 'a.txt') => new File(['x'], name, { type: 'text/plain' })

const OPTIONS = {
  accept: 'image/*',
  failureToastLabel: 'Failed to generate',
  mimePrefix: 'image/',
  rejectToastLabel: 'Please select an image',
  successToastLabel: 'Generated',
}

describe('useBatchAssetPipeline', () => {
  it('exposes empty initial state', () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    expect(result.current.sourceFile).toBeNull()
    expect(result.current.sourceImage).toBeNull()
    expect(result.current.sourcePreview).toBeNull()
    expect(result.current.results).toBeNull()
    expect(result.current.pending).toBe(false)
    expect(result.current.progress).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('upload() decodes the file, sets source state, and does not toast success', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.upload([imageFile('icon.png')])
    })

    expect(ok).toBe(true)
    expect(result.current.sourceFile?.name).toBe('icon.png')
    expect(result.current.sourceImage).not.toBeNull()
    expect(result.current.sourcePreview).toMatch(/^blob:test-/)
    expect(useToast.getState().items).toHaveLength(0)
  })

  it('upload() with a non-matching MIME emits the reject toast and leaves state untouched', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.upload([textFile()])
    })

    expect(ok).toBe(false)
    expect(result.current.sourceFile).toBeNull()
    expect(result.current.sourceImage).toBeNull()
    const toasts = useToast.getState().items
    expect(toasts).toHaveLength(1)
    expect(nth(toasts, 0).label).toBe('Please select an image')
    expect(nth(toasts, 0).type).toBe('error')
  })

  it('upload() with an empty array is a no-op', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.upload([])
    })

    expect(ok).toBe(false)
    expect(result.current.sourceFile).toBeNull()
    expect(useToast.getState().items).toHaveLength(0)
  })

  it('regenerate() runs process, populates results, fires the success toast', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<string>>(OPTIONS))

    await act(async () => {
      await result.current.upload([imageFile()])
    })

    await act(async () => {
      await result.current.regenerate(async () => ['a', 'b'])
    })

    expect(result.current.results).toEqual(['a', 'b'])
    expect(result.current.pending).toBe(false)
    expect(result.current.error).toBeNull()
    const toasts = useToast.getState().items
    expect(toasts.find((t) => t.label === 'Generated')).toBeDefined()
  })

  it('regenerate() is a no-op without a sourceImage', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<string>>(OPTIONS))
    const process = vi.fn(async () => ['x'])

    await act(async () => {
      await result.current.regenerate(process)
    })

    expect(process).not.toHaveBeenCalled()
    expect(result.current.results).toBeNull()
    expect(result.current.pending).toBe(false)
  })

  it('upload() then regenerate() in the same handler tick sees the freshly-decoded image', async () => {
    // Regression: when both calls happen in one React event without an
    // intervening commit, the second call's closure must still see the image
    // from the first call. The hook uses a ref-tracked shadow of sourceImage
    // so the synchronous read in regenerate() doesn't lag behind setState.
    const { result } = renderHook(() => useBatchAssetPipeline<Array<string>>(OPTIONS))
    const process = vi.fn(async () => ['ok'])

    await act(async () => {
      await result.current.upload([imageFile()])
      await result.current.regenerate(process)
    })

    expect(process).toHaveBeenCalledTimes(1)
    expect(result.current.results).toEqual(['ok'])
  })

  it('upload() returns false and toasts when decoding fails', async () => {
    const { loadImageFromBlob } = await import('@/utils/image')
    vi.mocked(loadImageFromBlob).mockRejectedValueOnce(new Error('bad image'))
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.upload([imageFile()])
    })

    expect(ok).toBe(false)
    expect(result.current.sourceFile).toBeNull()
    expect(nth(useToast.getState().items, 0).label).toBe('Please select an image')
  })

  it('upload() of a new image drops the results of a regenerate still running on the old one', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))

    await act(async () => {
      await result.current.upload([imageFile('old.png')])
    })

    let releaseSlow: (() => void) | null = null
    const slow = new Promise<string>((resolve) => {
      releaseSlow = () => resolve('from-old-image')
    })

    await act(async () => {
      void result.current.regenerate(() => slow)
    })
    expect(result.current.pending).toBe(true)

    await act(async () => {
      await result.current.upload([imageFile('new.png')])
    })
    expect(result.current.sourceFile?.name).toBe('new.png')
    expect(result.current.pending).toBe(false)

    await act(async () => {
      releaseSlow?.()
      await slow
    })

    expect(result.current.results).toBeNull()
  })

  it('regenerate() drops the result of a stale call when a newer one starts', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))

    await act(async () => {
      await result.current.upload([imageFile()])
    })

    let releaseSlow: (() => void) | null = null
    const slow = new Promise<string>((resolve) => {
      releaseSlow = () => resolve('slow')
    })

    await act(async () => {
      // Kick the slow regenerate without awaiting.
      void result.current.regenerate(() => slow)
      // Then a fast regenerate that wins.
      await result.current.regenerate(async () => 'fast')
    })

    expect(result.current.results).toBe('fast')

    await act(async () => {
      releaseSlow?.()
      await slow
    })

    // Stale 'slow' must not overwrite 'fast'.
    expect(result.current.results).toBe('fast')
  })

  it('regenerate() drops a stale progress report', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))

    await act(async () => {
      await result.current.upload([imageFile()])
    })

    let staleReport: ((c: number, t: number) => void) | null = null
    const slow = new Promise<string>(() => {
      // never resolves on its own; we'll just trigger a stale report
    })

    await act(async () => {
      void result.current.regenerate((_, report) => {
        staleReport = report
        return slow
      })
      // Newer regenerate starts; old session's report calls must be ignored.
      await result.current.regenerate(async () => 'new')
    })

    expect(result.current.results).toBe('new')

    await act(async () => {
      staleReport?.(5, 10)
    })

    expect(result.current.progress).toBeNull()
  })

  it('regenerate() reports progress for the active session', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))

    await act(async () => {
      await result.current.upload([imageFile()])
    })

    let captureReport: ((c: number, t: number) => void) | null = null
    let releaseDone: ((v: string) => void) | null = null
    const done = new Promise<string>((resolve) => {
      releaseDone = resolve
    })

    await act(async () => {
      void result.current.regenerate((_, report) => {
        captureReport = report
        return done
      })
    })

    expect(result.current.pending).toBe(true)

    await act(async () => {
      captureReport?.(3, 7)
    })

    expect(result.current.progress).toEqual({ current: 3, total: 7 })

    await act(async () => {
      releaseDone?.('done')
      await done
    })

    expect(result.current.progress).toBeNull()
    expect(result.current.pending).toBe(false)
  })

  it('regenerate() fires the failure toast and stores error when process throws', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))

    await act(async () => {
      await result.current.upload([imageFile()])
    })

    await act(async () => {
      await result.current.regenerate(async () => {
        throw new Error('boom')
      })
    })

    expect(result.current.results).toBeNull()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.pending).toBe(false)
    const toasts = useToast.getState().items
    expect(toasts.find((t) => t.label === 'Failed to generate')).toBeDefined()
  })

  it('downloadOne forwards to downloadBlob', async () => {
    const downloadModule = await import('@/utils/download')
    const { result } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))
    const blob = new Blob(['x'])

    act(() => {
      result.current.downloadOne(blob, 'one.png')
    })

    expect(downloadModule.downloadBlob).toHaveBeenCalledWith(blob, 'one.png')
  })

  it('downloadAll builds a zip via buildZipBlob and forwards the result to downloadBlob', async () => {
    const downloadModule = await import('@/utils/download')
    const zipModule = await import('@/utils/zip')
    const { result } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))
    const blobs = { 'a.png': new Blob(['a']), 'b.png': new Blob(['b']) }

    await act(async () => {
      await result.current.downloadAll('assets.zip', blobs)
    })

    expect(zipModule.buildZipBlob).toHaveBeenCalledWith(blobs)
    expect(downloadModule.downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'assets.zip')
  })

  it('openFilePicker() resolves true once the picked file is uploaded, so callers can regenerate', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    let picking: Promise<boolean> | undefined
    act(() => {
      picking = result.current.openFilePicker()
    })
    const input = document.body.querySelector<HTMLInputElement>(':scope > input[type="file"]')
    expect(input?.accept).toBe('image/*')
    let ok: boolean | undefined
    await act(async () => {
      if (input) fireEvent.change(input, { target: { files: [imageFile('new.png')] } })
      ok = await picking
    })

    expect(ok).toBe(true)
    expect(result.current.sourceFile?.name).toBe('new.png')
    expect(document.body.querySelector(':scope > input[type="file"]')).toBeNull()
  })

  it('openFilePicker() resolves false when the picker is cancelled', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    let picking: Promise<boolean> | undefined
    act(() => {
      picking = result.current.openFilePicker()
    })
    const input = document.body.querySelector<HTMLInputElement>(':scope > input[type="file"]')
    let ok: boolean | undefined
    await act(async () => {
      if (input) fireEvent(input, new Event('cancel'))
      ok = await picking
    })

    expect(ok).toBe(false)
    expect(result.current.sourceFile).toBeNull()
    expect(document.body.querySelector(':scope > input[type="file"]')).toBeNull()
  })

  it('openFilePicker() resolves false for a picked file upload() rejects, so callers do not regenerate', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    const ok = await pick(result, (input) => fireEvent.change(input, { target: { files: [textFile('notes.txt')] } }))

    expect(ok).toBe(false)
    expect(result.current.sourceFile).toBeNull()
    expect(document.body.querySelector(':scope > input[type="file"]')).toBeNull()
  })

  it('openFilePicker() resolves false for an empty selection', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    const ok = await pick(result, (input) => fireEvent.change(input, { target: { files: [] } }))

    expect(ok).toBe(false)
    expect(document.body.querySelector(':scope > input[type="file"]')).toBeNull()
  })

  it('openFilePicker() resolves only after the picked image is decoded and stored', async () => {
    const { loadImageFromBlob } = await import('@/utils/image')
    let finishDecode: (() => void) | undefined
    const decoded = Object.assign(new Image(), { id: 'slow' })
    vi.mocked(loadImageFromBlob).mockImplementationOnce(
      () => new Promise<HTMLImageElement>((resolve) => (finishDecode = () => resolve(decoded))),
    )
    const { result } = renderHook(() => useBatchAssetPipeline<Array<Blob>>(OPTIONS))

    let picking: Promise<boolean> | undefined
    act(() => {
      picking = result.current.openFilePicker()
    })
    const input = document.body.querySelector<HTMLInputElement>(':scope > input[type="file"]')
    let settled = false
    void picking?.then(() => (settled = true))
    await act(async () => {
      if (input) fireEvent.change(input, { target: { files: [imageFile('slow.png')] } })
    })
    // A caller that regenerates now would still read the previous source.
    expect(settled).toBe(false)

    let ok: boolean | undefined
    await act(async () => {
      finishDecode?.()
      ok = await picking
    })
    expect(ok).toBe(true)
    expect(result.current.sourceImage).toBe(decoded)
  })

  it('reset() clears all state', async () => {
    const { result } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))

    await act(async () => {
      await result.current.upload([imageFile()])
    })
    await act(async () => {
      await result.current.regenerate(async () => 'r')
    })

    expect(result.current.results).toBe('r')

    act(() => {
      result.current.reset()
    })

    expect(result.current.sourceFile).toBeNull()
    expect(result.current.sourceImage).toBeNull()
    expect(result.current.sourcePreview).toBeNull()
    expect(result.current.results).toBeNull()
    expect(result.current.progress).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.pending).toBe(false)
  })

  it('does not write state after unmount', async () => {
    const { result, unmount } = renderHook(() => useBatchAssetPipeline<string>(OPTIONS))

    await act(async () => {
      await result.current.upload([imageFile()])
    })

    let release: ((v: string) => void) | null = null
    const pending = new Promise<string>((resolve) => {
      release = resolve
    })

    act(() => {
      void result.current.regenerate(() => pending)
    })

    unmount()

    // Resolving after unmount must not throw or warn.
    await act(async () => {
      release?.('late')
      await pending
    })
  })
})
