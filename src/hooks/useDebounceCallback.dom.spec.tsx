/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebounceCallback } from './useDebounceCallback'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebounceCallback', () => {
  it('fires the callback once after the delay elapses', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(cb, 300))

    result.current('x')
    expect(cb).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('x')
  })

  it('coalesces rapid calls — last args win', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(cb, 300))

    result.current('a')
    act(() => {
      vi.advanceTimersByTime(100)
    })
    result.current('b')
    act(() => {
      vi.advanceTimersByTime(100)
    })
    result.current('c')
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('c')
  })

  it('cancels the pending timer on unmount', () => {
    const cb = vi.fn()
    const { result, unmount } = renderHook(() => useDebounceCallback(cb, 300))

    result.current('x')
    unmount()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(cb).not.toHaveBeenCalled()
  })

  it('fires the previously-captured callback when `callback` swaps mid-flight without re-invocation', () => {
    const v1 = vi.fn()
    const v2 = vi.fn()
    const { result, rerender } = renderHook(
      ({ cb }: { cb: (val: string) => void }) => useDebounceCallback(cb, 300),
      { initialProps: { cb: v1 } },
    )

    result.current('x')
    rerender({ cb: v2 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(v1).toHaveBeenCalledTimes(1)
    expect(v1).toHaveBeenCalledWith('x')
    expect(v2).not.toHaveBeenCalled()
  })

  it('does not reschedule an in-flight timer when `delay` changes without re-invocation', () => {
    const cb = vi.fn()
    const { result, rerender } = renderHook(
      ({ delay }: { delay: number }) => useDebounceCallback(cb, delay),
      { initialProps: { delay: 300 } },
    )

    result.current('x')
    rerender({ delay: 1000 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('x')
  })
})
