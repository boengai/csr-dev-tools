/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useElapsedTimer } from './useElapsedTimer'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useElapsedTimer', () => {
  it('returns 0 when isRunning is false', () => {
    const { result } = renderHook(() => useElapsedTimer(false))
    expect(result.current).toBe(0)
  })

  it('starts at 0 on the initial render when isRunning is true', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { result } = renderHook(() => useElapsedTimer(true))
    expect(result.current).toBe(0)
  })

  it('advances toward elapsed seconds while running', () => {
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { result } = renderHook(() => useElapsedTimer(true))

    nowSpy.mockReturnValue(1150)
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBeCloseTo(0.15, 2)
  })

  it('resets to 0 when isRunning flips false', () => {
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { result, rerender } = renderHook(({ running }) => useElapsedTimer(running), {
      initialProps: { running: true },
    })

    nowSpy.mockReturnValue(1500)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBeCloseTo(0.5, 2)

    rerender({ running: false })
    expect(result.current).toBe(0)
  })

  it('clears the interval on unmount', () => {
    const { unmount } = renderHook(() => useElapsedTimer(true))
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
