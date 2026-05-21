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

  it('downloadSvg triggers an SVG download and toasts the filename', () => {
    const spy = vi.spyOn(downloadUtils, 'downloadSvg').mockImplementation(() => {})
    const { result } = renderHook(() => useDownload())

    act(() => {
      result.current.downloadSvg('<svg/>', 'diagram.svg')
    })

    expect(spy).toHaveBeenCalledWith('<svg/>', 'diagram.svg')
    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Downloaded diagram.svg')
    expect(items[0].type).toBe('success')
  })

  it('downloadPemFile triggers a PEM download and toasts the filename', () => {
    const spy = vi.spyOn(downloadUtils, 'downloadPemFile').mockImplementation(() => {})
    const { result } = renderHook(() => useDownload())

    act(() => {
      result.current.downloadPemFile('-----BEGIN KEY-----', 'key.pem')
    })

    expect(spy).toHaveBeenCalledWith('-----BEGIN KEY-----', 'key.pem')
    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Downloaded key.pem')
    expect(items[0].type).toBe('success')
  })
})
