import type { PdfWasm } from '@/types/wasm/ffi'
import type { CompileResultDto } from '@/types/wasm/pdf'

/**
 * Run `compile_markdown` and copy the opaque `CompileResult` (ADR 0022) into a
 * structured-clone-friendly DTO, then free the wasm-side struct. Without the
 * `free()` every debounced compile leaks the Typst document in the wasm heap.
 * The `pdf` getter returns a fresh JS-owned copy, so the DTO outlives `free()`.
 */
export function compileMarkdownToDto(wasm: Pick<PdfWasm, 'compile_markdown'>, md: string): CompileResultDto {
  const result = wasm.compile_markdown(md)
  try {
    const svgs: Array<string> = []
    const count = result.page_count
    for (let i = 0; i < count; i++) {
      const svg = result.page_svg(i)
      if (svg !== undefined) svgs.push(svg)
    }
    return { pdf: result.pdf, svgs }
  } finally {
    result.free()
  }
}
