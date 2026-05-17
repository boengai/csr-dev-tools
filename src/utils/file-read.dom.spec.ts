/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { readFileAsDataUrl } from './file-read'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readFileAsDataUrl', () => {
  it('resolves with the data URL produced by FileReader.readAsDataURL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' })
    const dataUrl = await readFileAsDataUrl(blob)
    expect(dataUrl).toMatch(/^data:text\/plain;base64,/)
    expect(atob(dataUrl.split(',')[1] ?? '')).toBe('hello')
  })

  it('accepts a File (subtype of Blob) without signature change', async () => {
    const file = new File(['x'], 'name.txt', { type: 'text/plain' })
    await expect(readFileAsDataUrl(file)).resolves.toMatch(/^data:text\/plain;base64,/)
  })

  it('rejects when FileReader fires onerror', async () => {
    class FailingReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      result: unknown = null
      readAsDataURL() {
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal('FileReader', FailingReader)
    await expect(readFileAsDataUrl(new Blob([]))).rejects.toThrow('Failed to read file')
  })

  it('rejects when FileReader.result is not a string', async () => {
    class NonStringReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      result: unknown = new ArrayBuffer(0)
      readAsDataURL() {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('FileReader', NonStringReader)
    await expect(readFileAsDataUrl(new Blob([]))).rejects.toThrow('Failed to read file as data URL')
  })
})
