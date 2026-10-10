/**
 * @vitest-environment jsdom
 */
import { render, renderHook } from '@testing-library/react'
import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'
import { describe, expect, it } from 'vitest'

import { useLatestRef } from './useLatestRef'

describe('useLatestRef', () => {
  it('holds the initial value after mount', () => {
    const { result } = renderHook(() => useLatestRef('a'))
    expect(result.current.current).toBe('a')
  })

  it('holds the latest committed value after a rerender, with a stable ref identity', () => {
    const { rerender, result } = renderHook(({ value }) => useLatestRef(value), { initialProps: { value: 1 } })
    const first = result.current
    rerender({ value: 2 })
    expect(result.current).toBe(first)
    expect(result.current.current).toBe(2)
  })

  it('is already updated when a child layout effect runs in the same commit', () => {
    const seen: Array<string> = []
    const Child = ({ latest }: { latest: RefObject<string> }) => {
      useLayoutEffect(() => {
        seen.push(latest.current)
      })
      return null
    }
    const Parent = ({ value }: { value: string }) => {
      const latest = useLatestRef(value)
      return <Child latest={latest} />
    }

    const { rerender } = render(<Parent value="first" />)
    rerender(<Parent value="second" />)
    expect(seen).toEqual(['first', 'second'])
  })
})
