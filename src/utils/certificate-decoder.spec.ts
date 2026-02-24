import { describe, expect, it, vi } from 'vitest'

import {
  formatDistinguishedName,
  getValidityStatus,
  isValidPemCertificate,
  parsePemCertificate,
} from './certificate-decoder'

// Self-signed RSA 2048 cert with SAN, Key Usage, EKU, Basic Constraints
// CN=test.example.com, O=Test Org, C=US
// SAN: DNS:test.example.com, DNS:www.test.example.com, IP:127.0.0.1
// Valid: 2026-02-24 to 2027-02-24
const VALID_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIDvjCCAqagAwIBAgIUDEuElwk2Ce7TKKXReJ3wEnCVHqUwDQYJKoZIhvcNAQEL
BQAwOzEZMBcGA1UEAwwQdGVzdC5leGFtcGxlLmNvbTERMA8GA1UECgwIVGVzdCBP
cmcxCzAJBgNVBAYTAlVTMB4XDTI2MDIyNDA5NDUyMFoXDTI3MDIyNDA5NDUyMFow
OzEZMBcGA1UEAwwQdGVzdC5leGFtcGxlLmNvbTERMA8GA1UECgwIVGVzdCBPcmcx
CzAJBgNVBAYTAlVTMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAp6kC
ZS+8HC+laVdGsUfi2xO96tmqYz5wREBXR2Oab3sV6SK9NpciKQpZiPGQelNhL9OQ
f4xAaAYcrcuSiRsnk/wV30L+YKFAhhioIcTdQZfHpzxnf1IUePBbNWzwuFfCMiHV
BHJO9YY6tCakqlmRqoir98UZJIB3kWRIA6UXXvAHfNErwBl8k5uiDulHfUQjlm65
CXXnQQtVMscNVjzKRT6JZBtewqW0wwWJhrqUqEyOrQQg8yYlJvnfMTSy0WJu8483
HzmwfOUtzcE73Fr1Ab5wBBdNbfBpACa6oXDWhQchOqX+0qSSKl6Ques5VQ8KxPGQ
9QJqNetfNCaPOiHmlQIDAQABo4G5MIG2MB0GA1UdDgQWBBRw7g8Knu0JC+jQd58Q
fzrFn1cIvTAfBgNVHSMEGDAWgBRw7g8Knu0JC+jQd58QfzrFn1cIvTAPBgNVHRMB
Af8EBTADAQH/MDcGA1UdEQQwMC6CEHRlc3QuZXhhbXBsZS5jb22CFHd3dy50ZXN0
LmV4YW1wbGUuY29thwR/AAABMAsGA1UdDwQEAwIFoDAdBgNVHSUEFjAUBggrBgEF
BQcDAQYIKwYBBQUHAwIwDQYJKoZIhvcNAQELBQADggEBADH8L/RGhXIDA0fd9bzp
fiyx6/xvkSympGVmb38H/eTKfEX+eSgDl/tMtJ1KmffH/X8/Ort1dkpuhfizTskG
FeZjvl0+mE0N4CtqOqZ4RIQLYhpr6aCLikzw+IrSIQeisP3wCcnJ7E+GqS8jq/Oj
kzhArLnUJM6d7I8cl4srzFq/fYffcaaEilRS5hUEdg9sUP1NQOv0FB8FW7QOIyoD
vdLVIzYfnX37nwTOQuX7ib5NbVhQxu3oO9t2CHTx5UlShamOCk/TbTgTGrTZPCqa
dLSsb43PEQxE11zAMRw6DzJUvK1RGD6Soi+G1PIhw7CZIYoA1aZYSJXkA2BA/mAd
K7s=
-----END CERTIFICATE-----`

// Cert with short validity for testing expired status
// CN=expired.example.com, O=Expired Org, C=US
// Valid: 2026-02-24 to 2026-02-25
const SHORT_LIVED_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIDYzCCAkugAwIBAgIUMmfl8tAi7Jv+8Bvaf4CxY5lbYVcwDQYJKoZIhvcNAQEL
BQAwQTEcMBoGA1UEAwwTZXhwaXJlZC5leGFtcGxlLmNvbTEUMBIGA1UECgwLRXhw
aXJlZCBPcmcxCzAJBgNVBAYTAlVTMB4XDTI2MDIyNDA5NDcwNloXDTI2MDIyNTA5
NDcwNlowQTEcMBoGA1UEAwwTZXhwaXJlZC5leGFtcGxlLmNvbTEUMBIGA1UECgwL
RXhwaXJlZCBPcmcxCzAJBgNVBAYTAlVTMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEA31iPkwcAGgbLbVyi0LPTAjlisJdoVY+1pbm5bqJDjYtXcC8LYWfi
kaSUxQlokRBHP4ss0CHmenwuLAbcaSrJH54anZPBZfdtGuOdwIyEYOSmLKJ/Sa97
U1mJOyBQGJ/hMSI6mP5KJLBM/EPNLkN8gLilVPmXWfHubr0lAkPacEiJXo/aKmLE
y9QRFqliWPa+4jr/QvVZAoDNxHe8gpPW+/sIZUpzrLBojVzrNrvZDEe8RdWc2Ei1
WV9NNYtMmYX2t4GypznNdSqewRmjCapEw5MlT85KnOt7MWKiFsZN9nFH2eSWfjI4
X4poXwEi4dd0LWMGvEvGFYrcLO11fBviPwIDAQABo1MwUTAdBgNVHQ4EFgQU48WG
0II939MzCJMRFtw4t15jgvQwHwYDVR0jBBgwFoAU48WG0II939MzCJMRFtw4t15j
gvQwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAgAeEjBYkZ4Y8
kv9T/GEJUSeaNcpx8UT8IY5dT9L/uQ7Qg7pE1UYvdBTN8BoxzQmkAEbXnrT0Lx8N
e68rUQg+IjJ6AXLwD4icUrRzlfCRyxkInfJIiNgnKQi/qpSnCEiAUgP6Tx78MLRC
lmZkZ2laEDrbyqC16ero7MHqUf1upmRbNHnwn0/5IWkJIAKPiYG1UvMW6JNLyyuD
rjtTDbuf1aLgvYOOE8MIHGEuCrVfm3x3j9ilTILK9YkUVN+fo1QTPmZUNNTVBZ4e
2NZV9mWnoZEeitcLit3Jc7gIfsPFKtQ4rajwgFEZw6x6BJD1tqDC+KHv1QmfBec5
Q0xN26FZBg==
-----END CERTIFICATE-----`

