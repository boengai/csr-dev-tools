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
})
