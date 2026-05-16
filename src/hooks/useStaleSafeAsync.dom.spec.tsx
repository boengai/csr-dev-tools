/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useStaleSafeAsync } from './useStaleSafeAsync'

describe('useStaleSafeAsync', () => {
  it('marks every previous session stale once a new one starts (monotonic)', () => {
    const { result } = renderHook(() => useStaleSafeAsync())
    const newSession = result.current

    const a = newSession()
    expect(a.isFresh()).toBe(true)

    const b = newSession()
    expect(a.isFresh()).toBe(false)
    expect(b.isFresh()).toBe(true)

    const c = newSession()
    expect(a.isFresh()).toBe(false)
    expect(b.isFresh()).toBe(false)
    expect(c.isFresh()).toBe(true)
  })

  it('ifFresh invokes fn and returns its value when fresh', () => {
    const { result } = renderHook(() => useStaleSafeAsync())
    const session = result.current()
    const fn = vi.fn(() => 'ok')

    expect(session.ifFresh(fn)).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('ifFresh skips fn and returns undefined when stale', () => {
    const { result } = renderHook(() => useStaleSafeAsync())
    const newSession = result.current
    const stale = newSession()
    newSession() // supersedes `stale`
    const fn = vi.fn()

    expect(stale.ifFresh(fn)).toBeUndefined()
    expect(fn).not.toHaveBeenCalled()
  })

  it('returns a stable factory across re-renders', () => {
    const { result, rerender } = renderHook(() => useStaleSafeAsync())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
