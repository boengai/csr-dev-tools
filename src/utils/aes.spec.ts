import { describe, expect, it } from 'vitest'

import { aesDecrypt, aesEncrypt } from './aes'

describe('aesEncrypt / aesDecrypt', () => {
  it('should roundtrip encrypt and decrypt', async () => {
    const plaintext = 'Hello, World!'
    const password = 'my-secret-password'
    const encrypted = await aesEncrypt(plaintext, password)
    const decrypted = await aesDecrypt(encrypted, password)
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertexts for same input (random salt/iv)', async () => {
    const plaintext = 'test'
    const password = 'pass'
    const a = await aesEncrypt(plaintext, password)
    const b = await aesEncrypt(plaintext, password)
    expect(a).not.toBe(b)
  })

  it('should fail with wrong password', async () => {
    const encrypted = await aesEncrypt('secret data', 'correct-password')
    await expect(aesDecrypt(encrypted, 'wrong-password')).rejects.toThrow()
  })

  it('should handle empty plaintext', async () => {
    const encrypted = await aesEncrypt('', 'password')
    const decrypted = await aesDecrypt(encrypted, 'password')
    expect(decrypted).toBe('')
  })

  it('should handle unicode text', async () => {
    const plaintext = '日本語テスト 🔐'
    const password = 'pass'
    const encrypted = await aesEncrypt(plaintext, password)
    const decrypted = await aesDecrypt(encrypted, password)
    expect(decrypted).toBe(plaintext)
  })

  it('should decrypt legacy v1 blobs (no version byte, 100k iterations)', async () => {
    const plaintext = 'legacy data'
    const password = 'legacy-pass'

    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { hash: 'SHA-256', iterations: 100_000, name: 'PBKDF2', salt: salt.buffer as ArrayBuffer },
      keyMaterial,
      { length: 256, name: 'AES-GCM' },
      false,
      ['decrypt', 'encrypt'],
    )
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({ iv: iv.buffer as ArrayBuffer, name: 'AES-GCM' }, key, encoder.encode(plaintext)),
    )

    const legacy = new Uint8Array(salt.length + iv.length + ciphertext.length)
    legacy.set(salt, 0)
    legacy.set(iv, salt.length)
    legacy.set(ciphertext, salt.length + iv.length)

    let binary = ''
    for (const b of legacy) binary += String.fromCharCode(b)
    const legacyBlob = btoa(binary)

    const decrypted = await aesDecrypt(legacyBlob, password)
    expect(decrypted).toBe(plaintext)
  })
})
