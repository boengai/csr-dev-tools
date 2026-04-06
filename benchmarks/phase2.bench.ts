import { bench, describe } from 'vitest'

describe('bcrypt Hash (cost 4)', () => {
  bench('WASM csr-bcrypt hash', async () => {
    const { hashPassword } = await import('../src/wasm/csr-bcrypt')
    await hashPassword('testpassword', 4)
  })
})

describe('bcrypt Verify (cost 4)', () => {
  bench('WASM csr-bcrypt hash+verify', async () => {
    const { hashPassword, verifyPassword } = await import('../src/wasm/csr-bcrypt')
    const hash = await hashPassword('testpassword', 4)
    await verifyPassword('testpassword', hash)
  })
})

describe('HMAC-SHA256', () => {
  const key = 'secret-key-for-benchmarking'
  const shortMessage = 'hello world'
  const largeMessage = 'a'.repeat(100_000)

  bench('WASM hmac_sha256 (short)', async () => {
    const { generateHmac } = await import('../src/wasm/csr-hmac')
    await generateHmac(shortMessage, key, 'SHA-256', 'hex')
  })

  bench('Web Crypto HMAC-SHA256 (short, baseline)', async () => {
    const encoder = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { hash: 'SHA-256', name: 'HMAC' },
      false,
      ['sign'],
    )
    await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(shortMessage))
  })

  bench('WASM hmac_sha256 (100KB)', async () => {
    const { generateHmac } = await import('../src/wasm/csr-hmac')
    await generateHmac(largeMessage, key, 'SHA-256', 'hex')
  })

  bench('Web Crypto HMAC-SHA256 (100KB, baseline)', async () => {
    const encoder = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { hash: 'SHA-256', name: 'HMAC' },
      false,
      ['sign'],
    )
    await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(largeMessage))
  })
})

describe('HMAC-SHA512', () => {
  const key = 'secret-key-for-benchmarking'
  const message = 'hello world'

  bench('WASM hmac_sha512', async () => {
    const { generateHmac } = await import('../src/wasm/csr-hmac')
    await generateHmac(message, key, 'SHA-512', 'hex')
  })

  bench('Web Crypto HMAC-SHA512 (baseline)', async () => {
    const encoder = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { hash: 'SHA-512', name: 'HMAC' },
      false,
      ['sign'],
    )
    await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  })
})
