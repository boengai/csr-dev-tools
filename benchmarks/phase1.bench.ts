import { bench, describe } from 'vitest'

describe('MD5 Hash', () => {
  const shortInput = 'hello world'
  const largeInput = 'a'.repeat(1_000_000)

  bench('WASM md5 (short)', async () => {
    const { md5 } = await import('../src/wasm/csr-hash')
    await md5(shortInput)
  })

  bench('Web Crypto SHA-256 (short, baseline)', async () => {
    const data = new TextEncoder().encode(shortInput)
    await crypto.subtle.digest('SHA-256', data)
  })

  bench('WASM md5 (1MB)', async () => {
    const { md5 } = await import('../src/wasm/csr-hash')
    await md5(largeInput)
  })

  bench('Web Crypto SHA-256 (1MB, baseline)', async () => {
    const data = new TextEncoder().encode(largeInput)
    await crypto.subtle.digest('SHA-256', data)
  })
})

describe('Number Base Conversion', () => {
  const large = '9007199254740993'

  bench('WASM convertBase (large)', async () => {
    const { convertBase } = await import('../src/wasm/csr-number-base')
    await convertBase(large, 10, 16)
  })

  bench('JS convertBase (large)', () => {
    const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'
    const cleaned = large.trim().toLowerCase()
    let decimal = 0n
    for (const ch of cleaned) {
      decimal = decimal * 10n + BigInt(parseInt(ch, 36))
    }
    let result = ''
    let remaining = decimal
    while (remaining > 0n) {
      const digit = Number(remaining % 16n)
      result = DIGITS[digit] + result
      remaining = remaining / 16n
    }
  })
})

describe('UUID v4 Generation', () => {
  bench('WASM uuid_v4', async () => {
    const { generateUuid } = await import('../src/wasm/csr-uuid')
    await generateUuid()
  })

  bench('JS crypto.randomUUID', () => {
    crypto.randomUUID()
  })

  bench('WASM uuid_v4_bulk (50)', async () => {
    const { generateBulkUuids } = await import('../src/wasm/csr-uuid')
    await generateBulkUuids(50)
  })

  bench('JS crypto.randomUUID bulk (50)', () => {
    for (let i = 0; i < 50; i++) {
      crypto.randomUUID()
    }
  })
})
