import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks'
import type { GeneratorOptionsCtx, GeneratorRun } from '@/types'

import { GeneratorShell } from './GeneratorShell'

type Opts = { seed: string; upper: boolean }

const INITIAL: Opts = { seed: 'a', upper: false }

const Options = ({ options, setOptions, setOptionsDebounced }: GeneratorOptionsCtx<Opts>) => (
  <>
    <input aria-label="Seed" onChange={(e) => setOptionsDebounced({ seed: e.target.value })} value={options.seed} />
    <button aria-pressed={options.upper} onClick={() => setOptions({ upper: !options.upper })} type="button">
      Upper
    </button>
  </>
)

const flush = async (ms = 1) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const output = () => document.querySelector<HTMLElement>('[data-slot="tool-output"]')

const renderText = (
  compute: (o: Opts) => Promise<string> | string,
  run: GeneratorRun = { generateLabel: 'Generate', mode: 'random' },
) =>
  render(
    <GeneratorShell
      compute={compute}
      initial={INITIAL}
      output={{ kind: 'text', label: 'Result', placeholder: 'Nothing yet' }}
      renderOptions={(ctx) => <Options {...ctx} />}
      run={run}
      title="Test Generator"
      triggerLabel="Open"
    />,
  )

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open' }))
  await flush()
}

const modEnter = (key: 'ctrlKey' | 'metaKey') => fireEvent.keyDown(document, { [key]: true, key: 'Enter' })

beforeEach(() => {
  localStorage.clear()
  useToast.setState({ items: [] })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GeneratorShell — random mode', () => {
  it('does not run until the dialog opens, then runs once', async () => {
    const compute = vi.fn((o: Opts) => `${o.seed}-1`)
    renderText(compute)
    await flush(500)
    expect(compute).not.toHaveBeenCalled()

    await open()
    expect(compute).toHaveBeenCalledTimes(1)
    expect(output()?.textContent).toContain('a-1')
    expect(output()?.hasAttribute('data-has-value')).toBe(true)
  })

  it('reruns on Generate, ⌘+Enter and Ctrl+Enter', async () => {
    let n = 0
    const compute = vi.fn(() => `value-${++n}`)
    renderText(compute)
    await open()

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    await flush()
    expect(output()?.textContent).toContain('value-2')

    modEnter('metaKey')
    await flush()
    modEnter('ctrlKey')
    await flush()
    expect(compute).toHaveBeenCalledTimes(4)
    expect(output()?.textContent).toContain('value-4')
  })

  it('reruns at once on a toggle, and once per pause when typing', async () => {
    const compute = vi.fn((o: Opts) => (o.upper ? o.seed.toUpperCase() : o.seed))
    renderText(compute)
    await open()

    fireEvent.click(screen.getByRole('button', { name: 'Upper' }))
    await flush()
    expect(compute).toHaveBeenCalledTimes(2)
    expect(output()?.textContent).toContain('A')

    const seed = screen.getByRole('textbox', { name: 'Seed' })
    fireEvent.change(seed, { target: { value: 'ab' } })
    await flush(100)
    fireEvent.change(seed, { target: { value: 'abc' } })
    await flush(100)
    expect(compute).toHaveBeenCalledTimes(2)
    await flush(300)
    expect(compute).toHaveBeenCalledTimes(3)
    expect(output()?.textContent).toContain('ABC')
  })

  it('shows the shortcut hint beside the Generate button', async () => {
    renderText(() => 'x')
    await open()
    expect(screen.getByText(/↵$/)).toBeTruthy()
  })
})

