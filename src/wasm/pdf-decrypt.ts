import type { PdfDecryptWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

/**
 * Rewrite a PDF without its encryption. Only the empty user password is tried,
 * which opens the common "owner password only" files. Resolves to null when
 * this file can't be decrypted (it needs a real password, isn't a readable
 * PDF, or uses a crypt filter lopdf would leave encrypted). Rejects only when
 * the decrypt step itself can't load, which says nothing about the file.
 */
export async function decryptPdf(bytes: Uint8Array): Promise<Uint8Array | null> {
  let wasm: PdfDecryptWasm
  try {
    wasm = await loadWasm<PdfDecryptWasm>('pdf-decrypt')
  } catch (cause) {
    throw new Error("Couldn't load the PDF decryptor. Check your connection and try again.", { cause })
  }
  try {
    return wasm.decrypt_pdf(bytes)
  } catch {
    return null
  }
}
