import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks/state/useToast'
import { nth } from '@/test/nth'
import type {
  FileProcessorAssetsProps,
  FileProcessorAssetsResult,
  FileProcessorDerivedInput,
  FileProcessorTextProps,
} from '@/types'
import { downloadBlob } from '@/utils/download'
import { loadImageFromBlob } from '@/utils/image'
import { buildZipBlob } from '@/utils/zip'

import { FileProcessorShell } from './FileProcessorShell'

vi.mock('@/utils/zip', () => ({ buildZipBlob: vi.fn(async () => new Blob(['zip'])) }))
vi.mock('@/utils/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/download')>()),
  downloadBlob: vi.fn(),
}))
vi.mock('@/utils/image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/image')>()),
  loadImageFromBlob: vi.fn(async (file: File) => ({ name: file.name, naturalHeight: 64, naturalWidth: 64 })),
}))

const IMAGE = { one: 'image', other: 'images' }

type Controls = { tint: string }

const png = (name = 'logo.png') => new File(['x'], name, { type: 'image/png' })

const pick = async (name: string, file: File) => {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (!input) throw new Error(`No input[name="${name}"]`)
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } })
  })
}

const settle = () => act(async () => {})

const output = () => document.querySelector<HTMLElement>('[data-slot="tool-output"]') as HTMLElement
const statusSlot = () => document.querySelector<HTMLElement>('[data-slot="tool-status"]') as HTMLElement
const toastLabels = () => useToast.getState().items.map((t) => t.label)

const assetsResult = (input: FileProcessorDerivedInput<Controls>): FileProcessorAssetsResult => ({
  assetGroups: [
    {
      assets: [
        { blob: new Blob(['a']), caption: '16x16', name: 'a.png', zipPath: 'icons/a.png' },
        { blob: new Blob(['b']), caption: '32x32', details: ['maskable'], name: 'b.png' },
      ],
      label: `Icons (${input.controls.tint})`,
    },
  ],
  textOutputs: [
    { label: 'Link tags', value: '<link />' },
    { label: 'Manifest', value: '{}', zipPath: 'manifest.json' },
  ],
})

