import { readFile } from 'node:fs/promises'

import { describe, expect, it, vi } from 'vitest'

import { decryptPdf } from '@/wasm/pdf-decrypt'

import { combinePdfPages } from './combine-pdf'

// The real decrypt step, wrapped so a test can count its calls.
vi.mock('@/wasm/pdf-decrypt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/wasm/pdf-decrypt')>()
  return { decryptPdf: vi.fn(actual.decryptPdf) }
})

const PAGE_ONE_TEXT = 'Encrypted fixture page one'

const fixture = async (name: string): Promise<File> => {
  const bytes = await readFile(new URL(`../test/fixtures/pdf/${name}`, import.meta.url))
  return new File([new Uint8Array(bytes)], name, { type: 'application/pdf' })
}

/** Text of each page, read back the way a PDF viewer would. */
const pageTexts = async (pdf: Uint8Array): Promise<Array<string>> => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: pdf.slice(), verbosity: 0 }).promise
  const texts: Array<string> = []
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent()
    texts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(''))
  }
  return texts
}

describe('combinePdfPages', () => {
  it('keeps the content of a plain PDF', async () => {
    const file = await fixture('plain.pdf')
    const result = await combinePdfPages([{ file, pageIndex: 0 }])
    expect(result.skipped).toEqual([])
    expect(await pageTexts(result.pdf)).toEqual([PAGE_ONE_TEXT])
  })

  it.each(['rc4-128.pdf', 'aes-128.pdf', 'aes-256-objstm.pdf'])(
    'keeps the content of %s, encrypted with an empty user password',
    async (name) => {
      const file = await fixture(name)
      const result = await combinePdfPages([{ file, pageIndex: 0 }])
      expect(result.skipped).toEqual([])
      expect(result.pageCount).toBe(1)
      expect(await pageTexts(result.pdf)).toEqual([PAGE_ONE_TEXT])
    },
  )

  it('skips a PDF that needs a password, and keeps the other files', async () => {
    const locked = await fixture('locked.pdf')
    const plain = await fixture('plain.pdf')
    const result = await combinePdfPages([
      { file: locked, pageIndex: 0 },
      { file: plain, pageIndex: 0 },
      { file: locked, pageIndex: 1 },
    ])
    expect(result.skipped).toEqual(['locked.pdf'])
    expect(result.pageCount).toBe(1)
    expect(await pageTexts(result.pdf)).toEqual([PAGE_ONE_TEXT])
  })

  it('tries a locked file once per merge, however many of its pages are picked', async () => {
    const locked = await fixture('locked.pdf')
    vi.mocked(decryptPdf).mockClear()
    await combinePdfPages([
      { file: locked, pageIndex: 0 },
      { file: locked, pageIndex: 1 },
      { file: locked, pageIndex: 0 },
    ])
    expect(decryptPdf).toHaveBeenCalledTimes(1)
  })

  it('returns no PDF when every file is skipped, rather than a blank page', async () => {
    const locked = await fixture('locked.pdf')
    const result = await combinePdfPages([{ file: locked, pageIndex: 0 }])
    expect(result).toEqual({ pdf: new Uint8Array(0), pageCount: 0, skipped: ['locked.pdf'] })
  })

  it('combines encrypted and plain pages in the given order', async () => {
    const encrypted = await fixture('aes-256-objstm.pdf')
    const plain = await fixture('plain.pdf')
    const result = await combinePdfPages([
      { file: encrypted, pageIndex: 1 },
      { file: plain, pageIndex: 0 },
    ])
    expect(result.skipped).toEqual([])
    expect(await pageTexts(result.pdf)).toEqual(['Encrypted fixture page two', PAGE_ONE_TEXT])
  })

  it('decrypts a file once, however often its pages are combined', async () => {
    const file = await fixture('aes-128.pdf')
    vi.mocked(decryptPdf).mockClear()
    await combinePdfPages([{ file, pageIndex: 0 }])
    const again = await combinePdfPages([{ file, pageIndex: 0 }])
    expect(decryptPdf).toHaveBeenCalledTimes(1)
    expect(await pageTexts(again.pdf)).toEqual([PAGE_ONE_TEXT])
  })

  it('does not read an encrypted file again once its decrypted bytes are kept', async () => {
    const file = await fixture('aes-128.pdf')
    await combinePdfPages([{ file, pageIndex: 0 }])
    const read = vi.spyOn(file, 'arrayBuffer')
    const again = await combinePdfPages([{ file, pageIndex: 1 }, { file, pageIndex: 0 }])
    expect(read).not.toHaveBeenCalled()
    expect(await pageTexts(again.pdf)).toEqual(['Encrypted fixture page two', PAGE_ONE_TEXT])
  })

  it('names each skipped file once, even when two share a name', async () => {
    const first = await fixture('locked.pdf')
    const second = await fixture('locked.pdf')
    const result = await combinePdfPages([
      { file: first, pageIndex: 0 },
      { file: second, pageIndex: 0 },
      { file: first, pageIndex: 1 },
    ])
    expect(result.skipped).toEqual(['locked.pdf', 'locked.pdf'])
  })

  it('skips a file that can no longer be read, and keeps the other files', async () => {
    // A File whose bytes are gone, as when it changes on disk after upload.
    const gone = new File([], 'gone.pdf', { type: 'application/pdf' })
    vi.spyOn(gone, 'arrayBuffer').mockRejectedValue(new DOMException('gone', 'NotReadableError'))
    const plain = await fixture('plain.pdf')
    const result = await combinePdfPages([
      { file: gone, pageIndex: 0 },
      { file: plain, pageIndex: 0 },
    ])
    expect(result.skipped).toEqual(['gone.pdf'])
    expect(await pageTexts(result.pdf)).toEqual([PAGE_ONE_TEXT])
  })

  it('fails the merge, rather than skipping the file, when the decrypt step cannot load', async () => {
    const encrypted = await fixture('aes-128.pdf')
    const plain = await fixture('plain.pdf')
    const items = [
      { file: encrypted, pageIndex: 0 },
      { file: plain, pageIndex: 0 },
    ]
    vi.mocked(decryptPdf).mockRejectedValueOnce(new Error('offline'))
    await expect(combinePdfPages(items)).rejects.toThrow('offline')
    // The failure is not remembered: the next merge decrypts the file.
    const retried = await combinePdfPages(items)
    expect(retried.skipped).toEqual([])
    expect(await pageTexts(retried.pdf)).toEqual([PAGE_ONE_TEXT, PAGE_ONE_TEXT])
  })

  it('decrypts a file once when a second merge starts before the first ends', async () => {
    const file = await fixture('rc4-128.pdf')
    vi.mocked(decryptPdf).mockClear()
    const [first, second] = await Promise.all([
      combinePdfPages([{ file, pageIndex: 0 }]),
      combinePdfPages([{ file, pageIndex: 0 }]),
    ])
    expect(decryptPdf).toHaveBeenCalledTimes(1)
    expect(await pageTexts(first.pdf)).toEqual([PAGE_ONE_TEXT])
    expect(await pageTexts(second.pdf)).toEqual([PAGE_ONE_TEXT])
  })
})
