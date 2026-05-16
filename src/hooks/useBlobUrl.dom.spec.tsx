/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useBlobUrl } from './useBlobUrl'

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL
let idCounter = 0

beforeEach(() => {
  idCounter = 0
  URL.createObjectURL = vi.fn((blob: Blob) => `blob:test-${blob.size}-${++idCounter}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
})

describe('useBlobUrl', () => {
  it('returns null for null blob', () => {
    const { result } = renderHook(() => useBlobUrl(null))
    expect(result.current).toBeNull()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('creates a URL for a non-null blob', () => {
    const blob = new Blob(['hello'])
    const { result } = renderHook(() => useBlobUrl(blob))
    expect(result.current).toMatch(/^blob:test-/)
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
  })

  it('revokes the old URL when blob changes', () => {
    const a = new Blob(['a'])
    const b = new Blob(['bb'])
    const { rerender } = renderHook(({ blob }) => useBlobUrl(blob), { initialProps: { blob: a } })
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    rerender({ blob: b })
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)
  })

  it('revokes on unmount', () => {
    const blob = new Blob(['x'])
    const { unmount } = renderHook(() => useBlobUrl(blob))
    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  it('returns null when transitioning from blob to null', () => {
    const blob = new Blob(['x'])
    const initialProps: { b: Blob | null } = { b: blob }
    const { result, rerender } = renderHook(({ b }: { b: Blob | null }) => useBlobUrl(b), { initialProps })
    expect(result.current).not.toBeNull()
    rerender({ b: null })
    expect(result.current).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })
})
