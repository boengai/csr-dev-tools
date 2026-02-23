import { describe, expect, it } from 'vitest'

import {
  KNOWN_KEY_TYPES,
  analyzeSshKey,
  getRsaBitLength,
  isValidSshPublicKey,
  md5Fingerprint,
  parseAuthorizedKeysLine,
  sha256Fingerprint,
} from './ssh-fingerprint'

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
  describe('KNOWN_KEY_TYPES', () => {
    it('contains all 8 supported key types', () => {
      expect(KNOWN_KEY_TYPES.size).toBe(8)
      expect(KNOWN_KEY_TYPES.has('ssh-rsa')).toBe(true)
      expect(KNOWN_KEY_TYPES.has('ssh-ed25519')).toBe(true)
      expect(KNOWN_KEY_TYPES.has('ecdsa-sha2-nistp256')).toBe(true)
      expect(KNOWN_KEY_TYPES.has('ecdsa-sha2-nistp384')).toBe(true)
      expect(KNOWN_KEY_TYPES.has('ecdsa-sha2-nistp521')).toBe(true)
      expect(KNOWN_KEY_TYPES.has('sk-ssh-ed25519@openssh.com')).toBe(true)
      expect(KNOWN_KEY_TYPES.has('sk-ecdsa-sha2-nistp256@openssh.com')).toBe(true)
      expect(KNOWN_KEY_TYPES.has('ssh-dss')).toBe(true)
    })
  })

  describe('parseAuthorizedKeysLine', () => {
    it('extracts keyType, keyBlob, and comment from ssh-rsa line', () => {
      const result = parseAuthorizedKeysLine(TEST_RSA_KEY)
      expect(result).not.toBeNull()
      expect(result!.keyType).toBe('ssh-rsa')
      expect(result!.keyBlob).toMatch(/^AAAA/)
      expect(result!.comment).toBe('test-rsa@example.com')
    })

    it('extracts keyType and keyBlob from ssh-ed25519 line with no comment', () => {
      const keyNoComment = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGwOFE3jdXhaTQ2iNwU52q9E9yO1HV35G3BXiLyTuNdY'
      const result = parseAuthorizedKeysLine(keyNoComment)
      expect(result).not.toBeNull()
      expect(result!.keyType).toBe('ssh-ed25519')
      expect(result!.comment).toBe('')
    })

    it('extracts keyType and comment from ecdsa-sha2-nistp256 line', () => {
      const ecdsaKey = 'ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABB mykey@host'
      const result = parseAuthorizedKeysLine(ecdsaKey)
      expect(result).not.toBeNull()
      expect(result!.keyType).toBe('ecdsa-sha2-nistp256')
      expect(result!.comment).toBe('mykey@host')
    })

    it('handles options prefix', () => {
      const line = `restrict,command="ls" ssh-rsa ${TEST_RSA_KEY.split(' ')[1]} user@host`
      const result = parseAuthorizedKeysLine(line)
      expect(result).not.toBeNull()
      expect(result!.keyType).toBe('ssh-rsa')
      expect(result!.comment).toBe('user@host')
    })

    it('returns null for empty or comment lines', () => {
      expect(parseAuthorizedKeysLine('')).toBeNull()
      expect(parseAuthorizedKeysLine('   ')).toBeNull()
      expect(parseAuthorizedKeysLine('# This is a comment')).toBeNull()
    })

    it('returns null for unknown key type', () => {
      expect(parseAuthorizedKeysLine('unknown-type AAAA data')).toBeNull()
    })
  })

  describe('getRsaBitLength', () => {
    it('calculates 2048 bits for a 256-byte modulus', () => {
      const modulus = new Uint8Array(256)
      modulus[0] = 0x80
      expect(getRsaBitLength(modulus)).toBe(2048)
    })

    it('calculates 4096 bits for a 512-byte modulus', () => {
      const modulus = new Uint8Array(512)
      modulus[0] = 0x80
      expect(getRsaBitLength(modulus)).toBe(4096)
    })

    it('strips leading 0x00 padding byte', () => {
      const modulus = new Uint8Array(257)
      modulus[0] = 0x00
      modulus[1] = 0x80
      expect(getRsaBitLength(modulus)).toBe(2048)
    })
  })

  describe('sha256Fingerprint', () => {
    it('returns SHA256 fingerprint for RSA test key', async () => {
      const keyBlob = TEST_RSA_KEY.split(' ')[1]
      const result = await sha256Fingerprint(keyBlob)
      expect(result).toBe(TEST_RSA_SHA256)
    })

    it('returns SHA256 fingerprint for Ed25519 test key', async () => {
      const keyBlob = TEST_ED25519_KEY.split(' ')[1]
      const result = await sha256Fingerprint(keyBlob)
      expect(result).toBe(TEST_ED25519_SHA256)
    })
  })

  describe('md5Fingerprint', () => {
    it('returns colon-separated hex format for RSA test key', () => {
      const keyBlob = TEST_RSA_KEY.split(' ')[1]
      const result = md5Fingerprint(keyBlob)
      expect(result).toBe(TEST_RSA_MD5)
    })

    it('returns colon-separated hex format for Ed25519 test key', () => {
      const keyBlob = TEST_ED25519_KEY.split(' ')[1]
      const result = md5Fingerprint(keyBlob)
      expect(result).toBe(TEST_ED25519_MD5)
    })

    it('produces colon-separated hex pairs pattern', () => {
      const keyBlob = TEST_RSA_KEY.split(' ')[1]
      const result = md5Fingerprint(keyBlob)
      expect(result).toMatch(/^[0-9a-f]{2}(:[0-9a-f]{2}){15}$/)
    })
  })

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

  describe('isValidSshPublicKey', () => {
    it('returns true for valid ssh-rsa key', () => {
      expect(isValidSshPublicKey(TEST_RSA_KEY)).toBe(true)
    })

    it('returns true for valid ssh-ed25519 key', () => {
      expect(isValidSshPublicKey(TEST_ED25519_KEY)).toBe(true)
    })

    it('returns false for random strings', () => {
      expect(isValidSshPublicKey('hello world')).toBe(false)
      expect(isValidSshPublicKey('')).toBe(false)
      expect(isValidSshPublicKey('not-a-key AAAA')).toBe(false)
    })

    it('returns true for key with options prefix', () => {
      expect(isValidSshPublicKey(`restrict ssh-rsa ${TEST_RSA_KEY.split(' ')[1]}`)).toBe(true)
    })
  })
})
