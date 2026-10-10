import { describe, expect, it, vi } from 'vitest'

import type { PdfWasm } from '@/types/wasm/ffi'

import { compileMarkdownToDto } from './pdf-compile'

type FakeResult = ReturnType<PdfWasm['compile_markdown']>

const fakeWasm = (result: Partial<FakeResult>) =>
  ({ compile_markdown: vi.fn(() => result as FakeResult) }) as Pick<PdfWasm, 'compile_markdown'>

describe('compileMarkdownToDto', () => {
  it('copies pages + pdf bytes into a DTO and frees the wasm struct', () => {
    const free = vi.fn()
    const pdf = new Uint8Array([37, 80, 68, 70])
    const wasm = fakeWasm({
      free,
      page_count: 2,
      page_svg: (i: number) => `<svg>${i}</svg>`,
      pdf,
    })

    const dto = compileMarkdownToDto(wasm, '# hi')

    expect(dto).toEqual({ pdf, svgs: ['<svg>0</svg>', '<svg>1</svg>'] })
    expect(free).toHaveBeenCalledTimes(1)
  })

  it('frees the wasm struct even when reading it throws', () => {
    const free = vi.fn()
    const wasm = fakeWasm({
      free,
      page_count: 1,
      page_svg: () => {
        throw new Error('boom')
      },
    })

    expect(() => compileMarkdownToDto(wasm, '# hi')).toThrow('boom')
    expect(free).toHaveBeenCalledTimes(1)
  })
})
