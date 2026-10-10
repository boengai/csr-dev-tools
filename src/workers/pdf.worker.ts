import type { PdfWorkerRequest } from '@/types/wasm/pdf'
import type { WorkerRequest, WorkerResponse } from '@/types/wasm/worker-bridge'

import * as pdfWasm from '../../wasm/pkg/pdf/pdf.js'
import { compileMarkdownToDto } from './pdf-compile'
import { retryableOnce } from './retryable-once'

const ensureInit = retryableOnce(() => pdfWasm.default())

self.onmessage = async (e: MessageEvent<WorkerRequest<PdfWorkerRequest>>) => {
  const { id, md } = e.data

  try {
    await ensureInit()
    const dto = compileMarkdownToDto(pdfWasm, md)
    const response: WorkerResponse<typeof dto> = { id, result: dto }
    // Transfer (not clone) the PDF bytes — they can be several MB per compile.
    self.postMessage(response, { transfer: [dto.pdf.buffer as ArrayBuffer] })
  } catch (err) {
    const response: WorkerResponse<never> = { id, error: err instanceof Error ? err.message : String(err) }
    self.postMessage(response)
  }
}
