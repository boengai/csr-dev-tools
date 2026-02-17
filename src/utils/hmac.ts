export type HmacAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

export type HmacEncoding = 'base64' | 'hex'

export const HMAC_ALGORITHMS: Array<HmacAlgorithm> = ['SHA-256', 'SHA-384', 'SHA-512']

export const DEFAULT_HMAC_ALGORITHM: HmacAlgorithm = 'SHA-256'

export const DEFAULT_HMAC_ENCODING: HmacEncoding = 'hex'

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export async function generateHmac(
  message: string,
  key: string,
  algorithm: HmacAlgorithm,
  encoding: HmacEncoding,
): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const messageData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { hash: algorithm, name: 'HMAC' }, false, ['sign'])

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)

  return encoding === 'hex' ? bufferToHex(signature) : bufferToBase64(signature)
}
