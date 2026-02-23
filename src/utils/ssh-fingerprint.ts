export type SshKeyInfo = {
  bits: number
  comment: string
  keyType: string
  md5Fingerprint: string
  rawBase64: string
  sha256Fingerprint: string
}

type ParsedKeyLine = {
  comment: string
  keyBlob: string
  keyType: string
}

type ParsedKeyBlob = {
  bits: number
  keyType: string
}

export const KNOWN_KEY_TYPES = new Set([
  'ecdsa-sha2-nistp256',
  'ecdsa-sha2-nistp384',
  'ecdsa-sha2-nistp521',
  'sk-ecdsa-sha2-nistp256@openssh.com',
  'sk-ssh-ed25519@openssh.com',
  'ssh-dss',
  'ssh-ed25519',
  'ssh-rsa',
])

export class SshKeyBlobReader {
  private view: DataView
  private offset = 0

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer)
  }

  readUint32(): number {
    const value = this.view.getUint32(this.offset, false)
    this.offset += 4
    return value
  }

  readBytes(): Uint8Array {
    const length = this.readUint32()
    const bytes = new Uint8Array(this.view.buffer, this.offset, length)
    this.offset += length
    return bytes
  }

  readString(): string {
    const bytes = this.readBytes()
    return new TextDecoder().decode(bytes)
  }
}

export const parseAuthorizedKeysLine = (line: string): ParsedKeyLine | null => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return null

  const firstToken = parts[0]

  if (KNOWN_KEY_TYPES.has(firstToken)) {
    return {
      comment: parts.slice(2).join(' '),
      keyBlob: parts[1],
      keyType: firstToken,
    }
  }

  if (parts.length >= 3 && KNOWN_KEY_TYPES.has(parts[1])) {
    return {
      comment: parts.slice(3).join(' '),
      keyBlob: parts[2],
      keyType: parts[1],
    }
  }

  return null
}

export const getRsaBitLength = (modulus: Uint8Array): number => {
  let startIndex = 0
  while (startIndex < modulus.length && modulus[startIndex] === 0x00) {
    startIndex++
  }

  if (startIndex >= modulus.length) return 0

  const significantBytes = modulus.length - startIndex
  const highByte = modulus[startIndex]

  return (significantBytes - 1) * 8 + Math.floor(Math.log2(highByte)) + 1
}

const CURVE_BITS: Record<string, number> = {
  nistp256: 256,
  nistp384: 384,
  nistp521: 521,
}

export const parseKeyBlob = (blob: ArrayBuffer): ParsedKeyBlob => {
  const reader = new SshKeyBlobReader(blob)
  const keyType = reader.readString()

  if (keyType === 'ssh-rsa') {
    reader.readBytes()
    const modulus = reader.readBytes()
    return { bits: getRsaBitLength(modulus), keyType }
  }

  if (keyType === 'ssh-ed25519' || keyType === 'sk-ssh-ed25519@openssh.com') {
    return { bits: 256, keyType }
  }

  if (keyType.startsWith('ecdsa-sha2-') || keyType === 'sk-ecdsa-sha2-nistp256@openssh.com') {
    const curveName = reader.readString()
    const bits = CURVE_BITS[curveName] ?? 256
    return { bits, keyType }
  }

  if (keyType === 'ssh-dss') {
    const p = reader.readBytes()
    return { bits: getRsaBitLength(p), keyType }
  }

  return { bits: 0, keyType }
}

export const sha256Fingerprint = async (keyBlobBase64: string): Promise<string> => {
  const binaryString = atob(keyBlobBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const hashArray = new Uint8Array(hashBuffer)

  let base64 = btoa(String.fromCharCode(...hashArray))
  base64 = base64.replace(/=+$/, '')

  return `SHA256:${base64}`
}

/* RFC 1321 MD5 for raw Uint8Array — blueimp-md5 UTF-8 encodes input, corrupting binary data */
const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4,
  11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1))) >>> 0)

const md5Raw = (data: Uint8Array): string => {
  const bitLen = data.length * 8
  const padLen = (data.length % 64 < 56 ? 56 : 120) - (data.length % 64)
  const padded = new Uint8Array(data.length + padLen + 8)
  padded.set(data)
  padded[data.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, bitLen >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLen / 2 ** 32) >>> 0, true)

  let a0 = 0x67452301 >>> 0
  let b0 = 0xefcdab89 >>> 0
  let c0 = 0x98badcfe >>> 0
  let d0 = 0x10325476 >>> 0

  for (let offset = 0; offset < padded.length; offset += 64) {
    const M = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true)
    }

    let A = a0
    let B = b0
    let C = c0
    let D = d0

    for (let i = 0; i < 64; i++) {
      let F: number
      let g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + MD5_K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << MD5_S[i]) | (F >>> (32 - MD5_S[i])))) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const result = new Uint8Array(16)
  const rv = new DataView(result.buffer)
  rv.setUint32(0, a0, true)
  rv.setUint32(4, b0, true)
  rv.setUint32(8, c0, true)
  rv.setUint32(12, d0, true)
  return Array.from(result, (b) => b.toString(16).padStart(2, '0')).join(':')
}

export const md5Fingerprint = (keyBlobBase64: string): string => {
  const binaryString = atob(keyBlobBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return md5Raw(bytes)
}

const PRIVATE_KEY_PATTERN = /-----BEGIN.*PRIVATE KEY-----/

const MAX_INPUT_LENGTH = 16_384

export const analyzeSshKey = async (input: string): Promise<SshKeyInfo> => {
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error('Input too large. SSH public keys are typically under 1 KB.')
  }

  if (PRIVATE_KEY_PATTERN.test(input)) {
    throw new Error('This appears to be a private key. Only paste public keys for security.')
  }

  const parsed = parseAuthorizedKeysLine(input)
  if (!parsed) {
    throw new Error('SSH key format not recognized (e.g., ssh-rsa AAAA... user@host)')
  }

  let blobBuffer: ArrayBuffer
  try {
    const binaryString = atob(parsed.keyBlob)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    blobBuffer = bytes.buffer
  } catch {
    throw new Error('SSH key format not recognized (e.g., ssh-rsa AAAA... user@host)')
  }

  const blobInfo = parseKeyBlob(blobBuffer)

  if (blobInfo.keyType !== parsed.keyType) {
    throw new Error('SSH key format not recognized (e.g., ssh-rsa AAAA... user@host)')
  }

  const sha256 = await sha256Fingerprint(parsed.keyBlob)
  const md5fp = md5Fingerprint(parsed.keyBlob)

  return {
    bits: blobInfo.bits,
    comment: parsed.comment,
    keyType: parsed.keyType,
    md5Fingerprint: md5fp,
    rawBase64: parsed.keyBlob,
    sha256Fingerprint: sha256,
  }
}

export const isValidSshPublicKey = (input: string): boolean => {
  const trimmed = input.trim()
  if (!trimmed) return false

  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return false

  if (KNOWN_KEY_TYPES.has(parts[0])) return true
  if (parts.length >= 3 && KNOWN_KEY_TYPES.has(parts[1])) return true

  return false
}
