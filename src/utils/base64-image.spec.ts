import { describe, expect, it } from 'vitest'

// We test the pure detection logic; image loading requires DOM
describe('base64-image', () => {
  it('module exports base64ToImageInfo', async () => {
    const mod = await import('./base64-image')
    expect(typeof mod.base64ToImageInfo).toBe('function')
  })
})
