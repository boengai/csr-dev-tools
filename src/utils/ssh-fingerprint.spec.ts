import { describe, expect, it } from 'vitest'

import { analyzeSshKey } from './ssh-fingerprint'

// Test keys generated via ssh-keygen with verified fingerprints
const TEST_RSA_KEY =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDPZtM8NaxkAVu6E2lXUpBoqgWh24W0WNULU3r0fVOtpg8apbZPE/GkbAayJl9V31R2Y2aD1QKa+6rjOYSpoloJfEDoIBwoFWtBT8UybD873ji5jKXP0WZ2Fb6SEZRNu6wirWAA7Abhox5I38yYJ3hk9m6/9t/5GB8/AHkpsZ09Wow7UbId8NWkhZa+PYpNM6rCp9fZixFAX+fzjT6KCeei5SD6bH0pq0xvfWmkab6kIyrqLS2kiZpSm9s7O5jlbdHxgkU/SqHquyl8MSXSosnSPBbpYmIIKyG3pJr8PzzzAO9WQ9MSRx3MBGQVnvsN78zRD11sA3Rn5OuOZrZdt6et test-rsa@example.com'

const TEST_RSA_SHA256 = 'SHA256:pERfJJCOe2869DlOwj6aMlgkqnFuTf77U88HfbZgz9A'
const TEST_RSA_MD5 = '0f:34:5f:24:06:6b:21:50:aa:20:17:65:d7:f3:e8:9c'

const TEST_ED25519_KEY =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGwOFE3jdXhaTQ2iNwU52q9E9yO1HV35G3BXiLyTuNdY test-ed25519@example.com'

const TEST_ED25519_SHA256 = 'SHA256:Kxyvd3F2U3kIp3JOSsiKwN38RBXo5Osm8qUh15q5jYs'
const TEST_ED25519_MD5 = '86:d9:ae:20:a9:24:04:8a:52:08:3d:84:0b:04:7e:53'

describe('ssh-fingerprint', () => {
  describe('analyzeSshKey', () => {
    it('returns correct fingerprints, type, and bit size for ssh-rsa key', async () => {
      const result = await analyzeSshKey(TEST_RSA_KEY)
      expect(result.keyType).toBe('ssh-rsa')
      expect(result.bits).toBe(2048)
      expect(result.sha256Fingerprint).toBe(TEST_RSA_SHA256)
      expect(result.md5Fingerprint).toBe(TEST_RSA_MD5)
      expect(result.comment).toBe('test-rsa@example.com')
    })

    it('returns bits=256 for ssh-ed25519 key', async () => {
      const result = await analyzeSshKey(TEST_ED25519_KEY)
      expect(result.keyType).toBe('ssh-ed25519')
      expect(result.bits).toBe(256)
      expect(result.sha256Fingerprint).toBe(TEST_ED25519_SHA256)
      expect(result.md5Fingerprint).toBe(TEST_ED25519_MD5)
      expect(result.comment).toBe('test-ed25519@example.com')
    })

    it('throws with private key warning for private key input', async () => {
      const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`
      await expect(analyzeSshKey(privateKey)).rejects.toThrow(
        'This appears to be a private key. Only paste public keys for security.',
      )
    })

    it('throws for malformed base64', async () => {
      await expect(analyzeSshKey('ssh-rsa !!!invalid-base64!!! user@host')).rejects.toThrow(
        'SSH key format not recognized',
      )
    })

    it('throws for unrecognized format', async () => {
      await expect(analyzeSshKey('not a key at all')).rejects.toThrow('SSH key format not recognized')
    })

    it('throws for input exceeding 16KB', async () => {
      const largeInput = 'ssh-rsa ' + 'A'.repeat(16_385)
      await expect(analyzeSshKey(largeInput)).rejects.toThrow('Input too large')
    })
  })
})
