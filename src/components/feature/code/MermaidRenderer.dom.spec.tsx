/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MermaidRenderer } from './MermaidRenderer'

vi.mock('@/utils/mermaid-renderer', () => ({
  initializeMermaid: vi.fn(),
  renderMermaid: vi.fn(async () => ({ diagramType: 'flowchart', svg: '<svg data-testid="diagram"></svg>' })),
  svgToPng: vi.fn(),
}))

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 4; i++) {
      await vi.runAllTimersAsync()
      await vi.dynamicImportSettled()
    }
  })
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MermaidRenderer preview', () => {
  it('shows the diagram computed while the dialog was closed once it opens', async () => {
    render(<MermaidRenderer />)
    // Persisted-input autorun renders the default diagram while the dialog is closed.
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Render' }))
    await flush()

    expect(screen.getByTestId('diagram')).toBeInTheDocument()
  })

  it('still shows the diagram after closing and reopening', async () => {
    render(<MermaidRenderer autoOpen />)
    await flush()
    expect(screen.getByTestId('diagram')).toBeInTheDocument()

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    await flush()
    expect(screen.queryByTestId('diagram')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Render' }))
    await flush()
    expect(screen.getByTestId('diagram')).toBeInTheDocument()
  })
})
