/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CssFormatter } from '@/components/feature/code/CssFormatter'
import type { TransformerField, TransformerImage } from '@/types'

import { FieldForm } from '../form'
import { TransformerShell } from './TransformerShell'

const downloadBlob = vi.fn()
const downloadDataUrl = vi.fn()

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  downloadBlob: (...args: Array<unknown>) => downloadBlob(...args),
  downloadDataUrl: (...args: Array<unknown>) => downloadDataUrl(...args),
}))

type Bag = { key: string; source: string }

const BASE = {
  autoOpen: true,
  resultPlaceholder: 'Type something to see it here',
  sourceKind: 'textarea' as const,
  sourceLabel: 'Source',
  sourcePlaceholder: 'type here',
  title: 'Test Tool',
  triggerLabel: 'Open',
}

const flush = async (ms = 1) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const typeSource = (value: string) => fireEvent.change(screen.getByLabelText('Source'), { target: { value } })

const output = () => {
  const out = document.querySelector<HTMLElement>('[data-slot="tool-output"]')
  if (!out) throw new Error('no output region')
  return out
}

beforeAll(() => {
  // CodeMirror measures text ranges; jsdom has no layout.
  Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
})

beforeEach(() => {
  localStorage.clear()
  downloadBlob.mockReset()
  downloadDataUrl.mockReset()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TransformerShell — text output (default)', () => {
  it('shows the placeholder, then the result as you type', async () => {
    render(
      <TransformerShell<{ source: string }>
        {...BASE}
        compute={({ source }) => source.toUpperCase()}
        initial={{ source: '' }}
        storageKey="test-text"
      />,
    )
    expect(output().dataset.outputKind).toBe('text')
    expect(output().hasAttribute('data-has-value')).toBe(false)
    expect(within(output()).getByText('Type something to see it here')).toBeTruthy()

    typeSource('abc')
    await flush(300)

    expect(within(output()).getByText('ABC')).toBeTruthy()
    expect(output().hasAttribute('data-has-value')).toBe(true)
    expect(within(output()).getByRole('button', { name: 'Copy Result to clipboard' })).toBeTruthy()
  })

  it('shows a rejection in the status slot and clears the output', async () => {
    render(
      <TransformerShell<{ source: string }>
        {...BASE}
        compute={({ source }) => {
          if (source === 'bad') throw new Error('bad input')
          return source.toUpperCase()
        }}
        initial={{ source: '' }}
        storageKey="test-text-error"
      />,
    )
    typeSource('ok')
    await flush(300)
    expect(within(output()).getByText('OK')).toBeTruthy()

    typeSource('bad')
    await flush(300)

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe('bad input')
    expect(alert.closest('[data-slot="tool-status"]')).not.toBeNull()
    expect(within(output()).queryByText('OK')).toBeNull()
    expect(within(output()).getByText('Type something to see it here')).toBeTruthy()
  })

  it('takes resultLabel as a function of the inputs', async () => {
    localStorage.setItem('test-label', JSON.stringify({ key: 'SHA-1', source: 'x' }))
    render(
      <TransformerShell<Bag>
        {...BASE}
        compute={({ source }) => source}
        initial={{ key: 'SHA-1', source: '' }}
        resultLabel={({ key }) => `${key} Hash`}
        storageKey="test-label"
      />,
    )
    await flush()
    expect(within(output()).getByRole('button', { name: 'Copy SHA-1 Hash to clipboard' })).toBeTruthy()
  })
})

describe('TransformerShell — controls', () => {
  it('debounces setFields from a controls text box (one compute per pause, not per keystroke)', async () => {
    localStorage.setItem('test-controls', JSON.stringify({ key: '', source: 'msg' }))
    const compute = vi.fn(({ key, source }: Bag) => (key ? `${key}:${source}` : ''))
    render(
      <TransformerShell<Bag>
        {...BASE}
        compute={compute}
        initial={{ key: '', source: '' }}
        renderControls={({ inputs, setFields }) => (
          <FieldForm
            label="Key"
            name="key"
            onChange={(val: string) => setFields({ key: val })}
            type="text"
            value={inputs.key}
          />
        )}
        storageKey="test-controls"
      />,
    )
    await flush()
    compute.mockClear()

    const key = screen.getByLabelText('Key')
    fireEvent.change(key, { target: { value: 'k' } })
    fireEvent.change(key, { target: { value: 'ke' } })
    fireEvent.change(key, { target: { value: 'key' } })
    await flush(100)
    expect(compute).not.toHaveBeenCalled()

    await flush(300)
    expect(compute).toHaveBeenCalledTimes(1)
    expect(within(output()).getByText('key:msg')).toBeTruthy()
  })

  it('clears source and clearOnReset fields on close, keeping other controls', async () => {
    localStorage.setItem('test-reset', JSON.stringify({ key: 'secret', mode: 'b', source: 'msg' }))
    render(
      <TransformerShell<Bag & { mode: string }>
        {...BASE}
        clearOnReset={{ key: '' }}
        compute={({ key, source }) => `${key}:${source}`}
        initial={{ key: '', mode: 'a', source: '' }}
        renderControls={({ inputs }) => (
          <span data-testid="state">{`${inputs.mode}|${inputs.key}|${inputs.source}`}</span>
        )}
        storageKey="test-reset"
      />,
    )
    await flush()
    expect(screen.getByTestId('state').textContent).toBe('b|secret|msg')

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(screen.getByTestId('state').textContent).toBe('b||')
  })
})

