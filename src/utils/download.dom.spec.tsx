/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadBlob, downloadDataUrl } from './download'

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
  vi.restoreAllMocks()
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

describe('downloadDataUrl', () => {
  it('creates an anchor with the data URL as href and clicks it', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const setHrefSpy = vi.spyOn(HTMLAnchorElement.prototype, 'href', 'set')

    downloadDataUrl('data:image/png;base64,abc', 'qr-code.png')

    expect(setHrefSpy).toHaveBeenCalledWith('data:image/png;base64,abc')
    expect(clickSpy).toHaveBeenCalledTimes(1)

    clickSpy.mockRestore()
    setHrefSpy.mockRestore()
  })

  it('removes the anchor from the DOM after click', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    downloadDataUrl('data:image/png;base64,abc', 'qr-code.png')

    expect(document.querySelectorAll('a').length).toBe(0)
  })

  it('does not touch URL.createObjectURL / revokeObjectURL', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    downloadDataUrl('data:image/png;base64,abc', 'qr-code.png')

    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
