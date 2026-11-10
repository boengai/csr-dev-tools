/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { JsonpathEvaluator } from './JsonpathEvaluator'

const output = () => {
  const out = document.querySelector<HTMLElement>('[data-slot="tool-output"]')
  if (!out) throw new Error('no output region')
  return out
}

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    disconnect() {}
    observe() {}
    unobserve() {}
  }
  // CodeMirror measures text ranges; jsdom has no layout.
  Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
})

beforeEach(() => {
  localStorage.clear()
})

describe('JsonpathEvaluator', () => {
  it('evaluates the sample, copies all matches as one JSON array, and reports no matches', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(<JsonpathEvaluator autoOpen />)

    fireEvent.click(await screen.findByRole('button', { name: 'Load sample' }))
    await waitFor(() => expect(within(output()).getByText('"Nigel Rees"')).toBeTruthy())
    expect(within(output()).getAllByRole('button', { name: /^Copy \$.*to clipboard$/ })).toHaveLength(4)

    fireEvent.click(within(output()).getByRole('button', { name: 'Copy Matches to clipboard' }))
    expect(JSON.parse(writeText.mock.lastCall?.[0] as string)).toEqual([
      'Nigel Rees',
      'Evelyn Waugh',
      'Herman Melville',
      'J. R. R. Tolkien',
    ])

    fireEvent.change(screen.getByLabelText('JSONPath Expression'), { target: { value: '$.nothing' } })
    await waitFor(() => expect(within(output()).getByText('No matches')).toBeTruthy())
    expect(within(output()).getByRole('button', { name: 'Copy Matches to clipboard' })).toBeDisabled()
  })

  it('shows a bad expression in the status slot', async () => {
    render(<JsonpathEvaluator autoOpen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Load sample' }))
    await waitFor(() => expect(within(output()).getByText('"Nigel Rees"')).toBeTruthy())

    fireEvent.change(screen.getByLabelText('JSONPath Expression'), { target: { value: '$[?(@.price<)]' } })
    const status = document.querySelector<HTMLElement>('[data-slot="tool-status"]')
    await waitFor(() => expect(within(status as HTMLElement).getByRole('alert')).toBeTruthy())
    expect(output().hasAttribute('data-has-value')).toBe(false)
  })
})
