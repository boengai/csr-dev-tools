/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useKeyboardShortcut } from './useKeyboardShortcut'

const dispatchKey = (key: string, options: Partial<KeyboardEventInit> = {}) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...options })
  document.dispatchEvent(event)
  return event
}

describe('useKeyboardShortcut', () => {
  it('fires handler when predicate matches', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut((e) => e.key === 'Escape', handler))

    dispatchKey('Escape')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not fire when predicate returns false', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut((e) => e.key === 'Escape', handler))

    dispatchKey('Enter')
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes the KeyboardEvent to the handler so it can preventDefault', () => {
    const handler = vi.fn((e: KeyboardEvent) => e.preventDefault())
    renderHook(() =>
      useKeyboardShortcut((e) => (e.metaKey || e.ctrlKey) && e.key === 'k', handler),
    )

    const event = dispatchKey('k', { metaKey: true })
    expect(handler).toHaveBeenCalledWith(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('does not subscribe when enabled is false', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut((e) => e.key === 'Escape', handler, { enabled: false }))

    dispatchKey('Escape')
    expect(handler).not.toHaveBeenCalled()
  })

  it('toggling enabled re-subscribes / unsubscribes', () => {
    const handler = vi.fn()
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useKeyboardShortcut((e) => e.key === 'Escape', handler, { enabled }),
      { initialProps: { enabled: true } },
    )

    dispatchKey('Escape')
    expect(handler).toHaveBeenCalledTimes(1)

    rerender({ enabled: false })
    dispatchKey('Escape')
    expect(handler).toHaveBeenCalledTimes(1) // unchanged

    rerender({ enabled: true })
    dispatchKey('Escape')
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('unmount removes the document listener', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useKeyboardShortcut((e) => e.key === 'Escape', handler))

    unmount()
    dispatchKey('Escape')
    expect(handler).not.toHaveBeenCalled()
  })

  it('reads the latest handler closure even when props swap mid-subscription', () => {
    const v1 = vi.fn()
    const v2 = vi.fn()
    const { rerender } = renderHook(
      ({ handler }: { handler: (e: KeyboardEvent) => void }) =>
        useKeyboardShortcut((e) => e.key === 'Escape', handler),
      { initialProps: { handler: v1 } },
    )

    rerender({ handler: v2 })
    dispatchKey('Escape')

    expect(v1).not.toHaveBeenCalled()
    expect(v2).toHaveBeenCalledTimes(1)
  })
})
