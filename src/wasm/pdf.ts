import type { CompileResultDto } from '@/types/wasm/pdf'

import { loadWasm } from './init'
import { htmlToMarkdown } from './markdown'

type CsrPdf = {
  compile_markdown: (md: string) => CsrPdfCompileResult
}

type CsrPdfCompileResult = {
  readonly page_count: number
  page_svg: (index: number) => string | undefined
  readonly pdf: Uint8Array
}

export const MAX_HTML_INPUT_BYTES = 256 * 1024
export const MAX_MD_INPUT_BYTES = 256 * 1024

let worker: Worker | null = null
let msgId = 0

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  return worker
}

function callWorker(md: string): Promise<CompileResultDto> {
  return new Promise((resolve, reject) => {
    const id = ++msgId
    const w = getWorker()

    const handler = (e: MessageEvent) => {
      if (e.data.id !== id) return
      w.removeEventListener('message', handler)
      if (e.data.error) {
        reject(new Error(e.data.error))
      } else {
        resolve(e.data.result as CompileResultDto)
      }
    }

    w.addEventListener('message', handler)
    w.postMessage({ id, md })
  })
}

const isNode =
  typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node

export async function compileMarkdownToPdf(md: string): Promise<CompileResultDto> {
  if (md.trim().length === 0) {
    return { svgs: [], pdf: new Uint8Array(0) }
  }
  if (md.length > MAX_MD_INPUT_BYTES) {
    throw new Error(
      `Input too large (${md.length} bytes). Maximum is ${MAX_MD_INPUT_BYTES} bytes.`,
    )
  }

  if (isNode) {
    const wasm = await loadWasm<CsrPdf>('pdf')
    const result = wasm.compile_markdown(md)
    const svgs: Array<string> = []
    for (let i = 0; i < result.page_count; i++) {
      const svg = result.page_svg(i)
      if (svg !== undefined) svgs.push(svg)
    }
    return { svgs, pdf: result.pdf }
  }

  return callWorker(md)
}

export async function compileHtmlToPdf(html: string): Promise<CompileResultDto> {
  if (html.trim().length === 0) {
    return { svgs: [], pdf: new Uint8Array(0) }
  }
  if (html.length > MAX_HTML_INPUT_BYTES) {
    throw new Error(
      `Input too large (${html.length} bytes). Maximum is ${MAX_HTML_INPUT_BYTES} bytes.`,
    )
  }
  const md = await htmlToMarkdown(html)
  return compileMarkdownToPdf(md)
}