const renderAssets = (overrides: Partial<FileProcessorAssetsProps<Controls>> = {}) => {
  const process = vi.fn(async (input: FileProcessorDerivedInput<Controls>) => assetsResult(input))
  const props: FileProcessorAssetsProps<Controls> = {
    accept: 'image/png',
    autoOpen: true,
    initialControls: { tint: 'red' },
    noun: IMAGE,
    output: 'assets',
    pendingLabel: 'Generating',
    placeholder: 'Press Generate',
    process,
    rejectToastLabel: 'Not an image',
    renderControls: ({ controls, setControls }) => (
      <button onClick={() => setControls({ tint: 'blue' })} type="button">
        {`Tint: ${controls.tint}`}
      </button>
    ),
    renderSource: ({ source }) => <p>{`Source: ${source.name}`}</p>,
    title: 'Assets',
    triggerLabel: 'Make Assets',
    uploadLabel: 'Select image',
    zipPrefix: 'assets',
    ...overrides,
  }
  render(<FileProcessorShell<Controls> {...props} />)
  return { process: (overrides.process as typeof process | undefined) ?? process }
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  useToast.setState({ items: [] })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('FileProcessorShell (assets output)', () => {
  it('opens on the upload area, then runs on upload and shows a card per asset with copyable text', async () => {
    const { process } = renderAssets()
    expect(screen.getByRole('region', { name: 'Upload area' })).toBeInTheDocument()

    await pick('image', png())
    await settle()

    expect(process).toHaveBeenCalledTimes(1)
    expect(nth(process.mock.calls, 0)[0]).toMatchObject({ controls: { tint: 'red' }, file: { name: 'logo.png' } })
    expect(screen.getByText('Source: logo.png')).toBeInTheDocument()
    const out = output()
    expect(within(out).getByRole('button', { name: 'Download a.png' })).toBeInTheDocument()
    expect(within(out).getByRole('button', { name: 'Copy Link tags to clipboard' })).toBeInTheDocument()
    expect(within(out).getByRole('button', { name: 'Download ZIP' })).toBeInTheDocument()
  })

  it('downloads one asset from its card, and zips every asset plus the zipped text from the bottom of the output', async () => {
    renderAssets()
    await pick('image', png())
    await settle()

    fireEvent.click(screen.getByRole('button', { name: 'Download b.png' }))
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'b.png')

    fireEvent.click(within(output()).getByRole('button', { name: 'Download ZIP' }))
    await settle()
    expect(Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])).toEqual([
      'icons/a.png',
      'b.png',
      'manifest.json',
    ])
    expect(vi.mocked(downloadBlob).mock.lastCall?.[1]).toMatch(/^csr-dev-tools_assets_\d+\.zip$/)
  })

  it('reruns on a control change', async () => {
    const { process } = renderAssets()
    await pick('image', png())
    await settle()

    fireEvent.click(screen.getByRole('button', { name: 'Tint: red' }))
    await settle()

    expect(process).toHaveBeenCalledTimes(2)
    expect(nth(process.mock.calls, 1)[0]).toMatchObject({ controls: { tint: 'blue' } })
  })

  it('renders several groups as tabs', async () => {
    renderAssets({
      process: vi.fn(async () => ({
        assetGroups: [
          { assets: [{ blob: new Blob(['a']), caption: 'a', name: 'a.png' }], label: 'Phones' },
          { assets: [{ blob: new Blob(['b']), caption: 'b', name: 'b.png' }], label: 'Tablets' },
        ],
      })),
    })
    await pick('image', png())
    await settle()

    expect(screen.getByRole('tab', { name: 'Phones' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tablets' })).toBeInTheDocument()
  })

  describe('with a Process button (actionLabel)', () => {
    it('waits for the button, under the input, and not for a control change', async () => {
      const { process } = renderAssets({ actionLabel: 'Generate' })
      await pick('image', png())
      await settle()

      expect(process).not.toHaveBeenCalled()
      expect(within(output()).getByText('Press Generate')).toBeInTheDocument()
      expect(within(output()).queryByRole('button', { name: 'Download ZIP' })).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: 'Tint: red' }))
      await settle()
      expect(process).not.toHaveBeenCalled()

      const input = document.querySelector<HTMLElement>('[data-slot="tool-input"]') as HTMLElement
      fireEvent.click(within(input).getByRole('button', { name: 'Generate' }))
      await settle()

      expect(process).toHaveBeenCalledTimes(1)
      expect(nth(process.mock.calls, 0)[0]).toMatchObject({ controls: { tint: 'blue' } })
      expect(within(output()).getByRole('button', { name: 'Download ZIP' })).toBeInTheDocument()
    })

    it('runs on ⌘/Ctrl+Enter once a file is added, with the key hint beside the button', async () => {
      const { process } = renderAssets({ actionLabel: 'Generate' })
      fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
      await settle()
      expect(process).not.toHaveBeenCalled()

      await pick('image', png())
      const input = document.querySelector<HTMLElement>('[data-slot="tool-input"]') as HTMLElement
      expect(input.querySelector('kbd')?.textContent).toMatch(/↵$/)

      fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
      await settle()
      expect(process).toHaveBeenCalledTimes(1)
      fireEvent.keyDown(document, { ctrlKey: true, key: 'Enter' })
      await settle()
      expect(process).toHaveBeenCalledTimes(2)
    })

    it('ignores ⌘/Ctrl+Enter while a run is in flight', async () => {
      let finish: (() => void) | undefined
      const process = vi.fn(
        (input: FileProcessorDerivedInput<Controls>) =>
          new Promise<FileProcessorAssetsResult>((resolve) => {
            finish = () => resolve(assetsResult(input))
          }),
      )
      renderAssets({ actionLabel: 'Generate', process })
      await pick('image', png())
      fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
      await settle()
      expect(process).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
      await settle()
      expect(process).toHaveBeenCalledTimes(1)
      await act(async () => finish?.())
    })

    it('has no shortcut or key hint without a Process button', async () => {
      const { process } = renderAssets()
      await pick('image', png())
      await settle()
      expect(process).toHaveBeenCalledTimes(1)
      expect(document.querySelector('[data-slot="tool-input"] kbd')).toBeNull()

      fireEvent.keyDown(document, { key: 'Enter', metaKey: true })
      await settle()
      expect(process).toHaveBeenCalledTimes(1)
    })

    it('shows the pending label with reported progress on the button while it runs', async () => {
      let finish: (() => void) | undefined
      renderAssets({
        actionLabel: 'Generate',
        process: vi.fn(
          (input: FileProcessorDerivedInput<Controls>) =>
            new Promise<FileProcessorAssetsResult>((resolve) => {
              input.report(3, 10)
              finish = () => resolve(assetsResult(input))
            }),
        ),
      })
      await pick('image', png())
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
      await settle()

      expect(screen.getByRole('button', { name: 'Generating 3/10' })).toBeDisabled()
      await act(async () => finish?.())
      expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled()
    })
  })

  it('shows a process rejection in the status slot, hides the outputs and never toasts', async () => {
    renderAssets({
      errorLabel: 'Could not make assets',
      process: vi.fn(async () => {
        throw new Error('boom')
      }),
    })
    await pick('image', png())
    await settle()

    expect(within(statusSlot()).getByRole('alert')).toHaveTextContent('Could not make assets')
    expect(within(output()).queryByRole('button', { name: /^Download/ })).toBeNull()
    expect(within(output()).getByText('Press Generate')).toBeInTheDocument()
    expect(toastLabels()).toEqual([])
  })

  it('rejects a file that fails validate with a toast, picked or dropped', async () => {
    const { process } = renderAssets()
    await pick('image', new File(['x'], 'notes.txt', { type: 'text/plain' }))
    await act(async () => {
      fireEvent.drop(screen.getByRole('region', { name: 'Upload area' }), {
        dataTransfer: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] },
      })
    })

    expect(toastLabels()).toEqual(['Not an image', 'Not an image'])
    expect(screen.getByRole('region', { name: 'Upload area' })).toBeInTheDocument()
    expect(process).not.toHaveBeenCalled()
  })

  it('toasts rejectToastLabel when the image cannot be decoded, and stays on the upload area', async () => {
    vi.mocked(loadImageFromBlob).mockRejectedValueOnce(new Error('bad image'))
    const { process } = renderAssets()
    await pick('image', png())
    await settle()

    expect(toastLabels()).toEqual(['Not an image'])
    expect(screen.getByRole('region', { name: 'Upload area' })).toBeInTheDocument()
    expect(process).not.toHaveBeenCalled()
  })

  it('"Choose another image" swaps the source, keeps the controls and reruns', async () => {
    const { process } = renderAssets()
    await pick('image', png('first.png'))
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Tint: red' }))
    await settle()

    await pick('image-replace', png('second.png'))
    await settle()

    expect(screen.getByText('Source: second.png')).toBeInTheDocument()
    expect(process.mock.lastCall?.[0]).toMatchObject({ controls: { tint: 'blue' }, file: { name: 'second.png' } })
  })

  it('returns to the upload area with the initial controls when the dialog closes', async () => {
    const onAfterClose = vi.fn()
    renderAssets({ autoOpen: false, onAfterClose })
    fireEvent.click(screen.getByRole('button', { name: 'Make Assets' }))
    await pick('image', png())
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Tint: red' }))
    await settle()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Make Assets' }))

    expect(screen.getByRole('region', { name: 'Upload area' })).toBeInTheDocument()
    await pick('image', png())
    await settle()
    expect(screen.getByRole('button', { name: 'Tint: red' })).toBeInTheDocument()
  })
})

