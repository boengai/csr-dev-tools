import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WorkerResponse } from '@/types/wasm/worker-bridge'

import { createWorkerBridge, isWorkerAbortError, WorkerAbortError } from './worker-bridge'

type Listener = (e: Event) => void

// Minimal stand-in for Worker that lets a test reach into registered listeners
// and feed synthetic events. Keeps this spec pure-node (no jsdom needed) since
// Worker isn't available outside browsers/jsdom.
function createFakeWorker() {
  const listeners = new Map<string, Set<Listener>>()
  const posted: Array<unknown> = []
  const transfers: Array<Array<Transferable>> = []
  let terminated = false
  const emit = (type: string, evt: object) => {
    for (const l of listeners.get(type) ?? []) l({ type, ...evt } as unknown as Event)
  }
  return {
    addEventListener: (type: string, listener: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(listener)
    },
    removeEventListener: (type: string, listener: Listener) => {
      listeners.get(type)?.delete(listener)
    },
    postMessage: (data: unknown, transfer?: Array<Transferable>) => {
      posted.push(data)
      transfers.push(transfer ?? [])
    },
    terminate: () => {
      terminated = true
    },
    // Test hooks
    deliver: <T>(response: WorkerResponse<T>) => emit('message', { data: response }),
    fail: (message: string) => emit('error', { message }),
    failDeserialize: () => emit('messageerror', {}),
    isTerminated: () => terminated,
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
    posted,
    transfers,
  }
}

type FakeWorker = ReturnType<typeof createFakeWorker>

const lastId = (w: FakeWorker) => (w.posted[w.posted.length - 1] as { id: number }).id

function setup() {
  const workers: Array<FakeWorker> = []
  const factory = vi.fn(() => {
    const w = createFakeWorker()
    workers.push(w)
    return w as unknown as Worker
  })
  const bridge = createWorkerBridge<{ x: number }>(factory)
  return { bridge, factory, workers }
}

