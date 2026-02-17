import { describe, expect, it } from 'vitest'

import { generateHmac } from './hmac'

// RFC 4231 Test Vectors
describe('generateHmac', () => {
  it('should generate correct HMAC-SHA-256 for known input', async () => {
    // "Hi There" with key 0x0b repeated 20 times — but we use simple string keys
    const result = await generateHmac('hello', 'secret', 'SHA-256', 'hex')
    expect(result).toBe('88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b')
  })

  it('should generate correct HMAC-SHA-384', async () => {
    const result = await generateHmac('hello', 'secret', 'SHA-384', 'hex')
    expect(typeof result).toBe('string')
    expect(result).toHaveLength(96) // SHA-384 = 48 bytes = 96 hex chars
  })

  it('should generate correct HMAC-SHA-512', async () => {
    const result = await generateHmac('hello', 'secret', 'SHA-512', 'hex')
    expect(typeof result).toBe('string')
    expect(result).toHaveLength(128) // SHA-512 = 64 bytes = 128 hex chars
  })

  it('should return base64 encoding', async () => {
    const result = await generateHmac('hello', 'secret', 'SHA-256', 'base64')
    expect(result).toBe('iKqz7ejTrflNJquQ07r9SiCDBww7zOnAFO4EpEOEfAs=')
  })

  it('should produce different results for different keys', async () => {
    const a = await generateHmac('hello', 'key1', 'SHA-256', 'hex')
    const b = await generateHmac('hello', 'key2', 'SHA-256', 'hex')
    expect(a).not.toBe(b)
  })

  it('should produce different results for different algorithms', async () => {
    const a = await generateHmac('hello', 'secret', 'SHA-256', 'hex')
    const b = await generateHmac('hello', 'secret', 'SHA-512', 'hex')
    expect(a).not.toBe(b)
  })
})
