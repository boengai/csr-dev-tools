import type { ValidityStatus, CertificateInfo } from '@/types/utils/certificate-decoder'
import { parsePemCertificateViaWasm } from '@/wasm/certificate'

const MAX_INPUT_LENGTH = 32_768

const PRIVATE_KEY_PATTERN = /-----BEGIN.*PRIVATE KEY-----/

const PEM_CERT_PATTERN = /-----BEGIN CERTIFICATE-----/

export const getValidityStatus = (notBefore: Date, notAfter: Date, now = new Date()): ValidityStatus => {
  // A cert with notBefore > notAfter is malformed — neither "valid" nor a
  // simple time-window mismatch. Surface it as a distinct state so the UI
  // can flag it instead of misreporting as not-yet-valid.
  if (notBefore > notAfter) return 'malformed-dates'
  if (now < notBefore) return 'not-yet-valid'
  if (now > notAfter) return 'expired'
  return 'valid'
}

export const isValidPemCertificate = (input: string): boolean => {
  return PEM_CERT_PATTERN.test(input)
}

export const formatDistinguishedName = (dn: string): string => {
  // RFC 4514: commas inside RDN values are escaped as `\,`; splitting naively
  // on `,` would corrupt DNs like `CN=Acme\, Inc.,O=Acme`.
  const parts: Array<string> = []
  let current = ''
  for (let i = 0; i < dn.length; i++) {
    const c = dn[i]
    if (c === '\\' && i + 1 < dn.length) {
      current += c + dn[i + 1]
      i++
      continue
    }
    if (c === ',') {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += c
  }
  parts.push(current.trim())
  return parts.filter(Boolean).join(', ')
}

export const parsePemCertificate = async (input: string): Promise<CertificateInfo> => {
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error('Input too large. Certificates are typically under 4 KB.')
  }
  if (PRIVATE_KEY_PATTERN.test(input)) {
    throw new Error('This appears to be a private key. Only paste certificates for security.')
  }
  if (!isValidPemCertificate(input)) {
    const pemPattern = /-----BEGIN\s+(\w[\w\s]*\w)\s*-----/
    if (pemPattern.exec(input)) {
      throw new Error('This does not appear to be a certificate. Paste a PEM-encoded X.509 certificate.')
    }
    throw new Error('Certificate format not recognized. Paste a PEM-encoded certificate (-----BEGIN CERTIFICATE-----)')
  }

  const wire = await parsePemCertificateViaWasm(input)
  const notBefore = new Date(wire.notBefore)
  const notAfter = new Date(wire.notAfter)

  return {
    extensions: wire.extensions,
    issuer: formatDistinguishedName(wire.issuer),
    notAfter,
    notBefore,
    publicKeyAlgorithm: wire.publicKeyAlgorithm,
    publicKeySize: wire.publicKeySize,
    serialNumber: wire.serialNumber,
    signatureAlgorithm: wire.signatureAlgorithm,
    subject: formatDistinguishedName(wire.subject),
    validityStatus: getValidityStatus(notBefore, notAfter),
  }
}

export type { CertificateExtension, CertificateInfo, ValidityStatus } from '@/types/utils/certificate-decoder'
