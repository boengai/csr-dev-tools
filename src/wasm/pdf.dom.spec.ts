import { describe, expect, it } from 'vitest'

import { compileMarkdownToPdf, MAX_MD_INPUT_BYTES } from './pdf'

describe('compileMarkdownToPdf', () => {
  it('returns empty result for empty input', async () => {
    const result = await compileMarkdownToPdf('')
    expect(result.svgs).toEqual([])
    expect(result.pdf.byteLength).toBe(0)
  })

  it('returns empty result for whitespace-only input', async () => {
    const result = await compileMarkdownToPdf('   \n  ')
    expect(result.svgs).toEqual([])
    expect(result.pdf.byteLength).toBe(0)
  })

  it('compiles a heading to a PDF and at least one SVG page', async () => {
    const result = await compileMarkdownToPdf('# Hello')
    expect(result.svgs.length).toBeGreaterThan(0)
    expect(result.pdf.byteLength).toBeGreaterThan(100)
    expect(result.svgs[0]).toContain('<svg')
  })

  it('compiles a multi-section document', async () => {
    const md = `# Title

A paragraph.

- one
- two
`
    const result = await compileMarkdownToPdf(md)
    expect(result.svgs.length).toBeGreaterThan(0)
    expect(result.pdf.byteLength).toBeGreaterThan(500)
  })

  it('rejects input larger than MAX_MD_INPUT_BYTES', async () => {
    const huge = 'a'.repeat(MAX_MD_INPUT_BYTES + 1)
    await expect(compileMarkdownToPdf(huge)).rejects.toThrow(/too large/)
  })
})
