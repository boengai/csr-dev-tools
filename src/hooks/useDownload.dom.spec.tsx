/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as downloadUtils from '@/utils/download'

import { useToast } from './state'
import { useDownload } from './useDownload'

beforeEach(() => {
  useToast.setState({ items: [] })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useDownload', () => {
  it('downloadBlob triggers a blob download and toasts the filename', () => {
    const spy = vi.spyOn(downloadUtils, 'downloadBlob').mockImplementation(() => {})
    const { result } = renderHook(() => useDownload())
    const blob = new Blob(['x'], { type: 'text/plain' })

    act(() => {
      result.current.downloadBlob(blob, 'note.txt')
    })

    expect(spy).toHaveBeenCalledWith(blob, 'note.txt')
    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Downloaded note.txt')
    expect(items[0].type).toBe('success')
  })

  it('downloadDataUrl triggers a data-URL download and toasts the filename', () => {
    const spy = vi.spyOn(downloadUtils, 'downloadDataUrl').mockImplementation(() => {})
    const { result } = renderHook(() => useDownload())

    act(() => {
      result.current.downloadDataUrl('data:image/png;base64,AAAA', 'pic.png')
    })

    expect(spy).toHaveBeenCalledWith('data:image/png;base64,AAAA', 'pic.png')
    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Downloaded pic.png')
    expect(items[0].type).toBe('success')
  })
})
