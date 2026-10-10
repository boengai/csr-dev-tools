import type {
  WorkerAbortReason,
  WorkerBridge,
  WorkerCallOptions,
  WorkerRequest,
  WorkerResponse,
} from '@/types/wasm/worker-bridge'

/**
 * Rejection used when the bridge itself aborts a call — `cancel()` or a
 * per-call timeout. Callers detect it with `isWorkerAbortError` to suppress
 * the generic failure toast (cancel) or show a specific message (timeout).
 */
export class WorkerAbortError extends Error {
  readonly reason: WorkerAbortReason

  constructor(reason: WorkerAbortReason) {
    super(reason === 'cancel' ? 'Worker call cancelled' : 'Worker call timed out')
    this.name = 'WorkerAbortError'
    this.reason = reason
  }
}

export const isWorkerAbortError = (err: unknown, reason?: WorkerAbortReason): err is WorkerAbortError =>
  err instanceof WorkerAbortError && (reason === undefined || err.reason === reason)

type PendingCall = {
  onProgress?: (progress: number) => void
  reject: (err: Error) => void
  resolve: (value: unknown) => void
  timer?: ReturnType<typeof setTimeout>
}

const isResponse = (data: unknown): data is WorkerResponse<unknown> =>
  typeof data === 'object' && data !== null && typeof (data as { id?: unknown }).id === 'number'

/**
 * Typed message-correlated bridge to a Web Worker. See CONTEXT.md →
 * "Worker bridge" for the invariants:
 *
 *   1. msgId correlation — each `.call(...)` gets a unique id; responses are
 *      matched by id through a `pending` map so concurrent calls cannot swap
 *      results. One `message` listener per worker instance.
 *   2. Error envelope — `{ id, error }` → `reject(new Error(error))`;
 *      `{ id, result }` → `resolve(result)`; `{ id, progress }` is
 *      non-terminal and goes to that call's `onProgress`.
 *   3. Worker failure — a worker `error` / `messageerror` event (failed
 *      script load, uncaught throw) rejects every pending call and drops the
 *      worker; the next call lazily constructs a fresh one. No call can hang
 *      forever on a dead worker.
 *   4. Abort — `cancel()` and per-call `timeoutMs` terminate the worker and
 *      reject pending calls with `WorkerAbortError`. Termination is the only
 *      way to stop a runaway synchronous job.
 *   5. Lazy construction — `workerFactory` runs on the first `.call(...)`
 *      (and again after a failure/abort), not at module import.
 *
 * Vite worker resolution requires the literal pattern
 * `new Worker(new URL('./literal', import.meta.url), { type: 'module' })`
 * at the call site, so the bridge takes a factory (not a URL or instance) —
 * the facade owns the URL literal so Vite can statically bundle the worker
 * file.
 */
export function createWorkerBridge<TReq extends object>(workerFactory: () => Worker): WorkerBridge<TReq> {
  let worker: Worker | null = null
  let msgId = 0
  const pending = new Map<number, PendingCall>()

  const settle = (id: number): PendingCall | undefined => {
    const entry = pending.get(id)
    if (!entry) return undefined
    pending.delete(id)
    if (entry.timer !== undefined) clearTimeout(entry.timer)
    return entry
  }

  const rejectAll = (makeError: () => Error) => {
    for (const id of [...pending.keys()]) settle(id)?.reject(makeError())
  }

  const dispose = () => {
    if (!worker) return
    worker.terminate()
    worker = null
  }

  const abort = (reason: WorkerAbortReason) => {
    dispose()
    rejectAll(() => new WorkerAbortError(reason))
  }

  const onMessage = (e: MessageEvent<unknown>) => {
    const data = e.data
    if (!isResponse(data)) return
    if ('progress' in data) {
      pending.get(data.id)?.onProgress?.(data.progress)
      return
    }
    const entry = settle(data.id)
    if (!entry) return
    if ('error' in data) entry.reject(new Error(data.error))
    else entry.resolve(data.result)
  }

  const onFailure = (e: Event) => {
    // Structural check: `ErrorEvent` is not a global in every runtime (node specs).
    const raw = (e as Partial<ErrorEvent>).message
    const detail = typeof raw === 'string' && raw !== '' ? `: ${raw}` : ''
    const message = e.type === 'messageerror' ? 'Worker message could not be deserialized' : `Worker failed${detail}`
    dispose()
    rejectAll(() => new Error(message))
  }

  const getWorker = (): Worker => {
    if (!worker) {
      const w = workerFactory()
      w.addEventListener('message', onMessage)
      w.addEventListener('error', onFailure)
      w.addEventListener('messageerror', onFailure)
      worker = w
    }
    return worker
  }

  return {
    call: <TRes = unknown>(payload: TReq, options: WorkerCallOptions = {}) =>
      new Promise<TRes>((resolve, reject) => {
        const id = ++msgId
        const w = getWorker()
        const entry: PendingCall = {
          onProgress: options.onProgress,
          reject,
          resolve: resolve as (value: unknown) => void,
        }
        if (options.timeoutMs !== undefined) {
          entry.timer = setTimeout(() => abort('timeout'), options.timeoutMs)
        }
        pending.set(id, entry)
        // Bridge appends `id` so a typo'd id in the caller's payload is
        // silently overridden — caller cannot break correlation by accident.
        const request: WorkerRequest<TReq> = { ...payload, id }
        try {
          w.postMessage(request, options.transfer ?? [])
        } catch (err) {
          settle(id)
          reject(err instanceof Error ? err : new Error(String(err)))
        }
      }),
    cancel: () => abort('cancel'),
    hasPending: () => pending.size > 0,
  }
}
