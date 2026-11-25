/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { JsonpathEvaluator } from './JsonpathEvaluator'

const STORAGE_KEY = 'csr-dev-tools-jsonpath-evaluator-v2'
const LEGACY_STORAGE_KEY = 'csr-dev-tools-jsonpath-evaluator'

const expressionInput = () => screen.findByLabelText<HTMLInputElement>('JSONPath Expression')

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

describe('JsonpathEvaluator — pre-shell bag', () => {
  const LEGACY_BAG = JSON.stringify({ expression: '$.users[*].name', jsonInput: '{"users":[{"name":"Ada"}]}' })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('moves the saved JSON and expression to the shell key and evaluates them', async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, LEGACY_BAG)
    render(<JsonpathEvaluator autoOpen />)

    await waitFor(() => expect(within(output()).getByText('"Ada"')).toBeTruthy())
    expect((await expressionInput()).value).toBe('$.users[*].name')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({
      expression: '$.users[*].name',
      source: '{"users":[{"name":"Ada"}]}',
    })
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })

  it.each([
    ['a missing expression becomes the default', { jsonInput: '[1]' }, '$.store.book[*].author', '[1]'],
    ['a non-text expression becomes the default', { expression: 7, jsonInput: '[1]' }, '$.store.book[*].author', '[1]'],
    ['a cleared expression stays cleared', { expression: '', jsonInput: '[1]' }, '', '[1]'],
    ['non-text JSON becomes empty', { expression: '$.a', jsonInput: { a: 1 } }, '$.a', ''],
    ['other fields are not copied', { expression: '$.a', jsonInput: '[1]', source: 7, tab: 'x' }, '$.a', '[1]'],
  ])('%s', async (_name, bag, expression, source) => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(bag))
    render(<JsonpathEvaluator autoOpen />)

    expect((await expressionInput()).value).toBe(expression)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({ expression, source })
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })

  it('leaves both keys alone once the shell key holds input', async () => {
    const saved = JSON.stringify({ expression: '$.b', source: '{"b":"new"}' })
    localStorage.setItem(STORAGE_KEY, saved)
    localStorage.setItem(LEGACY_STORAGE_KEY, LEGACY_BAG)
    render(<JsonpathEvaluator autoOpen />)

    await waitFor(() => expect(within(output()).getByText('"new"')).toBeTruthy())
    expect(localStorage.getItem(STORAGE_KEY)).toBe(saved)
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBe(LEGACY_BAG)
  })

  it.each(['{broken', 'null', '42', '"__proto__"', '[]', '{}', '{"expression":null,"jsonInput":7}'])(
    'opens with the defaults and keeps an unusable value as found: %s',
    async (junk) => {
      localStorage.setItem(LEGACY_STORAGE_KEY, junk)
      render(<JsonpathEvaluator autoOpen />)

      expect((await expressionInput()).value).toBe('$.store.book[*].author')
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBe(junk)
    },
  )

  it('moves the bag when storage has no room for a second copy', async () => {
    const JSDOM_QUOTA = 5_000_000
    localStorage.setItem(LEGACY_STORAGE_KEY, LEGACY_BAG)
    localStorage.setItem('filler', 'x'.repeat(JSDOM_QUOTA - 2 * LEGACY_BAG.length))
    expect(() => localStorage.setItem(STORAGE_KEY, LEGACY_BAG)).toThrow()
    render(<JsonpathEvaluator autoOpen />)

    await waitFor(() => expect(within(output()).getByText('"Ada"')).toBeTruthy())
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })

  it('keeps the old key when the new one cannot be written', async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, LEGACY_BAG)
    const realSetItem = Storage.prototype.setItem
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (key === STORAGE_KEY) throw new DOMException('full', 'QuotaExceededError')
      realSetItem.call(localStorage, key, value)
    })
    render(<JsonpathEvaluator autoOpen />)

    expect((await expressionInput()).value).toBe('$.store.book[*].author')
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String))
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBe(LEGACY_BAG)
  })

  it('opens when storage cannot be read', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    render(<JsonpathEvaluator autoOpen />)

    expect((await expressionInput()).value).toBe('$.store.book[*].author')
  })

  it('writes nothing when nothing was saved', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    render(<JsonpathEvaluator autoOpen />)

    await expressionInput()
    expect(setItem).not.toHaveBeenCalled()
  })
})
