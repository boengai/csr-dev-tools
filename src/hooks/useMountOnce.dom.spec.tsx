/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useMountOnce } from './useMountOnce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useMountOnce', () => {
  it('fires the callback once after mount', () => {
    const fn = vi.fn()
    renderHook(() => useMountOnce(fn))
    expect(fn).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('fires only once under React.StrictMode (which double-invokes effects)', () => {
    const fn = vi.fn()
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
    renderHook(() => useMountOnce(fn), { wrapper })
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not re-fire when the callback identity changes between renders', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const { rerender } = renderHook(({ cb }: { cb: () => void }) => useMountOnce(cb), {
      initialProps: { cb: fn1 },
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })
    rerender({ cb: fn2 })
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).not.toHaveBeenCalled()
  })

  it('cancels its deferred call on unmount before the callback fires', () => {
    const fn = vi.fn()
    const { unmount } = renderHook(() => useMountOnce(fn))
    unmount()
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(fn).not.toHaveBeenCalled()
  })
})