describe('TransformerShell — damaged saved input', () => {
  it('keeps the good fields: a saved tab indent still formats beside a bad mode', async () => {
    // The formatter reads its wasm from disk.
    vi.useRealTimers()
    localStorage.setItem('csr-dev-tools-css-formatter', JSON.stringify({ indent: 'tab', mode: 7, source: 'a{b:c}' }))
    render(<CssFormatter autoOpen />)

    await waitFor(() => expect(output().querySelector('pre')?.textContent).toContain('a {\n\tb: c'))
  })
})

describe('TransformerShell — persistence opt-out', () => {
  it('writes nothing to localStorage with persistInput={false}', async () => {
    render(
      <TransformerShell<Bag>
        {...BASE}
        compute={({ source }) => source}
        initial={{ key: '', source: '' }}
        persistInput={false}
      />,
    )
    typeSource('secret message')
    await flush(1000)
    expect(localStorage.length).toBe(0)
  })
})

describe('TransformerShell — notices', () => {
  it('renders notices for a valid result in the status slot', async () => {
    localStorage.setItem('test-notices', JSON.stringify({ source: 'a\nb' }))
    render(
      <TransformerShell<{ source: string }>
        {...BASE}
        compute={({ source }) => source}
        initial={{ source: '' }}
        notices={(result) => (result.includes('\n') ? ['Multi-line input'] : [])}
        storageKey="test-notices"
      />,
    )
    await flush()
    const status = screen.getByRole('status')
    expect(status.textContent).toBe('Multi-line input')
    expect(status.closest('[data-slot="tool-status"]')).not.toBeNull()
  })
})

describe('TransformerShell — fields output', () => {
  const FIELDS: Array<TransformerField> = [
    { label: 'Upper', value: 'ABC' },
    { copy: false, label: 'Length', value: '3' },
  ]

  it('shows the placeholder while empty, then one row per field with Copy unless copy: false', async () => {
    render(
      <TransformerShell<{ source: string }, 'fields'>
        {...BASE}
        compute={() => FIELDS}
        initial={{ source: '' }}
        outputKind="fields"
        resultLabel="Results"
        storageKey="test-fields"
      />,
    )
    expect(output().dataset.outputKind).toBe('fields')
    expect(within(output()).getByText('Type something to see it here')).toBeTruthy()

    typeSource('abc')
    await flush(300)

    expect(output().hasAttribute('data-has-value')).toBe(true)
    expect(within(output()).getByText('ABC')).toBeTruthy()
    expect(within(output()).getByRole('button', { name: 'Copy Upper to clipboard' })).toBeTruthy()
    expect(within(output()).getByText('3')).toBeTruthy()
    expect(within(output()).queryByRole('button', { name: 'Copy Length to clipboard' })).toBeNull()
  })

  it('clears the rows on error', async () => {
    render(
      <TransformerShell<{ source: string }, 'fields'>
        {...BASE}
        compute={({ source }) => {
          if (source === 'bad') throw new Error('nope')
          return FIELDS
        }}
        initial={{ source: '' }}
        outputKind="fields"
        storageKey="test-fields-error"
      />,
    )
    typeSource('abc')
    await flush(300)
    expect(within(output()).getByText('ABC')).toBeTruthy()

    typeSource('bad')
    await flush(300)
    expect(screen.getByRole('alert').textContent).toBe('nope')
    expect(within(output()).queryByText('ABC')).toBeNull()
    expect(output().hasAttribute('data-has-value')).toBe(false)
  })
  it('copies copyValue instead of the shown value, and offers copyAll in the label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(
      <TransformerShell<{ source: string }, 'fields'>
        {...BASE}
        compute={() => [{ copyValue: '{"a":1}', label: 'Payload', value: 'a: 1 (annotated)' }]}
        copyAll={(fields) => fields.map((f) => f.copyValue).join('\n')}
        initial={{ source: '' }}
        outputKind="fields"
        resultLabel="Decoded"
        storageKey="test-fields-copy"
      />,
    )
    // No rows yet: nothing to copy all of.
    expect(within(output()).queryByRole('button', { name: 'Copy Decoded to clipboard' })).toBeNull()

    typeSource('x')
    await flush(300)

    expect(within(output()).getByText('a: 1 (annotated)')).toBeTruthy()
    fireEvent.click(within(output()).getByRole('button', { name: 'Copy Payload to clipboard' }))
    expect(writeText).toHaveBeenLastCalledWith('{"a":1}')
    fireEvent.click(within(output()).getByRole('button', { name: 'Copy Decoded to clipboard' }))
    expect(writeText).toHaveBeenLastCalledWith('{"a":1}')
  })

  it('requires outputKind for a non-text kind (type-level)', () => {
    const missingKind = (
      // @ts-expect-error — `outputKind` is required once K is not 'text'.
      <TransformerShell<{ source: string }, 'fields'>
        {...BASE}
        compute={() => FIELDS}
        initial={{ source: '' }}
        storageKey="test-fields-kind"
      />
    )
    expect(missingKind).toBeTruthy()
  })
})

