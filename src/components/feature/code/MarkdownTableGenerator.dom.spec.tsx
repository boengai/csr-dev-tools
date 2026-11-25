import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MarkdownTableGenerator } from './MarkdownTableGenerator'

const flush = async (ms = 1) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const markdown = () => document.querySelector('[data-slot="tool-output"] pre')?.textContent ?? ''

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MarkdownTableGenerator', () => {
  it('builds the table live from the grid, keeping cells across a resize', async () => {
    render(<MarkdownTableGenerator autoOpen />)
    await flush()
    expect(markdown()).toContain('| Header 1 | Header 2 | Header 3 |')

    fireEvent.change(screen.getByRole('textbox', { name: 'Row 1, column 1' }), { target: { value: 'apple' } })
    await flush(300)
    expect(markdown()).toContain('| apple')

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Cols' }), { target: { value: '4' } })
    await flush()
    expect(markdown()).toMatch(/\| Header 3 \| +\|/)
    expect(markdown()).toContain('| apple')
    expect(screen.getByRole('textbox', { name: 'Row 1, column 1' })).toHaveValue('apple')

    fireEvent.click(screen.getByRole('button', { name: 'Column 1 alignment: left' }))
    await flush()
    expect(screen.getByRole('button', { name: 'Column 1 alignment: center' })).toBeTruthy()
    expect(markdown()).toMatch(/\| :-+: \|/)
  })

  it('keeps a just-typed cell when an instant change follows before the pause', async () => {
    render(<MarkdownTableGenerator autoOpen />)
    await flush()

    fireEvent.change(screen.getByRole('textbox', { name: 'Row 1, column 1' }), { target: { value: 'apple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Column 1 alignment: left' }))
    await flush(600)

    expect(markdown()).toContain('| apple')
    expect(markdown()).toMatch(/\| :-+: \|/)
    const saved = JSON.parse(localStorage.getItem('csr-dev-tools-markdown-table-generator') ?? '{}')
    expect(saved.data[1][0]).toBe('apple')
    expect(saved.alignments[0]).toBe('center')
  })

  it('recovers from a damaged saved table: the editor shows a fresh grid and an edit replaces it', async () => {
    localStorage.setItem('csr-dev-tools-markdown-table-generator', JSON.stringify({ cols: 3, data: [['x']], rows: 3 }))
    render(<MarkdownTableGenerator autoOpen />)
    await flush()
    expect(screen.getByRole('alert').textContent).toMatch(/damaged/)
    expect(screen.getAllByRole('textbox').length).toBe(9)

    fireEvent.change(screen.getByRole('textbox', { name: 'Row 2, column 2' }), { target: { value: 'ok' } })
    await flush(300)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(markdown()).toContain('ok')
  })

  it('reports an alignment named after an object built-in as a damaged table', async () => {
    localStorage.setItem(
      'csr-dev-tools-markdown-table-generator',
      JSON.stringify({
        alignments: ['__proto__', 'left'],
        cols: 2,
        data: [
          ['A', 'B'],
          ['1', '2'],
        ],
        rows: 2,
      }),
    )
    render(<MarkdownTableGenerator autoOpen />)
    await flush()
    expect(screen.getByRole('alert').textContent).toMatch(/damaged/)
    expect(markdown()).not.toContain('| A')
  })
})
