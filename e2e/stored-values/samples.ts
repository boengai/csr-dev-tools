import { jwtData } from '../helpers/fixtures'

/**
 * Valid input for each Tool that saves nothing (keys.json → neverSaved), so
 * its never-saved journey reaches a successful result: a write made only
 * after the input is processed would still be caught. The certificate and
 * SSH key are copies of those in certificate-decoder.spec.ts and
 * ssh-key-fingerprint.spec.ts.
 */
export const NEVER_SAVED_SAMPLES: Record<string, string> = {
  'aes-encrypt-decrypt': 'plain text',
  'base64-to-image': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'certificate-decoder': `-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----`,
  'hash-generator': 'Hello, World!',
  'hmac-generator': 'my-secret-key',
  'jwt-decoder': jwtData.token,
  'markdown-preview': '# Hello',
  'qr-code-generator': 'https://example.com',
  'ssh-key-fingerprint':
    'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGwOFE3jdXhaTQ2iNwU52q9E9yO1HV35G3BXiLyTuNdY test-ed25519@example.com',
  'svg-viewer': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
  'unix-timestamp': '1700000000',
  'url-parser': 'https://user:pass@example.com:8080/path?token=abc#top',
}
