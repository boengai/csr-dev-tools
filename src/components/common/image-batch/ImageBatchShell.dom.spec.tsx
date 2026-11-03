import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks/state/useToast'
import { nth } from '@/test/nth'
import type { ImageBatchShellProps } from '@/types'
import { downloadBlob } from '@/utils/download'
import { buildZipBlob } from '@/utils/zip'

import { ImageIcon } from '../icon'
import { ImageBatchShell } from './ImageBatchShell'

vi.mock('@/utils/zip', () => ({ buildZipBlob: vi.fn(async () => new Blob(['zip'])) }))
vi.mock('@/utils/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/download')>()),
  downloadBlob: vi.fn(),
}))

const png = (name: string, body = 'x') => new File([body], name, { type: 'image/png' })

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL

const upload = (name: 'images' | 'images-add', files: Array<File>) => {
  const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement
  fireEvent.change(input, { target: { files } })
}

const settle = async () => {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
}

const renderShell = (overrides: Partial<ImageBatchShellProps> = {}) => {
  const process = vi.fn<ImageBatchShellProps['process']>(async (file) => ({ blob: new Blob([`out-${file.name}`]) }))
  const props: ImageBatchShellProps = {
    accept: 'image/*',
    actionIcon: <ImageIcon />,
    actionLabel: 'Run',
    failureToastLabel: 'all failed',
    getOutputName: (file) => `${file.name}.out`,
    previewKey: 'k',
    process,
    rejectToastLabel: 'not an image',
    settings: <span>settings slot</span>,
    title: 'Batch dialog',
    uploadLabel: 'Select images',
    zipPrefix: 'test',
    ...overrides,
  }
  const { rerender } = render(<ImageBatchShell {...props} />)
  return {
    process: (overrides.process as typeof process | undefined) ?? process,
    rerender: (next: Partial<ImageBatchShellProps>) => rerender(<ImageBatchShell {...props} {...next} />),
  }
}

const runButton = () => screen.getByRole('button', { name: /^Run/ })

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

