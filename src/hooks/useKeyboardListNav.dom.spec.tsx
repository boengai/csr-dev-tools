/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useKeyboardListNav } from './useKeyboardListNav'

const makeEvent = (key: string) => {
  const preventDefault = vi.fn()
  return {
    event: { key, preventDefault } as unknown as React.KeyboardEvent,
    preventDefault,
  }
}

beforeEach(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn()
  }
})

describe('useKeyboardListNav', () => {
  it('starts at the configured initialIndex', () => {
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b', 'c'], { initialIndex: -1, onEnter: vi.fn() }))
    expect(result.current.activeIndex).toBe(-1)
  })

  it('defaults initialIndex to 0', () => {
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b'], { onEnter: vi.fn() }))
    expect(result.current.activeIndex).toBe(0)
  })

  it('advances on ArrowDown and clamps at the end by default', () => {
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b', 'c'], { onEnter: vi.fn() }))

    act(() => {
      result.current.handleKeyDown(makeEvent('ArrowDown').event)
    })
    expect(result.current.activeIndex).toBe(1)

    act(() => {
      result.current.handleKeyDown(makeEvent('ArrowDown').event)
    })
    expect(result.current.activeIndex).toBe(2)

    // At end with clamp: stays
    act(() => {
      result.current.handleKeyDown(makeEvent('ArrowDown').event)
    })
    expect(result.current.activeIndex).toBe(2)
  })

  it('retreats on ArrowUp and clamps at 0 by default', () => {
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b', 'c'], { initialIndex: 1, onEnter: vi.fn() }))

    act(() => {
      result.current.handleKeyDown(makeEvent('ArrowUp').event)
    })
    expect(result.current.activeIndex).toBe(0)

    // At 0 with clamp: stays
    act(() => {
      result.current.handleKeyDown(makeEvent('ArrowUp').event)
    })
    expect(result.current.activeIndex).toBe(0)
  })

  it('wraps ArrowDown end → 0 when wraparound is true', () => {
    const { result } = renderHook(() =>
      useKeyboardListNav(['a', 'b'], { initialIndex: 1, onEnter: vi.fn(), wraparound: true }),
    )

    act(() => {
      result.current.handleKeyDown(makeEvent('ArrowDown').event)
    })
    expect(result.current.activeIndex).toBe(0)
  })

  it('wraps ArrowUp 0 → last when wraparound is true', () => {
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b', 'c'], { onEnter: vi.fn(), wraparound: true }))

    act(() => {
      result.current.handleKeyDown(makeEvent('ArrowUp').event)
    })
    expect(result.current.activeIndex).toBe(2)
  })

  it('Enter calls onEnter with the active item', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b', 'c'], { initialIndex: 1, onEnter }))

    act(() => {
      result.current.handleKeyDown(makeEvent('Enter').event)
    })

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onEnter).toHaveBeenCalledWith('b')
  })

  it('Enter is a no-op when no item is highlighted (activeIndex < 0)', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b'], { initialIndex: -1, onEnter }))

    act(() => {
      result.current.handleKeyDown(makeEvent('Enter').event)
    })

    expect(onEnter).not.toHaveBeenCalled()
  })

  it('Arrow keys are no-ops on an empty list', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() => useKeyboardListNav([], { onEnter }))
    const startIndex = result.current.activeIndex

    act(() => {
      result.current.handleKeyDown(makeEvent('ArrowDown').event)
      result.current.handleKeyDown(makeEvent('ArrowUp').event)
      result.current.handleKeyDown(makeEvent('Enter').event)
    })

    expect(result.current.activeIndex).toBe(startIndex)
    expect(onEnter).not.toHaveBeenCalled()
  })

  it('preventDefault is called on the handled keys', () => {
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b'], { onEnter: vi.fn() }))

    const down = makeEvent('ArrowDown')
    act(() => {
      result.current.handleKeyDown(down.event)
    })
    expect(down.preventDefault).toHaveBeenCalled()

    const up = makeEvent('ArrowUp')
    act(() => {
      result.current.handleKeyDown(up.event)
    })
    expect(up.preventDefault).toHaveBeenCalled()

    const enter = makeEvent('Enter')
    act(() => {
      result.current.handleKeyDown(enter.event)
    })
    expect(enter.preventDefault).toHaveBeenCalled()
  })

  it('setActiveIndex is the React setter so callers can reset on query change', () => {
    const { result } = renderHook(() => useKeyboardListNav(['a', 'b', 'c'], { onEnter: vi.fn() }))

    act(() => {
      result.current.setActiveIndex(2)
    })
    expect(result.current.activeIndex).toBe(2)

    act(() => {
      result.current.setActiveIndex((prev) => prev - 1)
    })
    expect(result.current.activeIndex).toBe(1)
  })
})