describe('certificate-decoder', () => {
  describe('getValidityStatus', () => {
    it('returns "valid" when now is between notBefore and notAfter', () => {
      const notBefore = new Date('2024-01-01')
      const notAfter = new Date('2028-01-01')
      const now = new Date('2026-06-15')
      expect(getValidityStatus(notBefore, notAfter, now)).toBe('valid')
    })

    it('returns "expired" when now is after notAfter', () => {
      const notBefore = new Date('2020-01-01')
      const notAfter = new Date('2021-01-01')
      const now = new Date('2026-06-15')
      expect(getValidityStatus(notBefore, notAfter, now)).toBe('expired')
    })

    it('returns "not-yet-valid" when now is before notBefore', () => {
      const notBefore = new Date('2030-01-01')
      const notAfter = new Date('2031-01-01')
      const now = new Date('2026-06-15')
      expect(getValidityStatus(notBefore, notAfter, now)).toBe('not-yet-valid')
    })
  })

  describe('isValidPemCertificate', () => {
    it('returns true for valid PEM certificate', () => {
      expect(isValidPemCertificate('-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----')).toBe(true)
    })

    it('returns false for random string', () => {
      expect(isValidPemCertificate('not a certificate')).toBe(false)
    })

    it('returns false for private key PEM', () => {
      expect(isValidPemCertificate('-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidPemCertificate('')).toBe(false)
    })
  })

  describe('formatDistinguishedName', () => {
    it('formats a DN string with proper spacing', () => {
      expect(formatDistinguishedName('CN=test.example.com, O=Test Org, C=US')).toBe(
        'CN=test.example.com, O=Test Org, C=US',
      )
    })

    it('trims extra spaces from DN parts', () => {
      expect(formatDistinguishedName('CN=test.example.com ,  O=Test Org ,C=US')).toBe(
        'CN=test.example.com, O=Test Org, C=US',
      )
    })
  })

  describe('parsePemCertificate', () => {
    it('returns correct Subject, Issuer, Serial Number, dates, and algorithm for a valid cert', async () => {
      const result = await parsePemCertificate(VALID_CERT_PEM)

      expect(result.subject).toContain('test.example.com')
      expect(result.subject).toContain('Test Org')
      expect(result.subject).toContain('US')
      expect(result.issuer).toContain('test.example.com')
      expect(result.serialNumber).toMatch(/^[0-9a-f]{2}(:[0-9a-f]{2})*$/)
      expect(result.notBefore).toBeInstanceOf(Date)
      expect(result.notAfter).toBeInstanceOf(Date)
      expect(result.publicKeyAlgorithm).toBe('RSA')
      expect(result.publicKeySize).toBe(2048)
      expect(result.signatureAlgorithm).toContain('SHA-256')
    })

    it('returns SAN extension with DNS names for cert with SAN', async () => {
      const result = await parsePemCertificate(VALID_CERT_PEM)

      const sanExt = result.extensions.find((e) => e.name === 'Subject Alternative Name')
      expect(sanExt).toBeDefined()
      expect(sanExt!.value).toContain('DNS:test.example.com')
      expect(sanExt!.value).toContain('DNS:www.test.example.com')
      expect(sanExt!.value).toContain('IP:127.0.0.1')
    })

    it('returns Key Usage extension values', async () => {
      const result = await parsePemCertificate(VALID_CERT_PEM)

      const kuExt = result.extensions.find((e) => e.name === 'Key Usage')
      expect(kuExt).toBeDefined()
      expect(kuExt!.value).toContain('Digital Signature')
      expect(kuExt!.value).toContain('Key Encipherment')
    })

    it('returns expired validityStatus for cert checked after expiry', async () => {
      // Mock Date.now to a time after the short-lived cert expires
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))

      try {
        const result = await parsePemCertificate(SHORT_LIVED_CERT_PEM)
        expect(result.validityStatus).toBe('expired')
        expect(result.isValid).toBe(false)
      } finally {
        vi.useRealTimers()
      }
    })

    it('throws with security warning for private key input', async () => {
      const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...fake...
-----END RSA PRIVATE KEY-----`

      await expect(parsePemCertificate(privateKey)).rejects.toThrow(
        'This appears to be a private key. Only paste certificates for security.',
      )
    })

    it('throws with format error for invalid PEM', async () => {
      await expect(parsePemCertificate('this is not a certificate')).rejects.toThrow(
        'Certificate format not recognized',
      )
    })

    it('throws with clear message for non-certificate PEM (e.g., CSR)', async () => {
      const csr = `-----BEGIN CERTIFICATE REQUEST-----
MIICYDCCAUgCAQAwGzEZMBcGA1UE...fake...
-----END CERTIFICATE REQUEST-----`

      await expect(parsePemCertificate(csr)).rejects.toThrow(
        'This does not appear to be a certificate. Paste a PEM-encoded X.509 certificate.',
      )
    })

    it('throws for oversized input', async () => {
      const oversized = '-----BEGIN CERTIFICATE-----\n' + 'A'.repeat(40_000) + '\n-----END CERTIFICATE-----'
      await expect(parsePemCertificate(oversized)).rejects.toThrow('Input too large')
    })

    it('returns extensions array with name, oid, critical, and value', async () => {
      const result = await parsePemCertificate(VALID_CERT_PEM)

      expect(result.extensions.length).toBeGreaterThan(0)
      for (const ext of result.extensions) {
        expect(ext).toHaveProperty('name')
        expect(ext).toHaveProperty('oid')
        expect(ext).toHaveProperty('critical')
        expect(ext).toHaveProperty('value')
        expect(typeof ext.name).toBe('string')
        expect(typeof ext.oid).toBe('string')
        expect(typeof ext.critical).toBe('boolean')
        expect(typeof ext.value).toBe('string')
      }
    })
  })
})
