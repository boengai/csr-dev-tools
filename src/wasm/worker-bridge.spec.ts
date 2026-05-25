import { describe, expect, it, vi } from 'vitest'

import { createWorkerBridge, type WorkerResponse } from './worker-bridge'

// Minimal stand-in for Worker that lets a test reach into the registered
// message listener and feed it a synthetic response. Keeps this spec pure-node
// (no jsdom needed) since Worker isn't available outside browsers/jsdom.
function createMockWorker() {
  const listeners = new Set<(e: MessageEvent) => void>()
  const posted: Array<unknown> = []
  return {
    addEventListener: (_type: 'message', listener: (e: MessageEvent) => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: 'message', listener: (e: MessageEvent) => void) => {
      listeners.delete(listener)
    },
    postMessage: (data: unknown) => {
      posted.push(data)
    },
    // Test hooks
    listenerCount: () => listeners.size,
    posted,
    deliver: <T>(response: WorkerResponse<T>) => {
      // MessageEvent isn't always available in node; pass a structural stub.
      const evt = { data: response } as MessageEvent<WorkerResponse<T>>
      for (const l of listeners) l(evt)
    },
  }
}

describe('createWorkerBridge', () => {
  it('lazily constructs the worker on first call, not at bridge creation', () => {
    const factory = vi.fn(() => createMockWorker() as unknown as Worker)
    const bridge = createWorkerBridge<{ x: number }>(factory)

    expect(factory).not.toHaveBeenCalled()

    void bridge.call({ x: 1 })
    expect(factory).toHaveBeenCalledTimes(1)

    void bridge.call({ x: 2 })
    expect(factory).toHaveBeenCalledTimes(1) // singleton reused
  })

  it('injects an id into the posted payload and matches the response by that id', async () => {
    const mock = createMockWorker()
    const bridge = createWorkerBridge<{ x: number }>(() => mock as unknown as Worker)

    const p = bridge.call<string>({ x: 42 })
    const posted = mock.posted[0] as { x: number; id: number }
    expect(posted.x).toBe(42)
    expect(typeof posted.id).toBe('number')

    mock.deliver<string>({ id: posted.id, result: 'ok' })
    await expect(p).resolves.toBe('ok')
  })

  it('routes concurrent calls to their own resolvers — no cross-call contamination', async () => {
    const mock = createMockWorker()
    const bridge = createWorkerBridge<{ x: number }>(() => mock as unknown as Worker)

    const p1 = bridge.call<string>({ x: 1 })
    const p2 = bridge.call<string>({ x: 2 })

    const id1 = (mock.posted[0] as { id: number }).id
    const id2 = (mock.posted[1] as { id: number }).id
    expect(id1).not.toBe(id2)

    // Deliver in reverse order on purpose
    mock.deliver<string>({ id: id2, result: 'second' })
    mock.deliver<string>({ id: id1, result: 'first' })

    await expect(p1).resolves.toBe('first')
    await expect(p2).resolves.toBe('second')
  })

  it('removes the per-call listener after the matching response arrives', async () => {
    const mock = createMockWorker()
    const bridge = createWorkerBridge<{ x: number }>(() => mock as unknown as Worker)

    const p = bridge.call<string>({ x: 1 })
    expect(mock.listenerCount()).toBe(1)

    const id = (mock.posted[0] as { id: number }).id
    mock.deliver<string>({ id, result: 'ok' })
    await p

    expect(mock.listenerCount()).toBe(0)
  })

  it('ignores responses whose id does not match — no stray reject/resolve', async () => {
    const mock = createMockWorker()
    const bridge = createWorkerBridge<{ x: number }>(() => mock as unknown as Worker)

    const p = bridge.call<string>({ x: 1 })
    const id = (mock.posted[0] as { id: number }).id

    // Deliver a stray response for an unrelated id first
    mock.deliver<string>({ id: id + 999, result: 'stray' })
    // Then the real one
    mock.deliver<string>({ id, result: 'ok' })

    await expect(p).resolves.toBe('ok')
    // Listener removed by the matching delivery, not by the stray
    expect(mock.listenerCount()).toBe(0)
  })

  it('rejects with an Error carrying the envelope message when the worker reports an error', async () => {
    const mock = createMockWorker()
    const bridge = createWorkerBridge<{ x: number }>(() => mock as unknown as Worker)

    const p = bridge.call<string>({ x: 1 })
    const id = (mock.posted[0] as { id: number }).id

    mock.deliver<string>({ id, error: 'Input too large (300000 bytes). Maximum is 262144 bytes.' })

    await expect(p).rejects.toThrow('Input too large (300000 bytes). Maximum is 262144 bytes.')
    expect(mock.listenerCount()).toBe(0)
  })
})
