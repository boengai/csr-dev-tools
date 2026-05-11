export type ValidityStatus = 'expired' | 'malformed-dates' | 'not-yet-valid' | 'valid'

export type CertificateExtension = {
  critical: boolean
  name: string
  oid: string
  value: string
}

export type CertificateInfo = {
  extensions: Array<CertificateExtension>
  issuer: string
  notAfter: Date
  notBefore: Date
  publicKeyAlgorithm: string
  publicKeySize: number
  serialNumber: string
  signatureAlgorithm: string
  subject: string
  validityStatus: ValidityStatus
}
