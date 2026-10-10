import { describe, expect, it, vi } from 'vitest'

import { retryableOnce } from './retryable-once'

describe('retryableOnce', () => {
  it('runs the initialiser once for concurrent and later callers', async () => {
    const init = vi.fn().mockResolvedValue('ok')
    const ensure = retryableOnce(init)

    await expect(Promise.all([ensure(), ensure()])).resolves.toEqual(['ok', 'ok'])
    await ensure()

    expect(init).toHaveBeenCalledTimes(1)
  })

  it('retries after a rejection instead of caching it forever', async () => {
    const init = vi.fn().mockRejectedValueOnce(new Error('network blip')).mockResolvedValueOnce('ok')
    const ensure = retryableOnce(init)

    await expect(ensure()).rejects.toThrow('network blip')
    await expect(ensure()).resolves.toBe('ok')
    expect(init).toHaveBeenCalledTimes(2)
  })
})
