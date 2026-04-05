export type SshKeyInfo = {
  bits: number
  comment: string
  keyType: string
  md5Fingerprint: string
  rawBase64: string
  sha256Fingerprint: string
}

export type ParsedKeyLine = {
  comment: string
  keyBlob: string
  keyType: string
}

export type ParsedKeyBlob = {
  bits: number
  keyType: string
}
