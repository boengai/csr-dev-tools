/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { MermaidRenderer } from './MermaidRenderer'

// Mermaid can't lay out in jsdom. Valid input renders a marker SVG; a first
// line without a diagram type rejects like the real parser does. Each `$$…$$`
// is stamped as a hidden math label, as the real renderer does.
vi.mock('@/utils/mermaid-renderer', () => ({
  initializeMermaid: vi.fn(),
  renderMermaid: vi.fn(async (code: string) => {
    if (!/^(flowchart|sequenceDiagram)\b/.test(code.trim())) throw new Error('No diagram type detected')
    const math = code.match(/\$\$[^$]*\$\$/g)?.length ?? 0
    const stamp = math > 0 ? ` data-hidden-math-labels="${math}"` : ''
    return { diagramType: 'flowchart', svg: `<svg data-testid="diagram"${stamp}></svg>` }
  }),
  svgToPng: vi.fn(),
}))

const STORAGE_KEY = 'csr-dev-tools-mermaid-renderer'

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 4; i++) {
      await vi.runAllTimersAsync()
      await vi.dynamicImportSettled()
    }
  })
}

const statusSlot = () => {
  const slot = document.querySelector<HTMLElement>('[data-slot="tool-status"]')
  if (!slot) throw new Error('no status slot')
  return slot
}

beforeAll(() => {
  // CodeMirror measures text ranges; jsdom has no layout.
  Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
})

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MermaidRenderer', () => {
  it('opens on the placeholder, with no default diagram', async () => {
    render(<MermaidRenderer autoOpen />)
    await flush()
    expect(screen.getByText('Write Mermaid syntax, or pick an example, to see the diagram')).toBeInTheDocument()
    expect(screen.queryByTestId('diagram')).not.toBeInTheDocument()
  })

  it('shows the diagram computed from the saved source once it opens', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ source: 'flowchart TD\n    A --> B' }))
    render(<MermaidRenderer />)
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Render' }))
    await flush()

    expect(screen.getByTestId('diagram')).toBeInTheDocument()
  })

  it('renders an example picked from the controls', async () => {
    render(<MermaidRenderer autoOpen />)
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Use Sequence example' }))
    await flush()

    expect(screen.getByTestId('diagram')).toBeInTheDocument()
  })

  it('shows a syntax error in the status slot with an Auto-fix that repairs the source', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ source: 'A --> B' }))
    render(<MermaidRenderer autoOpen />)
    await flush()

    expect(within(statusSlot()).getByRole('alert').textContent).toBe('No diagram type detected')
    expect(screen.queryByTestId('diagram')).not.toBeInTheDocument()

    fireEvent.click(within(statusSlot()).getByRole('button', { name: /^Auto-fix/ }))
    await flush()

    expect(within(statusSlot()).queryByRole('alert')).toBeNull()
    expect(screen.getByTestId('diagram')).toBeInTheDocument()
  })

  it('says in the status slot when math labels are left out, and still shows the diagram', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ source: 'sequenceDiagram\n    A->>B: $$x^2$$' }))
    render(<MermaidRenderer autoOpen />)
    await flush()

    expect(within(statusSlot()).getByRole('status').textContent).toBe(
      "A math label ($$…$$) can't be drawn, so it's left out of the diagram.",
    )
    expect(screen.getByTestId('diagram')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use Sequence example' }))
    await flush()
    expect(within(statusSlot()).queryByRole('status')).toBeNull()
  })

  it('counts the left-out math labels in the notice', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ source: 'sequenceDiagram\n    A->>B: $$x^2$$\n    Note over A: $$y$$' }),
    )
    render(<MermaidRenderer autoOpen />)
    await flush()

    expect(within(statusSlot()).getByRole('status').textContent).toBe(
      "2 math labels ($$…$$) can't be drawn, so they're left out of the diagram.",
    )
  })

  it('takes a DB Diagram handoff over the saved source', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ source: 'not a diagram' }))
    localStorage.setItem('csr-dev-tools-handoff-mermaid-renderer', 'flowchart LR\n    users --> orders')
    render(<MermaidRenderer autoOpen />)
    await flush()

    expect(within(statusSlot()).queryByRole('alert')).toBeNull()
    expect(screen.getByTestId('diagram')).toBeInTheDocument()
  })
})

describe('MermaidRenderer — legacy draft', () => {
  it('moves a pre-migration draft into the shell key once', async () => {
    localStorage.clear()
    localStorage.setItem('csr-dev-tools-mermaid-renderer-code', JSON.stringify('flowchart TD\n    A --> B'))
    render(<MermaidRenderer autoOpen />)
    await flush()

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ source: 'flowchart TD\n    A --> B' })
    expect(localStorage.getItem('csr-dev-tools-mermaid-renderer-code')).toBeNull()
  })
})