describe('TransformerShell — markup output', () => {
  it('renders sanitised markup and copies what is shown, not the raw source', async () => {
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(
      <TransformerShell<{ source: string }, 'markup'>
        {...BASE}
        compute={({ source }) => source}
        initial={{ source: '' }}
        outputKind="markup"
        resultLabel="Preview"
        storageKey="test-markup"
      />,
    )
    expect(within(output()).getByText('Type something to see it here')).toBeTruthy()

    typeSource('<h1>Hello</h1><script>window.pwned = true</script><img src="x" onerror="alert(1)">')
    await flush(300)

    expect(within(output()).getByRole('heading', { name: 'Hello' })).toBeTruthy()
    expect(output().querySelector('script')).toBeNull()
    expect(output().querySelector('img')?.getAttribute('onerror')).toBeNull()
    fireEvent.click(within(output()).getByRole('button', { name: 'Copy Preview to clipboard' }))
    const copied = (writeText.mock.calls[0] as unknown as [string])[0]
    expect(copied).toContain('<h1>Hello</h1>')
    expect(copied).not.toContain('<script')
    expect(copied).not.toContain('onerror')
  })

  it('puts Download icon buttons in the label, disabled while empty', async () => {
    const file = vi.fn(() => new Blob(['<svg></svg>'], { type: 'image/svg+xml' }))
    render(
      <TransformerShell<{ source: string }, 'markup'>
        {...BASE}
        compute={({ source }) => source}
        downloads={() => [{ file, filename: 'out.svg', label: 'SVG' }]}
        initial={{ source: '' }}
        outputKind="markup"
        persistInput={false}
        resultLabel="Preview"
      />,
    )
    expect(within(output()).getByRole('button', { name: 'Download SVG' }).hasAttribute('disabled')).toBe(true)

    typeSource('<svg><circle r="4"/></svg>')
    await flush(300)
    const download = within(output()).getByRole('button', { name: 'Download SVG' })
    expect(download.hasAttribute('disabled')).toBe(false)
    // In the label: before the rendered markup.
    const circle = output().querySelector('circle')
    expect(circle && download.compareDocumentPosition(circle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    fireEvent.click(download)
    await flush()
    expect(file).toHaveBeenCalledTimes(1)
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'out.svg')
  })

  it('renders sanitised SVG', async () => {
    render(
      <TransformerShell<{ source: string }, 'markup'>
        {...BASE}
        compute={({ source }) => source}
        initial={{ source: '' }}
        outputKind="markup"
        storageKey="test-svg"
      />,
    )
    typeSource('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle r="4"/></svg>')
    await flush(300)

    // The first <svg> in the pane is the Copy icon; find the rendered one by its content.
    const svg = output().querySelector('circle')?.closest('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('onload')).toBeNull()
  })
})

describe('TransformerShell — image output', () => {
  const IMAGE: TransformerImage = { alt: 'QR code', filename: 'qr.png', src: 'data:image/png;base64,AAAA' }

  it('shows the placeholder and a disabled Download, then the preview with Download at the bottom', async () => {
    render(
      <TransformerShell<{ source: string }, 'image'>
        {...BASE}
        compute={() => IMAGE}
        initial={{ source: '' }}
        outputKind="image"
        resultLabel="QR Code"
        storageKey="test-image"
      />,
    )
    const download = within(output()).getByRole('button', { name: 'Download QR Code' })
    expect(download.hasAttribute('disabled')).toBe(true)
    expect(within(output()).getByText('Type something to see it here')).toBeTruthy()

    typeSource('hello')
    await flush(300)

    const img = within(output()).getByRole('img', { name: 'QR code' })
    expect(img.getAttribute('src')).toBe(IMAGE.src)
    const enabled = within(output()).getByRole('button', { name: 'Download QR Code' })
    // Download sits below the preview.
    expect(img.compareDocumentPosition(enabled) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    fireEvent.click(enabled)
    expect(downloadDataUrl).toHaveBeenCalledWith(IMAGE.src, 'qr.png')
  })

  it('clears the preview on error', async () => {
    render(
      <TransformerShell<{ source: string }, 'image'>
        {...BASE}
        compute={({ source }) => {
          if (source === 'bad') throw new Error('cannot render')
          return IMAGE
        }}
        initial={{ source: '' }}
        outputKind="image"
        storageKey="test-image-error"
      />,
    )
    typeSource('ok')
    await flush(300)
    expect(within(output()).queryByRole('img')).not.toBeNull()

    typeSource('bad')
    await flush(300)
    expect(screen.getByRole('alert').textContent).toBe('cannot render')
    expect(within(output()).queryByRole('img')).toBeNull()
  })
})

describe('TransformerShell — image with a text form (imageCopyLabel)', () => {
  it('puts Copy and an icon Download in the label, with no Download under the preview', async () => {
    render(
      <TransformerShell<{ source: string }, 'image'>
        {...BASE}
        compute={() => ({ alt: 'QR code', copy: '<svg/>', filename: 'qr.png', src: 'data:image/png;base64,AAAA' })}
        imageCopyLabel="SVG"
        initial={{ source: '' }}
        outputKind="image"
        persistInput={false}
        resultLabel="QR Code"
      />,
    )
    // Same buttons on the empty state, disabled.
    expect(within(output()).getByRole('button', { name: 'Copy SVG to clipboard' }).hasAttribute('disabled')).toBe(true)
    expect(within(output()).getByRole('button', { name: 'Download QR Code' }).hasAttribute('disabled')).toBe(true)

    typeSource('hello')
    await flush(300)

    const img = within(output()).getByRole('img', { name: 'QR code' })
    const downloads = within(output()).getAllByRole('button', { name: 'Download QR Code' })
    expect(downloads).toHaveLength(1)
    expect((downloads[0] as HTMLElement).compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(output()).getByRole('button', { name: 'Copy SVG to clipboard' }).hasAttribute('disabled')).toBe(false)
  })
})

describe('TransformerShell — second source input', () => {
  type Pair = { other: string; source: string }

  it('waits for both inputs, computes from both, and clears both on close', async () => {
    const compute = vi.fn(({ other, source }: Pair) => `${source}+${other}`)
    render(
      <TransformerShell<Pair>
        {...BASE}
        compute={compute}
        initial={{ other: '', source: '' }}
        persistInput={false}
        secondSource={{ field: 'other', kind: 'textarea', label: 'Other', placeholder: 'other here' }}
      />,
    )
    typeSource('a')
    await flush(300)
    // A blank second source is "not ready yet": placeholder, no error, no compute.
    expect(compute).not.toHaveBeenCalled()
    expect(within(output()).getByText('Type something to see it here')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Other'), { target: { value: 'b' } })
    await flush(300)
    expect(output().textContent).toContain('a+b')

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    await flush(300)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await flush()
    expect((screen.getByLabelText('Source') as HTMLTextAreaElement).value).toBe('')
    expect((screen.getByLabelText('Other') as HTMLTextAreaElement).value).toBe('')
  })
})

describe('TransformerShell — error action', () => {
  it('offers the fix beside the error and applies its patch', async () => {
    render(
      <TransformerShell<{ source: string }>
        {...BASE}
        compute={({ source }) => {
          if (source === 'bad') throw new Error('it is bad')
          return source
        }}
        errorAction={(error, { source }) =>
          error instanceof Error && source === 'bad' ? { label: 'Make it good', patch: { source: 'good' } } : null
        }
        initial={{ source: '' }}
        persistInput={false}
      />,
    )
    typeSource('bad')
    await flush(300)
    const slot = document.querySelector<HTMLElement>('[data-slot="tool-status"]')
    if (!slot) throw new Error('no status slot')
    expect(within(slot).getByRole('alert').textContent).toBe('it is bad')

    fireEvent.click(within(slot).getByRole('button', { name: 'Make it good' }))
    await flush()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(output().textContent).toContain('good')
  })
})

describe('TransformerShell — prefill', () => {
  it('applies the prefill once over the restored input', async () => {
    localStorage.setItem('test-prefill', JSON.stringify({ source: 'restored' }))
    const prefill = vi.fn(() => ({ source: 'handed over' }))
    render(
      <TransformerShell<{ source: string }>
        {...BASE}
        compute={({ source }) => source.toUpperCase()}
        initial={{ source: '' }}
        prefill={prefill}
        storageKey="test-prefill"
      />,
    )
    await flush(300)
    expect(prefill).toHaveBeenCalledTimes(1)
    expect(output().textContent).toContain('HANDED OVER')
  })
})
