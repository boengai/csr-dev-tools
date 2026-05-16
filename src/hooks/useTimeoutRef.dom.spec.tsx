/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTimeoutRef } from './useTimeoutRef'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimeoutRef', () => {
  it('schedule fires the callback after the delay', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useTimeoutRef())

    act(() => {
      result.current.schedule(cb, 500)
    })
    expect(cb).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('a second schedule cancels the first — only the latest fires', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result } = renderHook(() => useTimeoutRef())

    act(() => {
      result.current.schedule(first, 500)
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    act(() => {
      result.current.schedule(second, 500)
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('cancel prevents a pending timer from firing', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useTimeoutRef())

    act(() => {
      result.current.schedule(cb, 500)
    })
    act(() => {
      result.current.cancel()
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(cb).not.toHaveBeenCalled()
  })

  it('cancel is a no-op when nothing is scheduled', () => {
    const { result } = renderHook(() => useTimeoutRef())
    // Should not throw
    expect(() => {
      act(() => {
        result.current.cancel()
      })
    }).not.toThrow()
  })

  it('unmount cancels any pending timer', () => {
    const cb = vi.fn()
    const { result, unmount } = renderHook(() => useTimeoutRef())

    act(() => {
      result.current.schedule(cb, 500)
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(cb).not.toHaveBeenCalled()
  })

  it('schedule and cancel identities are stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useTimeoutRef())
    const firstSchedule = result.current.schedule
    const firstCancel = result.current.cancel
    rerender()
    expect(result.current.schedule).toBe(firstSchedule)
    expect(result.current.cancel).toBe(firstCancel)
  })
})
