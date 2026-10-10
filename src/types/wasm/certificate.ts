import type { CertificateInfo } from '@/types'

export type CertificateWire = Omit<CertificateInfo, 'notBefore' | 'notAfter' | 'validityStatus'> & {
  notBefore: string
  notAfter: string
}
