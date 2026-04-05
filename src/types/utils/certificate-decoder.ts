export type ValidityStatus = 'expired' | 'not-yet-valid' | 'valid'

export type CertificateExtension = {
  critical: boolean
  name: string
  oid: string
  value: string
}

export type CertificateInfo = {
  extensions: Array<CertificateExtension>
  isValid: boolean
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