describe('createWorkerBridge', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('lazily constructs the worker on first call, not at bridge creation', () => {
    const { bridge, factory } = setup()

    expect(factory).not.toHaveBeenCalled()

    void bridge.call({ x: 1 })
    expect(factory).toHaveBeenCalledTimes(1)

    void bridge.call({ x: 2 })
    expect(factory).toHaveBeenCalledTimes(1) // singleton reused
  })

  it('injects an id into the posted payload and matches the response by that id', async () => {
    const { bridge, workers } = setup()

    const p = bridge.call<string>({ x: 42 })
    const posted = workers[0].posted[0] as { x: number; id: number }
    expect(posted.x).toBe(42)
    expect(typeof posted.id).toBe('number')

    workers[0].deliver<string>({ id: posted.id, result: 'ok' })
    await expect(p).resolves.toBe('ok')
  })

  it('routes concurrent calls to their own resolvers — no cross-call contamination', async () => {
    const { bridge, workers } = setup()

    const p1 = bridge.call<string>({ x: 1 })
    const p2 = bridge.call<string>({ x: 2 })

    const id1 = (workers[0].posted[0] as { id: number }).id
    const id2 = (workers[0].posted[1] as { id: number }).id
    expect(id1).not.toBe(id2)

    // Deliver in reverse order on purpose
    workers[0].deliver<string>({ id: id2, result: 'second' })
    workers[0].deliver<string>({ id: id1, result: 'first' })

    await expect(p1).resolves.toBe('first')
    await expect(p2).resolves.toBe('second')
  })

  it('registers a single message listener regardless of call count and clears pending on receipt', async () => {
    const { bridge, workers } = setup()

    const p1 = bridge.call<string>({ x: 1 })
    const p2 = bridge.call<string>({ x: 2 })
    expect(workers[0].listenerCount('message')).toBe(1)
    expect(bridge.hasPending()).toBe(true)

    workers[0].deliver<string>({ id: (workers[0].posted[0] as { id: number }).id, result: 'a' })
    workers[0].deliver<string>({ id: (workers[0].posted[1] as { id: number }).id, result: 'b' })
    await Promise.all([p1, p2])

    expect(bridge.hasPending()).toBe(false)
  })

  it('ignores responses whose id does not match — no stray reject/resolve', async () => {
    const { bridge, workers } = setup()

    const p = bridge.call<string>({ x: 1 })
    const id = lastId(workers[0])

    workers[0].deliver<string>({ id: id + 999, result: 'stray' })
    expect(bridge.hasPending()).toBe(true)
    workers[0].deliver<string>({ id, result: 'ok' })

    await expect(p).resolves.toBe('ok')
  })

  it('ignores malformed messages without throwing', async () => {
    const { bridge, workers } = setup()
    const p = bridge.call<string>({ x: 1 })
    workers[0].deliver({ nope: true } as unknown as WorkerResponse<string>)
    workers[0].deliver<string>({ id: lastId(workers[0]), result: 'ok' })
    await expect(p).resolves.toBe('ok')
  })

  it('rejects with an Error carrying the envelope message when the worker reports an error', async () => {
    const { bridge, workers } = setup()

    const p = bridge.call<string>({ x: 1 })
    workers[0].deliver<string>({ id: lastId(workers[0]), error: 'Input too large (300000 bytes).' })

    await expect(p).rejects.toThrow('Input too large (300000 bytes).')
    expect(bridge.hasPending()).toBe(false)
  })

  it('forwards non-terminal progress envelopes to the matching call only', async () => {
    const { bridge, workers } = setup()
    const onA = vi.fn()
    const onB = vi.fn()

    const pA = bridge.call<string>({ x: 1 }, { onProgress: onA })
    const idA = lastId(workers[0])
    const pB = bridge.call<string>({ x: 2 }, { onProgress: onB })
    const idB = lastId(workers[0])

    workers[0].deliver({ id: idA, progress: 25 })
    workers[0].deliver({ id: idB, progress: 75 })
    workers[0].deliver<string>({ id: idA, result: 'a' })
    workers[0].deliver<string>({ id: idB, result: 'b' })

    await expect(pA).resolves.toBe('a')
    await expect(pB).resolves.toBe('b')
    expect(onA).toHaveBeenCalledExactlyOnceWith(25)
    expect(onB).toHaveBeenCalledExactlyOnceWith(75)
  })

  it('passes transferables through to postMessage', () => {
    const { bridge, workers } = setup()
    const buffer = new ArrayBuffer(8)
    void bridge.call({ x: 1 }, { transfer: [buffer] })
    expect(workers[0].transfers[0]).toEqual([buffer])
  })

  describe('worker failure', () => {
    it('rejects every pending call on an error event and recreates the worker on the next call', async () => {
      const { bridge, factory, workers } = setup()

      const p1 = bridge.call<string>({ x: 1 })
      const p2 = bridge.call<string>({ x: 2 })
      workers[0].fail('Failed to fetch worker script')

      await expect(p1).rejects.toThrow(/Failed to fetch worker script/)
      await expect(p2).rejects.toThrow(/Failed to fetch worker script/)
      expect(workers[0].isTerminated()).toBe(true)
      expect(bridge.hasPending()).toBe(false)

      const p3 = bridge.call<string>({ x: 3 })
      expect(factory).toHaveBeenCalledTimes(2)
      workers[1].deliver<string>({ id: lastId(workers[1]), result: 'recovered' })
      await expect(p3).resolves.toBe('recovered')
    })

    it('rejects every pending call on a messageerror event', async () => {
      const { bridge, workers } = setup()
      const p = bridge.call<string>({ x: 1 })
      workers[0].failDeserialize()
      await expect(p).rejects.toThrow(/deserialized/)
    })
  })

  describe('cancel', () => {
    it('terminates the worker, rejects pending with a cancel WorkerAbortError, and recreates lazily', async () => {
      const { bridge, factory, workers } = setup()

      const p = bridge.call<string>({ x: 1 })
      bridge.cancel()

      const err = await p.catch((e: unknown) => e)
      expect(err).toBeInstanceOf(WorkerAbortError)
      expect(isWorkerAbortError(err, 'cancel')).toBe(true)
      expect(isWorkerAbortError(err, 'timeout')).toBe(false)
      expect(workers[0].isTerminated()).toBe(true)

      void bridge.call({ x: 2 })
      expect(factory).toHaveBeenCalledTimes(2)
    })

    it('is a no-op when no worker exists yet', () => {
      const { bridge, factory } = setup()
      expect(() => bridge.cancel()).not.toThrow()
      expect(factory).not.toHaveBeenCalled()
    })

    it('ignores a late response from the terminated worker', async () => {
      const { bridge, workers } = setup()
      const p = bridge.call<string>({ x: 1 })
      const id = lastId(workers[0])
      bridge.cancel()
      await expect(p).rejects.toBeInstanceOf(WorkerAbortError)
      expect(() => workers[0].deliver<string>({ id, result: 'late' })).not.toThrow()
    })
  })

  describe('timeout', () => {
    it('rejects with a timeout WorkerAbortError and terminates the worker', async () => {
      vi.useFakeTimers()
      const { bridge, workers } = setup()

      const p = bridge.call<string>({ x: 1 }, { timeoutMs: 2000 })
      const assertion = expect(p).rejects.toSatisfy((e: unknown) => isWorkerAbortError(e, 'timeout'))
      vi.advanceTimersByTime(2000)
      await assertion
      expect(workers[0].isTerminated()).toBe(true)
    })

    it('clears the timer when the call settles in time', async () => {
      vi.useFakeTimers()
      const { bridge, workers } = setup()

      const p = bridge.call<string>({ x: 1 }, { timeoutMs: 2000 })
      workers[0].deliver<string>({ id: lastId(workers[0]), result: 'fast' })
      await expect(p).resolves.toBe('fast')

      vi.advanceTimersByTime(5000)
      expect(workers[0].isTerminated()).toBe(false)
    })
  })

  describe('signal', () => {
    it('aborting the signal cancels the call and terminates the worker', async () => {
      const { bridge, workers } = setup()
      const controller = new AbortController()

      const p = bridge.call<string>({ x: 1 }, { signal: controller.signal })
      const assertion = expect(p).rejects.toSatisfy((e: unknown) => isWorkerAbortError(e, 'cancel'))
      controller.abort()
      await assertion
      expect(workers[0].isTerminated()).toBe(true)
      expect(bridge.hasPending()).toBe(false)
    })

    it('an already-aborted signal rejects without spawning or posting', async () => {
      const { bridge, factory } = setup()
      const controller = new AbortController()
      controller.abort()

      await expect(bridge.call({ x: 1 }, { signal: controller.signal })).rejects.toSatisfy((e: unknown) =>
        isWorkerAbortError(e, 'cancel'),
      )
      expect(factory).not.toHaveBeenCalled()
    })

    it('aborting after the call settled is a no-op (listener detached)', async () => {
      const { bridge, workers } = setup()
      const controller = new AbortController()

      const p = bridge.call<string>({ x: 1 }, { signal: controller.signal })
      workers[0].deliver<string>({ id: lastId(workers[0]), result: 'done' })
      await expect(p).resolves.toBe('done')

      const next = bridge.call<string>({ x: 2 })
      controller.abort()
      expect(workers[0].isTerminated()).toBe(false)
      workers[0].deliver<string>({ id: lastId(workers[0]), result: 'still alive' })
      await expect(next).resolves.toBe('still alive')
    })
  })
})
