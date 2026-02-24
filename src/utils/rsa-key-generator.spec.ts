import { describe, expect, it } from 'vitest'

import { arrayBufferToPem, generateRsaKeyPair } from '@/utils/rsa-key-generator'

describe('rsa-key-generator', () => {
  describe('arrayBufferToPem', () => {
    it('wraps buffer with PUBLIC KEY header and footer', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer
      const pem = arrayBufferToPem(buffer, 'PUBLIC KEY')

      expect(pem).toMatch(/^-----BEGIN PUBLIC KEY-----/)
      expect(pem).toMatch(/-----END PUBLIC KEY-----$/)
    })

    it('produces lines no longer than 64 characters (excluding header/footer)', () => {
      // Create a buffer large enough to produce multiple lines
      const buffer = new Uint8Array(256).buffer
      const pem = arrayBufferToPem(buffer, 'PUBLIC KEY')
      const lines = pem.split('\n')

      // Skip header (first) and footer (last) lines
      const bodyLines = lines.slice(1, -1)
      for (const line of bodyLines) {
        expect(line.length).toBeLessThanOrEqual(64)
      }
    })

    it('wraps buffer with PRIVATE KEY header and footer', () => {
      const buffer = new Uint8Array([10, 20, 30]).buffer
      const pem = arrayBufferToPem(buffer, 'PRIVATE KEY')

      expect(pem).toMatch(/^-----BEGIN PRIVATE KEY-----/)
      expect(pem).toMatch(/-----END PRIVATE KEY-----$/)
    })
  })

  describe('generateRsaKeyPair', () => {
    it('returns valid PEM-formatted keys for 2048-bit', async () => {
      const keyPair = await generateRsaKeyPair(2048)

      expect(keyPair.publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/)
      expect(keyPair.publicKey).toMatch(/-----END PUBLIC KEY-----$/)
      expect(keyPair.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/)
      expect(keyPair.privateKey).toMatch(/-----END PRIVATE KEY-----$/)
    })

    it('returns different public and private keys for 2048-bit', async () => {
      const keyPair = await generateRsaKeyPair(2048)

      expect(keyPair.publicKey).not.toBe(keyPair.privateKey)
    })

    it('returns valid PEM-formatted keys for 4096-bit', async () => {
      const keyPair = await generateRsaKeyPair(4096)

      expect(keyPair.publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/)
      expect(keyPair.publicKey).toMatch(/-----END PUBLIC KEY-----$/)
      expect(keyPair.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/)
      expect(keyPair.privateKey).toMatch(/-----END PRIVATE KEY-----$/)
    }, 10_000)

    it('produces different key pairs on consecutive calls', async () => {
      const keyPair1 = await generateRsaKeyPair(2048)
      const keyPair2 = await generateRsaKeyPair(2048)

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey)
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey)
    })
  })
})
