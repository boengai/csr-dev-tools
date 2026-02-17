const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

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

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])

  return crypto.subtle.deriveKey(
    {
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      name: 'PBKDF2',
      salt,
    },
    keyMaterial,
    { length: 256, name: 'AES-GCM' },
    false,
    ['decrypt', 'encrypt'],
  )
}

export async function aesEncrypt(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt({ iv, name: 'AES-GCM' }, key, encoder.encode(plaintext))

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

  return arrayBufferToBase64(combined.buffer as ArrayBuffer)
}

export async function aesDecrypt(encrypted: string, password: string): Promise<string> {
  const data = new Uint8Array(base64ToArrayBuffer(encrypted))

  const salt = data.slice(0, SALT_LENGTH)
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH)

  const key = await deriveKey(password, salt)

  const decrypted = await crypto.subtle.decrypt({ iv, name: 'AES-GCM' }, key, ciphertext)

  return new TextDecoder().decode(decrypted)
}
