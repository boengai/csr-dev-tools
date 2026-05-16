/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'

import { buildZipBlob } from './zip'

describe('buildZipBlob', () => {
  it('returns a zip blob containing the given entry', async () => {
    const zipBlob = await buildZipBlob({ 'a.txt': new Blob(['hi']) })
    expect(zipBlob).toBeInstanceOf(Blob)
  })

  it('preserves slash-nested paths and accepts string values for text files', async () => {
    const zipBlob = await buildZipBlob({
      'icons/icon-192.png': new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])]),
      'manifest.json': '{"name":"test"}',
    })
    const { default: JSZip } = await import('jszip')
    const zip = await JSZip.loadAsync(zipBlob)
    const filePaths = Object.values(zip.files)
      .filter((f) => !f.dir)
      .map((f) => f.name)
      .sort()
    expect(filePaths).toEqual(['icons/icon-192.png', 'manifest.json'])
    expect(await zip.file('manifest.json')?.async('string')).toBe('{"name":"test"}')
  })
})
