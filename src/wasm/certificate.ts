import type { CertificateInfo } from '@/types/utils/certificate-decoder'

import { loadWasm } from './init'

type CsrCertificate = { parse_pem_certificate: (pem: string) => string }

export type CertificateWire = Omit<CertificateInfo, 'notBefore' | 'notAfter' | 'validityStatus'> & {
  notBefore: string
  notAfter: string
}

export async function parsePemCertificateViaWasm(pem: string): Promise<CertificateWire> {
  const wasm = await loadWasm<CsrCertificate>('certificate')
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
