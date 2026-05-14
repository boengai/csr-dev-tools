/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob, downloadBlobsAsZip } from './download'

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test-url')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
  document.body.innerHTML = ''
})

describe('downloadBlob', () => {
  it('creates an anchor with the blob URL and given filename, then clicks it', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const blob = new Blob(['hello'])

    downloadBlob(blob, 'hello.txt')

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalledTimes(1)

    clickSpy.mockRestore()
  })

  it('removes the anchor from the DOM after click', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    downloadBlob(new Blob(['x']), 'x.bin')

    expect(document.querySelectorAll('a').length).toBe(0)
  })

  it('revokes the URL after a microtask', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    downloadBlob(new Blob(['x']), 'x.bin')

    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
  })
})

describe('downloadBlobsAsZip', () => {
  it('returns the zip blob and dispatches a download with the given filename', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    clickSpy.mockClear()
    const zipBlob = await downloadBlobsAsZip({ 'a.txt': new Blob(['hi']) }, 'out.zip')
    expect(zipBlob).toBeInstanceOf(Blob)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    clickSpy.mockRestore()
  })

  it('preserves slash-nested paths and accepts string values for text files', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const zipBlob = await downloadBlobsAsZip(
      {
        'icons/icon-192.png': new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])]),
        'manifest.json': '{"name":"test"}',
      },
      'assets.zip',
    )
    const { default: JSZip } = await import('jszip')
    const zip = await JSZip.loadAsync(zipBlob)
    const filePaths = Object.values(zip.files).filter((f) => !f.dir).map((f) => f.name).sort()
    expect(filePaths).toEqual(['icons/icon-192.png', 'manifest.json'])
    expect(await zip.file('manifest.json')?.async('string')).toBe('{"name":"test"}')
  })
})
