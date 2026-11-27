import type { PdfDecryptWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

/**
 * Rewrite a PDF without its encryption. Only the empty user password is tried,
 * which opens the common "owner password only" files. Rejects when the file
 * needs a real password or isn't a readable PDF.
 */
export async function decryptPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const wasm = await loadWasm<PdfDecryptWasm>('pdf-decrypt')
  return wasm.decrypt_pdf(bytes)
}