describe('FileProcessorShell (text output)', () => {
  const renderText = (overrides: Partial<FileProcessorTextProps<Controls>> = {}) => {
    const process = vi.fn(async ({ file }: FileProcessorDerivedInput<Controls>) => ({
      textOutputs: [
        { label: 'Name', value: file.name },
        { details: '4 chars', label: 'Code', value: 'abcd' },
      ],
    }))
    render(
      <FileProcessorShell<Controls>
        accept="image/png"
        autoOpen
        noun={IMAGE}
        output="text"
        pendingLabel="Converting…"
        placeholder="Add an image"
        process={process}
        rejectToastLabel="Not an image"
        renderSource={() => null}
        title="Text"
        triggerLabel="Make Text"
        uploadLabel="Select image"
        {...overrides}
      />,
    )
    return { process }
  }

  it('shows each text block with Copy in its label and offers no download', async () => {
    renderText()
    await pick('image', png('logo.png'))
    await settle()

    const out = output()
    expect(within(out).getByText('logo.png')).toBeInTheDocument()
    expect(within(out).getByText('· 4 chars')).toBeInTheDocument()
    expect(within(out).getByRole('button', { name: 'Copy Name to clipboard' })).toBeInTheDocument()
    expect(within(out).getByRole('button', { name: 'Copy Code to clipboard' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Download/ })).toBeNull()
  })
})
