import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadWasm } from './init'

type HashModule = typeof import('../../wasm/pkg/hash/hash.js')
type UuidModule = typeof import('../../wasm/pkg/uuid/uuid.js')

describe('loadWasm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('instantiates a module once when first calls race', async () => {
    const instantiate = vi.spyOn(WebAssembly, 'instantiate')

    const [a, b] = await Promise.all([loadWasm<HashModule>('hash'), loadWasm<HashModule>('hash')])

    expect(a).toBe(b)
    expect(instantiate).toHaveBeenCalledTimes(1)
    expect(a.md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72')
  })

  it('evicts a rejected load so the next call retries', async () => {
    const instantiate = vi.spyOn(WebAssembly, 'instantiate').mockRejectedValueOnce(new Error('instantiate failed'))

    await expect(loadWasm<UuidModule>('uuid')).rejects.toThrow('instantiate failed')

    const wasm = await loadWasm<UuidModule>('uuid')
    expect(wasm.uuid_v4()).toMatch(/^[0-9a-f-]{36}$/)
    expect(instantiate).toHaveBeenCalledTimes(2)
  })
})
