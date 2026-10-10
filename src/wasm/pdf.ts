import type { PdfWasm } from '@/types/wasm/ffi'
import type { CompileResultDto, PdfWorkerRequest } from '@/types/wasm/pdf'

import { compileMarkdownToDto } from '../workers/pdf-compile'
import { loadWasm } from './init'
import { htmlToMarkdown } from './markdown'
import { createWorkerBridge } from './worker-bridge'

export const MAX_HTML_INPUT_BYTES = 256 * 1024
export const MAX_MD_INPUT_BYTES = 256 * 1024

const bridge = createWorkerBridge<PdfWorkerRequest>(
  () => new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
)

export async function compileMarkdownToPdf(md: string): Promise<CompileResultDto> {
  if (md.trim().length === 0) {
    return { svgs: [], pdf: new Uint8Array(0) }
  }
  if (md.length > MAX_MD_INPUT_BYTES) {
    throw new Error(`Input too large (${md.length} bytes). Maximum is ${MAX_MD_INPUT_BYTES} bytes.`)
  }

  // Specs run without Web Workers; Vite constant-folds MODE so production
  // bundles drop this branch.
  if (import.meta.env.MODE === 'test') {
    const wasm = await loadWasm<PdfWasm>('pdf')
    return compileMarkdownToDto(wasm, md)
  }

  return bridge.call<CompileResultDto>({ md })
}

export async function compileHtmlToPdf(html: string): Promise<CompileResultDto> {
  if (html.trim().length === 0) {
    return { svgs: [], pdf: new Uint8Array(0) }
  }
  if (html.length > MAX_HTML_INPUT_BYTES) {
    throw new Error(`Input too large (${html.length} bytes). Maximum is ${MAX_HTML_INPUT_BYTES} bytes.`)
  }
  const md = await htmlToMarkdown(html)
  return compileMarkdownToPdf(md)
}