describe('GeneratorShell — slow runs', () => {
  it('shows a busy, disabled button with elapsed time and ignores ⌘+Enter until done', async () => {
    let resolve: (v: string) => void = () => undefined
    const compute = vi.fn(
      () =>
        new Promise<string>((r) => {
          resolve = r
        }),
    )
    renderText(compute, { generateLabel: 'Generate', mode: 'random', slow: true })
    await open()

    const busy = screen.getByRole('button', { name: /^Generating…/ })
    expect(busy).toBeDisabled()
    await flush(250)
    expect(busy.textContent).toMatch(/Generating… 0\.[1-9]s/)
    expect(output()?.hasAttribute('data-has-value')).toBe(false)

    modEnter('metaKey')
    await flush()
    expect(compute).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolve('done')
    })
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled()
    expect(output()?.textContent).toContain('done')
  })
})

describe('GeneratorShell — live mode', () => {
  it('has no Generate button or shortcut, and reruns on every option change', async () => {
    const compute = vi.fn((o: Opts) => (o.upper ? 'UP' : 'down'))
    renderText(compute, { mode: 'live' })
    await open()
    expect(output()?.textContent).toContain('down')
    expect(screen.queryByRole('button', { name: 'Generate' })).toBeNull()

    modEnter('metaKey')
    await flush()
    expect(compute).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Upper' }))
    await flush()
    expect(output()?.textContent).toContain('UP')
  })
})

describe('GeneratorShell — errors', () => {
  it('shows a rejection in the status slot, clears the output and does not toast', async () => {
    const compute = vi.fn((o: Opts) => {
      if (o.upper) throw new Error('Bad options')
      return 'fine'
    })
    renderText(compute)
    await open()
    expect(output()?.textContent).toContain('fine')

    fireEvent.click(screen.getByRole('button', { name: 'Upper' }))
    await flush()

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe('Bad options')
    expect(alert.closest('[data-slot="tool-status"]')).not.toBeNull()
    expect(output()?.hasAttribute('data-has-value')).toBe(false)
    expect(output()?.textContent).toContain('Nothing yet')
    expect(useToast.getState().items).toEqual([])
  })
})

