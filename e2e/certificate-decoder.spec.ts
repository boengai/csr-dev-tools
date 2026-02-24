import { expect, test } from '@playwright/test'

import { card, copyButton, toast } from './helpers/selectors'

// Self-signed RSA 2048 cert with SAN, Key Usage, EKU, Basic Constraints
// CN=test.example.com, O=Test Org, C=US — valid 2026-02-24 to 2027-02-24
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

// Already-expired cert: CN=expired.example.com, O=Expired Org, C=US
// Valid 2025-01-01 to 2025-01-02 (expired over a year ago)
const EXPIRED_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIDYzCCAkugAwIBAgIURwiuVs+u5QsaVIaByfv45dbgX5UwDQYJKoZIhvcNAQEL
BQAwQTEcMBoGA1UEAwwTZXhwaXJlZC5leGFtcGxlLmNvbTEUMBIGA1UECgwLRXhw
aXJlZCBPcmcxCzAJBgNVBAYTAlVTMB4XDTI1MDEwMTAwMDAwMFoXDTI1MDEwMjAw
MDAwMFowQTEcMBoGA1UEAwwTZXhwaXJlZC5leGFtcGxlLmNvbTEUMBIGA1UECgwL
RXhwaXJlZCBPcmcxCzAJBgNVBAYTAlVTMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAljeC/RiLgF0LilK1OavKSHd0x39eB/JAPMHCBMSsQwH1YewRQQd6
C8OGzbSx1ytwjYuSwMbI+frfV/nb4kZ2D+zvS5XDLeademPVhbDEodCOA+VF7dIo
cveXwTAFdXmeVt2WcARPtJwntHiDiwsl4kscKmU+o9e/kHtOsedNNbSbBnibgeTf
stryte8/o+Y1DfcWKS/xL6SHM5D7QoGy3ovU0bWQViZ4USk0QymDGVzYAVimPIyS
EddzhQHVrBuQMeXXVXjWRTBWl6vv601oMYDwd1NEYkpo0h02XVpxvdxqC9E3Hd4j
sKNTHGf0EIeexGuwfk0pDB57iKIQv9BTGwIDAQABo1MwUTAdBgNVHQ4EFgQUsdcV
KJY5GmW8FIvKVg9QBea/kjUwHwYDVR0jBBgwFoAUsdcVKJY5GmW8FIvKVg9QBea/
kjUwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAXPKaQqhGQkt4
O5fGBhbq1ecImWut9KOo7mYxZBq2ym956xzdyi1NsCD3EMMh+xXbuRIPQEjdumDZ
WAFASvZeIhtVcfWEKrKJwTmU6tkw5ouE1BD6fCWS+3fjM/in33gstgj724WSvG2b
vneSK4vZ/GRT9VjhwBv+Uwucdokqgb9/An11/i4IBlLIBFqEfl7otxRWTdYLhek4
FY/2K9QWJpr0UqsMSo1WMfB/VcbYo9L12+porlYTSeAgcL8W6kIyQF8RVyMu7l/X
k41zjWrIgjAUj9LYipm4pBUjbpEp6hAwDXRcegK9LyIY3Q3nAUGmHAfzqBfFKHdP
MWAkWb7IFQ==
-----END CERTIFICATE-----`

test.describe('Certificate Decoder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/certificate-decoder')
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Certificate Decoder')).toBeVisible()
    await expect(
      page.getByText(
        'Paste a PEM-encoded X.509 certificate to view its subject, issuer, validity, extensions, and more.',
      ),
    ).toBeVisible()
  })

  test('paste valid PEM certificate → Subject, Issuer, Serial Number, dates, algorithms displayed', async ({
    page,
  }) => {
    await page.locator('textarea').fill(VALID_CERT_PEM)

    await expect(page.getByText('test.example.com')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Test Org')).toBeVisible()
    await expect(page.getByText('Serial Number')).toBeVisible()
    await expect(page.getByText('RSA 2048 bits')).toBeVisible()
    await expect(page.getByText('SHA-256 with RSA')).toBeVisible()
  })

  test('paste cert with SAN extension → extension values displayed', async ({ page }) => {
    await page.locator('textarea').fill(VALID_CERT_PEM)

    await expect(page.getByText('Subject Alternative Name')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('DNS:test.example.com')).toBeVisible()
    await expect(page.getByText('DNS:www.test.example.com')).toBeVisible()
    await expect(page.getByText('IP:127.0.0.1')).toBeVisible()
  })

  test('paste valid cert → "Valid" status indicator shown', async ({ page }) => {
    await page.locator('textarea').fill(VALID_CERT_PEM)

    await expect(page.getByText('Valid', { exact: false })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('✓')).toBeVisible()
  })

  test('paste expired cert → "Expired" status indicator shown', async ({ page }) => {
    await page.locator('textarea').fill(EXPIRED_CERT_PEM)

    await expect(page.getByText('Expired', { exact: false })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('✗')).toBeVisible()
    await expect(page.getByText('expired.example.com')).toBeVisible()
  })

  test('paste invalid PEM → error toast shown', async ({ page }) => {
    await page.locator('textarea').fill('this is not a certificate')

    await expect(toast.message(page, 'Certificate format not recognized. Paste a PEM-encoded certificate (-----BEGIN CERTIFICATE-----)')).toBeVisible({
      timeout: 3000,
    })
  })

  test('click CopyButton for Subject → clipboard copy toast shown', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.locator('textarea').fill(VALID_CERT_PEM)

    await expect(page.getByText('test.example.com')).toBeVisible({ timeout: 5000 })
    await copyButton.byLabel(page, 'Subject').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('mobile viewport (375px) responsiveness', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.locator('textarea')).toBeVisible()

    await page.locator('textarea').fill(VALID_CERT_PEM)
    await expect(page.getByText('test.example.com')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('RSA 2048 bits')).toBeVisible()
  })

  test('paste private key → security warning toast shown', async ({ page }) => {
    const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...fake...
-----END RSA PRIVATE KEY-----`

    await page.locator('textarea').fill(privateKey)

    await expect(
      toast.message(page, 'This appears to be a private key. Only paste certificates for security.'),
    ).toBeVisible({ timeout: 3000 })
  })
})