describe('ImageBatchShell', () => {
  it('queues picked images and appends more via "Add more images"', () => {
    renderShell()
    upload('images', [png('a.png')])
    upload('images-add', [png('b.png'), png('c.png')])

    const list = screen.getByRole('list', { name: 'Selected images' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('settings slot')).toBeInTheDocument()
    expect(runButton()).toHaveTextContent('Run 3 images')
  })

  it('gives the same file picked twice its own row, and removes only the clicked one', () => {
    renderShell()
    const file = png('same.png')
    upload('images', [file])
    upload('images-add', [file])

    const list = screen.getByRole('list', { name: 'Selected images' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    fireEvent.click(nth(screen.getAllByRole('button', { name: 'Remove same.png' }), 0))
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
  })

  it('skips non-image files with a toast but keeps the valid ones', () => {
    renderShell()
    upload('images', [png('a.png'), new File(['x'], 'notes.txt', { type: 'text/plain' })])

    expect(useToast.getState().items.map((t) => t.label)).toContain('not an image')
    expect(within(screen.getByRole('list', { name: 'Selected images' })).getAllByRole('listitem')).toHaveLength(1)
  })

  it('opens the dialog on upload and shows an empty state when the last image is removed', () => {
    renderShell()
    upload('images', [png('a.png')])
    expect(screen.getByRole('dialog', { name: 'Batch dialog' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }))

    expect(screen.getByText('No images selected.')).toBeInTheDocument()
    upload('images-add', [png('b.png')])
    expect(within(screen.getByRole('list', { name: 'Selected images' })).getAllByRole('listitem')).toHaveLength(1)
  })

  it('keeps the dialog closed when nothing valid was picked', () => {
    renderShell()
    upload('images', [new File(['x'], 'notes.txt', { type: 'text/plain' })])

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('lists per-file results and zips every success for "Download all"', async () => {
    renderShell()
    upload('images', [png('a.png'), png('b.png')])
    fireEvent.click(runButton())
    await settle()

    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('listitem')).toHaveLength(2)
    expect(downloadBlob).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Download b.png.out' }))
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'b.png.out')

    fireEvent.click(screen.getByRole('button', { name: 'Download ZIP' }))
    await settle()
    expect(Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])).toEqual(['a.png.out', 'b.png.out'])
    expect(vi.mocked(downloadBlob).mock.lastCall?.[1]).toMatch(/^csr-dev-tools_test_\d+\.zip$/)
  })

  it('dedupes output names that collide within a run', async () => {
    renderShell()
    upload('images', [png('a.png', 'one'), png('a.png', 'two!')])
    fireEvent.click(runButton())
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Download ZIP' }))
    await settle()

    expect(Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])).toEqual(['a.png.out', 'a.png-1.out'])
  })

  it('keeps going when one file fails and lists the failure', async () => {
    const process = vi.fn<ImageBatchShellProps['process']>(async (file) => {
      if (file.name === 'bad.png') throw new Error('decode error')
      return { blob: new Blob(['ok']) }
    })
    renderShell({ process })
    upload('images', [png('a.png'), png('bad.png'), png('c.png')])
    fireEvent.click(runButton())
    await settle()

    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Failed: decode error')).toBeInTheDocument()
    expect(screen.getByText(/2 of 3 images ready · 1 failed/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Download ZIP' }))
    await settle()
    expect(Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])).toEqual(['a.png.out', 'c.png.out'])
  })

  it('toasts and returns to the queue when every file fails', async () => {
    renderShell({ process: vi.fn(async () => Promise.reject(new Error('nope'))) })
    upload('images', [png('a.png'), png('b.png')])
    fireEvent.click(runButton())
    await settle()

    expect(useToast.getState().items.map((t) => t.label)).toContain('all failed')
    expect(runButton()).toBeInTheDocument()
  })

  it('shows a before/after comparison for a single image with one Download button', async () => {
    renderShell()
    upload('images', [png('a.png')])
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
    renderShell()
    upload('images', [png('a.png'), png('b.png')])
    fireEvent.click(runButton())
    await settle()

    const compare = screen.getByRole('region', { name: 'Before and after' })
    expect(within(compare).getByText(/^a\.png ·/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Compare b.png' }))
    expect(within(compare).getByText(/^b\.png ·/)).toBeInTheDocument()
  })

  it('"Change settings" returns to the queue with the same files', async () => {
    renderShell()
    upload('images', [png('a.png'), png('b.png')])
    fireEvent.click(runButton())
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Change settings' }))

    expect(within(screen.getByRole('list', { name: 'Selected images' })).getAllByRole('listitem')).toHaveLength(2)
  })

  it('disables the run button when canProcess is false', () => {
    renderShell({ canProcess: false })
    upload('images', [png('a.png')])

    expect(runButton()).toBeDisabled()
  })

  describe('live preview', () => {
    const previewedNames = (process: { mock: { calls: Array<[File, unknown]> } }) =>
      process.mock.calls.map(([file]) => file.name)

    it('previews the first queued image with the current settings', async () => {
      const { process } = renderShell()
      upload('images', [png('a.png'), png('b.png')])

      const panel = screen.getByRole('region', { name: 'Live preview' })
      expect(await within(panel).findByAltText('result')).toBeInTheDocument()
      expect(previewedNames(process)).toEqual(['a.png'])
      expect(screen.getByRole('button', { name: 'Preview a.png' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('previews the row the user clicks', async () => {
      const { process } = renderShell()
      upload('images', [png('a.png'), png('b.png')])
      await waitFor(() => expect(process).toHaveBeenCalledOnce())

      fireEvent.click(screen.getByRole('button', { name: 'Preview b.png' }))

      await waitFor(() => expect(previewedNames(process)).toEqual(['a.png', 'b.png']))
      expect(screen.getByRole('button', { name: 'Preview b.png' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('re-renders the preview when the settings change', async () => {
      const { process, rerender } = renderShell()
      upload('images', [png('a.png')])
      await waitFor(() => expect(process).toHaveBeenCalledOnce())

      rerender({ previewKey: 'k2' })

      await waitFor(() => expect(process).toHaveBeenCalledTimes(2))
    })

    it('waits for settings that allow a run before previewing', async () => {
      const { process, rerender } = renderShell({ canProcess: false })
      upload('images', [png('a.png')])

      expect(screen.getByText('Choose the options above to see a preview.')).toBeInTheDocument()
      await settle()
      expect(process).not.toHaveBeenCalled()

      rerender({ canProcess: true, previewKey: 'k2' })
      await waitFor(() => expect(process).toHaveBeenCalledOnce())
    })

    it('shows a preview failure inline without a toast', async () => {
      renderShell({ process: vi.fn(async () => Promise.reject(new Error('bad pixels'))) })
      upload('images', [png('a.png')])

      expect(await screen.findByText('Preview failed: bad pixels')).toBeInTheDocument()
      expect(useToast.getState().items).toEqual([])
    })
  })
})