describe('GeneratorShell — output kinds', () => {
  it('list: Copy all in the label and Copy per row', async () => {
    render(
      <GeneratorShell
        compute={() => ['one', 'two']}
        initial={INITIAL}
        output={{ itemLabel: 'item', kind: 'list', label: 'Items', placeholder: 'None' }}
        renderOptions={(ctx) => <Options {...ctx} />}
        run={{ generateLabel: 'Generate', mode: 'random' }}
        title="List"
        triggerLabel="Open"
      />,
    )
    await open()
    expect(screen.getByText('Items (2)')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy all Items to clipboard' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Copy item 1 to clipboard' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy item 2 to clipboard' })).toBeTruthy()
  })

  it('files: Copy in each block label, a Download per file and Download all at the bottom', async () => {
    render(
      <GeneratorShell
        compute={() => [
          { filename: 'a.txt', label: 'File A', value: 'aaa' },
          { filename: 'b.txt', label: 'File B', value: 'bbb' },
        ]}
        initial={INITIAL}
        output={{ kind: 'files', placeholder: 'None' }}
        renderOptions={(ctx) => <Options {...ctx} />}
        run={{ generateLabel: 'Generate', mode: 'random' }}
        title="Files"
        triggerLabel="Open"
      />,
    )
    await open()
    expect(screen.getByRole('button', { name: 'Copy File A to clipboard' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy File B to clipboard' })).toBeTruthy()
    const downloads = screen.getAllByRole('button', { name: /^Download/ }).map((b) => b.textContent)
    expect(downloads).toEqual(['Download a.txt', 'Download b.txt', 'Download all'])
  })
})

describe('GeneratorShell — live output kinds', () => {
  it('fields: a Copy per row unless the row opts out', async () => {
    render(
      <GeneratorShell
        compute={() => [
          { label: 'Expression', value: '* * * * *' },
          { copy: false, label: 'Description', value: 'Every minute' },
        ]}
        initial={INITIAL}
        output={{ kind: 'fields', label: 'Expression', placeholder: 'None' }}
        renderOptions={(ctx) => <Options {...ctx} />}
        run={{ mode: 'live' }}
        title="Fields"
        triggerLabel="Open"
      />,
    )
    await open()
    expect(output()?.dataset.outputKind).toBe('fields')
    expect(output()?.hasAttribute('data-has-value')).toBe(true)
    expect(screen.getByText('Every minute')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy Expression to clipboard' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Copy Description to clipboard' })).toBeNull()
  })

  it('image: a preview with Downloads at the bottom that build the file only on click', async () => {
    const createObjectURL = vi.fn(() => 'blob:x')
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    // jsdom cannot follow the download link.
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const png = vi.fn(() => Promise.resolve(new Blob(['png'])))
    const broken = vi.fn(() => Promise.reject(new Error('no canvas')))
    render(
      <GeneratorShell
        compute={(o: Opts) => {
          if (o.upper) throw new Error('Bad size')
          return {
            alt: 'A preview',
            downloads: [
              { blob: png, filename: 'a.png', label: 'Download PNG' },
              { blob: broken, filename: 'a.webp', label: 'Download WebP' },
            ],
            src: 'data:image/svg+xml,<svg/>',
          }
        }}
        initial={INITIAL}
        output={{ kind: 'image', label: 'Preview', placeholder: 'Enter a size' }}
        renderOptions={(ctx) => <Options {...ctx} />}
        run={{ mode: 'live' }}
        title="Image"
        triggerLabel="Open"
      />,
    )
    await open()
    expect(screen.getByRole('img', { name: 'A preview' })).toBeTruthy()
    expect(output()?.hasAttribute('data-has-value')).toBe(true)
    expect(png).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Download PNG' }))
    await flush()
    expect(png).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(useToast.getState().items.map((t) => t.label)).toContain('Downloaded a.png')

    fireEvent.click(screen.getByRole('button', { name: 'Download WebP' }))
    await flush()
    expect(useToast.getState().items.map((t) => t.label)).toContain('Failed to create a.webp')

    fireEvent.click(screen.getByRole('button', { name: 'Upper' }))
    await flush()
    expect(screen.getByRole('alert').textContent).toBe('Bad size')
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Download/ })).toBeNull()
    expect(output()?.textContent).toContain('Enter a size')
    click.mockRestore()
  })

  it('swatches: Copy all in the label, and each swatch copies its own value', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(
      <GeneratorShell
        compute={() => ({
          copyAll: '--c-1: #ff0000;',
          swatches: [{ color: '#ff0000', details: ['#ff0000', 'rgb(255 0 0)'], value: '#ff0000' }],
        })}
        initial={INITIAL}
        output={{
          copyAllLabel: 'palette as CSS',
          itemLabel: 'color',
          kind: 'swatches',
          label: 'Palette',
          placeholder: 'None',
        }}
        renderOptions={(ctx) => <Options {...ctx} />}
        run={{ mode: 'live' }}
        title="Swatches"
        triggerLabel="Open"
      />,
    )
    await open()
    expect(output()?.hasAttribute('data-has-value')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Copy color #ff0000 to clipboard' }))
    await flush()
    expect(writeText).toHaveBeenLastCalledWith('#ff0000')

    fireEvent.click(screen.getByRole('button', { name: 'Copy palette as CSS to clipboard' }))
    await flush()
    expect(writeText).toHaveBeenLastCalledWith('--c-1: #ff0000;')
  })
})

describe('GeneratorShell — closing', () => {
  it('drops the output on close, so reopening never shows the previous value', async () => {
    const compute = vi
      .fn<(o: Opts) => Promise<string>>()
      .mockResolvedValueOnce('first secret')
      .mockReturnValue(new Promise<string>(() => undefined))
    renderText(compute)
    await open()
    expect(output()?.textContent).toContain('first secret')

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await flush(1000)
    expect(screen.queryByRole('dialog')).toBeNull()

    await open()
    expect(compute).toHaveBeenCalledTimes(2)
    expect(output()?.textContent).not.toContain('first secret')
  })
})
