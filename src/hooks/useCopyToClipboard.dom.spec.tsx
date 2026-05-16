/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from './state'
import { useCopyToClipboard } from './useCopyToClipboard'

const originalClipboard = navigator.clipboard

const setClipboardWriteText = (impl: (val: string) => Promise<void>) => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn(impl) },
  })
}

beforeEach(() => {
  useToast.setState({ items: [] })
})

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: originalClipboard,
  })
})

describe('useCopyToClipboard', () => {
  it('writes the value to the clipboard and toasts success', async () => {
    setClipboardWriteText(() => Promise.resolve())
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current('hello')
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Copied to clipboard')
    expect(items[0].type).toBe('success')
  })

  it('toasts an error when the clipboard write rejects', async () => {
    setClipboardWriteText(() => Promise.reject(new Error('blocked')))
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current('hello')
    })

    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Failed to copy to clipboard')
    expect(items[0].type).toBe('error')
  })

  it('absorbs the rejection so callers do not need to catch', async () => {
    setClipboardWriteText(() => Promise.reject(new Error('blocked')))
    const { result } = renderHook(() => useCopyToClipboard())

    await expect(result.current('hello')).resolves.toBeUndefined()
  })
})
