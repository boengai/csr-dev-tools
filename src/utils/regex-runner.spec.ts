import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RegexWorkerRequest } from '@/types/utils/regex'
import type { WorkerRequest } from '@/types/wasm/worker-bridge'

import { executeRegex } from './regex'
import { cancelRegex, REGEX_TIMEOUT_MESSAGE, REGEX_TIMEOUT_MS, runRegex } from './regex-runner'

type Listener = (e: { data: unknown; type: string }) => void

// Fake Worker: patterns containing "HANG" never respond (simulates
// catastrophic backtracking); everything else answers via executeRegex.
const instances: Array<FakeWorker> = []
class FakeWorker {
  listeners = new Map<string, Set<Listener>>()
  terminated = false
  constructor() {
    instances.push(this)
  }
  addEventListener(type: string, l: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(l)
  }
  removeEventListener(type: string, l: Listener) {
    this.listeners.get(type)?.delete(l)
  }
  postMessage(req: WorkerRequest<RegexWorkerRequest>) {
    if (req.pattern.includes('HANG')) return
    queueMicrotask(() => {
      if (this.terminated) return
      const data = { id: req.id, result: executeRegex(req.pattern, req.flags, req.text) }
      for (const l of this.listeners.get('message') ?? []) l({ data, type: 'message' })
    })
  }
  terminate() {
    this.terminated = true
  }
}

describe('runRegex', () => {
  beforeEach(() => {
    cancelRegex()
    instances.length = 0
    vi.stubGlobal('Worker', FakeWorker)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('returns matches computed in the worker', async () => {
    const result = await runRegex('\\d+', 'g', 'a1 b22')
    expect(result.matches.map((m) => m.fullMatch)).toEqual(['1', '22'])
  })

  it('times out a runaway pattern, terminates the worker, and recovers on the next call', async () => {
    vi.useFakeTimers()
    const hung = runRegex('HANG', 'g', 'aaaa')
    const assertion = expect(hung).rejects.toThrow(REGEX_TIMEOUT_MESSAGE)
    await vi.advanceTimersByTimeAsync(REGEX_TIMEOUT_MS)
    await assertion
    expect(instances[0].terminated).toBe(true)

    vi.useRealTimers()
    const result = await runRegex('a', 'g', 'aa')
    expect(result.matches).toHaveLength(2)
    expect(instances).toHaveLength(2)
  })

  it('cancels a still-running previous call so the latest pattern does not queue behind it', async () => {
    const stale = runRegex('HANG', 'g', 'aaaa')
    const staleOutcome = stale.catch((e: unknown) => e)

    const fresh = await runRegex('a', 'g', 'aa')

    expect(fresh.matches).toHaveLength(2)
    expect(instances[0].terminated).toBe(true)
    const err = await staleOutcome
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).not.toBe(REGEX_TIMEOUT_MESSAGE)
  })

  it('terminates a runaway pattern as soon as the signal aborts (before the timeout)', async () => {
    const controller = new AbortController()
    const hung = runRegex('HANG', 'g', 'aaaa', controller.signal)
    const outcome = hung.catch((e: unknown) => e)

    controller.abort()
    const err = await outcome
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).not.toBe(REGEX_TIMEOUT_MESSAGE)
    expect(instances[0].terminated).toBe(true)
  })

  it('runs synchronously when Worker is unavailable', async () => {
    vi.unstubAllGlobals()
    const result = await runRegex('b', 'g', 'abb')
    expect(result.matches).toHaveLength(2)
  })
})
