/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useMountOnce } from './useMountOnce'

describe('useMountOnce', () => {
  it('fires the callback once after mount', () => {
    const fn = vi.fn()
    renderHook(() => useMountOnce(fn))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('fires only once under React.StrictMode (which double-invokes effects)', () => {
    const fn = vi.fn()
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
    renderHook(() => useMountOnce(fn), { wrapper })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not re-fire when the callback identity changes between renders', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const { rerender } = renderHook(({ cb }: { cb: () => void }) => useMountOnce(cb), {
      initialProps: { cb: fn1 },
    })
    rerender({ cb: fn2 })
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).not.toHaveBeenCalled()
  })
})
