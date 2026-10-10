import type { CertificateInfo } from '@/types/utils/certificate-decoder'
import type { CertificateWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export type CertificateWire = Omit<CertificateInfo, 'notBefore' | 'notAfter' | 'validityStatus'> & {
  notBefore: string
  notAfter: string
}

export async function parsePemCertificateViaWasm(pem: string): Promise<CertificateWire> {
  const wasm = await loadWasm<CertificateWasm>('certificate')
  try {
    const raw = wasm.parse_pem_certificate(pem)
    return JSON.parse(raw) as CertificateWire
  } catch (cause) {
    throw new Error(
      'Certificate format not recognized. Paste a PEM-encoded certificate (-----BEGIN CERTIFICATE-----)',
      { cause },
    )
  }
}
