import { readFile } from 'node:fs/promises'

import { describe, expect, it, vi } from 'vitest'

import { loadWasm } from './init'
import { decryptPdf } from './pdf-decrypt'

vi.mock('./init', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./init')>()
  return { loadWasm: vi.fn(actual.loadWasm) }
})

const fixture = async (name: string): Promise<Uint8Array> =>
  new Uint8Array(await readFile(new URL(`../test/fixtures/pdf/${name}`, import.meta.url)))

describe('decryptPdf', () => {
  it('returns the PDF without its encryption', async () => {
    const out = await decryptPdf(await fixture('aes-128.pdf'))
    expect(out).not.toBeNull()
    expect(new TextDecoder('latin1').decode(out ?? undefined)).not.toContain('/Encrypt')
  })

  it('returns null for a file it cannot decrypt', async () => {
    expect(await decryptPdf(await fixture('locked.pdf'))).toBeNull()
    expect(await decryptPdf(new TextEncoder().encode('not a pdf'))).toBeNull()
  })

  it('rejects, naming the step, when its WASM cannot load', async () => {
    vi.mocked(loadWasm).mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'))
    await expect(decryptPdf(await fixture('aes-128.pdf'))).rejects.toThrow(/couldn't load the PDF decryptor/i)
  })
})
