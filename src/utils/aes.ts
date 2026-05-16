const SALT_LENGTH = 16
const IV_LENGTH = 12

// Versioned blob format: version byte → PBKDF2 iteration count.
// v1 (legacy, no version byte): salt(16) || iv(12) || ciphertext, 100k iterations.
// v2: 0x01 || salt(16) || iv(12) || ciphertext, 600k iterations.
const VERSION_V2 = 0x01
const PBKDF2_ITERATIONS_V1 = 100_000
const PBKDF2_ITERATIONS_V2 = 600_000

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

async function deriveKey(password: string, salt: ArrayBuffer, iterations: number): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])

  return crypto.subtle.deriveKey(
    {
      hash: 'SHA-256',
      iterations,
      name: 'PBKDF2',
      salt,
    },
    keyMaterial,
    { length: 256, name: 'AES-GCM' },
    false,
    ['decrypt', 'encrypt'],
  )
}

async function decryptWithLayout(
  data: Uint8Array,
  password: string,
  payloadOffset: number,
  iterations: number,
): Promise<string> {
  const salt = data.slice(payloadOffset, payloadOffset + SALT_LENGTH)
  const iv = data.slice(payloadOffset + SALT_LENGTH, payloadOffset + SALT_LENGTH + IV_LENGTH)
  const ciphertext = data.slice(payloadOffset + SALT_LENGTH + IV_LENGTH)
  const key = await deriveKey(password, salt.buffer as ArrayBuffer, iterations)
  const decrypted = await crypto.subtle.decrypt({ iv: iv.buffer as ArrayBuffer, name: 'AES-GCM' }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

export async function aesEncrypt(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt.buffer as ArrayBuffer, PBKDF2_ITERATIONS_V2)

  const ciphertext = await crypto.subtle.encrypt(
    { iv: iv.buffer as ArrayBuffer, name: 'AES-GCM' },
    key,
    encoder.encode(plaintext),
  )

  // v2: version || salt || iv || ciphertext
  const combined = new Uint8Array(1 + salt.length + iv.length + new Uint8Array(ciphertext).length)
  combined[0] = VERSION_V2
  combined.set(salt, 1)
  combined.set(iv, 1 + salt.length)
  combined.set(new Uint8Array(ciphertext), 1 + salt.length + iv.length)

  return arrayBufferToBase64(combined.buffer as ArrayBuffer)
}

export async function aesDecrypt(encrypted: string, password: string): Promise<string> {
  const data = new Uint8Array(base64ToArrayBuffer(encrypted))

  if (data.length > 0 && data[0] === VERSION_V2) {
    try {
      return await decryptWithLayout(data, password, 1, PBKDF2_ITERATIONS_V2)
    } catch {
      // First byte happened to collide with VERSION_V2 on a legacy blob — fall through.
    }
  }

  return decryptWithLayout(data, password, 0, PBKDF2_ITERATIONS_V1)
}
