/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { JwtDecoder } from './JwtDecoder'

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

afterEach(() => {
  vi.useRealTimers()
})

describe('JwtDecoder', () => {
  it('decodes the sample into header, payload and signature rows; Payload copies the raw JSON', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(<JwtDecoder autoOpen />)

    fireEvent.click(await screen.findByRole('button', { name: 'Load sample' }))
    await waitFor(() => expect(output().hasAttribute('data-has-value')).toBe(true))

    expect(within(output()).getByText(/"alg": "HS256"/)).toBeTruthy()
    expect(within(output()).getByText('dummy-sig')).toBeTruthy()
    // The sample does not expire, so the expiry row reads valid and there is no notice.
    expect(within(output()).getByText(/^Valid — expires in/)).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()

    fireEvent.click(within(output()).getByRole('button', { name: 'Copy Payload to clipboard' }))
    expect(JSON.parse(writeText.mock.lastCall?.[0] as string)).toEqual({
      exp: 9999999999,
      iat: 1516239022,
      name: 'John Doe',
      sub: '1234567890',
    })
  })

  it('raises a notice once the token has expired', async () => {
    // Only Date is faked: the sample's `exp` (9999999999) is in 2286.
    vi.useFakeTimers({ now: new Date('2300-01-01T00:00:00Z'), toFake: ['Date'] })
    render(<JwtDecoder autoOpen />)

    fireEvent.click(await screen.findByRole('button', { name: 'Load sample' }))
    await waitFor(() => expect(output().hasAttribute('data-has-value')).toBe(true))

    const status = document.querySelector<HTMLElement>('[data-slot="tool-status"]') as HTMLElement
    expect(within(status).getByRole('status').textContent).toMatch(/^Expired .* ago/)
  })
})
