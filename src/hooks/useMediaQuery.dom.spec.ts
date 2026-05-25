/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMediaQuery } from './useMediaQuery'

// jsdom ships a `window.matchMedia` stub that returns `matches: false` and
// silently no-ops add/removeEventListener. To exercise the subscription path
// we install a controllable mock for each test.

type Listener = (e: { matches: boolean }) => void

function installMatchMediaMock(initialMatches: boolean) {
  const listeners: Array<Listener> = []
  let matches = initialMatches
  const mql = {
    get matches() {
      return matches
    },
    addEventListener: (_type: 'change', l: Listener) => {
      listeners.push(l)
    },
    removeEventListener: (_type: 'change', l: Listener) => {
      const i = listeners.indexOf(l)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  const matchMedia = vi.fn(() => mql)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  })
  return {
    matchMedia,
    listenerCount: () => listeners.length,
    fire: (next: boolean) => {
      matches = next
      for (const l of [...listeners]) l({ matches: next })
    },
  }
}

afterEach(() => {
  // Reset matchMedia between tests so each one installs its own.
  // (vitest globals reset, but our defineProperty does not.)
  // @ts-expect-error — restoring jsdom's default stub is unnecessary; the next test will re-install.
  delete window.matchMedia
})

describe('useMediaQuery', () => {
  it('returns the initial match value synchronously on first render (SSR-flash-safe)', () => {
    installMatchMediaMock(true)
    const { result } = renderHook(() => useMediaQuery('(min-width: 48rem)'))
    expect(result.current).toBe(true)
  })

  it('updates when the underlying media query fires a change event', () => {
    const mock = installMatchMediaMock(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 48rem)'))
    expect(result.current).toBe(false)

    act(() => mock.fire(true))
    expect(result.current).toBe(true)

    act(() => mock.fire(false))
    expect(result.current).toBe(false)
  })

  it('removes its change listener on unmount', () => {
    const mock = installMatchMediaMock(false)
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 48rem)'))
    expect(mock.listenerCount()).toBe(1)

    unmount()
    expect(mock.listenerCount()).toBe(0)
  })

  it('uses ssrDefault as the first-render value when window.matchMedia is absent', () => {
    // Simulate the SSR / prerender path by removing matchMedia. The hook checks
    // both `typeof window === 'undefined'` and `typeof matchMedia !== 'function'`,
    // so removing the function alone is enough to exercise the fallback without
    // breaking react-dom (which needs `window` itself).
    const originalMatchMedia = window.matchMedia
    // @ts-expect-error — intentionally remove for this test
    delete window.matchMedia

    try {
      const { result: defaultFalse } = renderHook(() => useMediaQuery('(min-width: 48rem)'))
      expect(defaultFalse.current).toBe(false)

      const { result: explicitTrue } = renderHook(() => useMediaQuery('(min-width: 48rem)', true))
      expect(explicitTrue.current).toBe(true)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('re-subscribes when the query string changes', () => {
    const mock = installMatchMediaMock(false)
    const { rerender } = renderHook(({ q }: { q: string }) => useMediaQuery(q), {
      initialProps: { q: '(min-width: 48rem)' },
    })

    expect(mock.matchMedia).toHaveBeenLastCalledWith('(min-width: 48rem)')

    rerender({ q: '(max-width: 767px)' })
    expect(mock.matchMedia).toHaveBeenLastCalledWith('(max-width: 767px)')
    // Old listener removed; new listener added.
    expect(mock.listenerCount()).toBe(1)
  })
})
