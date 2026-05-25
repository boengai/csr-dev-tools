/**
 * Wire-shape every worker built on this bridge must conform to. Exported so
 * worker files can type their `self.postMessage` calls — see
 * `src/workers/bcrypt.worker.ts` and `src/workers/pdf.worker.ts` for the
 * two adopters today.
 */
export type WorkerResponse<T> = { id: number; result: T } | { id: number; error: string }

export type WorkerBridge<TReq extends object> = {
  call: <TRes = unknown>(payload: TReq) => Promise<TRes>
}

/**
 * Typed message-correlated bridge to a Web Worker. See CONTEXT.md →
 * "Worker bridge" for the four invariants:
 *
 *   1. msgId correlation — each `.call(...)` gets a unique id; responses are
 *      matched by id so concurrent calls cannot swap results.
 *   2. Listener removal on receipt — the per-call handler is removed before
 *      resolving/rejecting; the worker never accumulates stale handlers.
 *   3. Error envelope — `{ id, error }` → `reject(new Error(error))`;
 *      `{ id, result }` → `resolve(result)`. A worker-thrown error can't be
 *      mistaken for a successful empty result.
 *   4. Lazy singleton construction — `workerFactory` runs once on the first
 *      `.call(...)`, not at module import. Facades imported into Tools the
 *      user never visits pay zero worker-construction cost.
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

  const getWorker = (): Worker => {
    if (!worker) worker = workerFactory()
    return worker
  }

  return {
    call: <TRes = unknown>(payload: TReq) =>
      new Promise<TRes>((resolve, reject) => {
        const id = ++msgId
        const w = getWorker()

        const handler = (e: MessageEvent<WorkerResponse<TRes>>) => {
          if (e.data.id !== id) return
          w.removeEventListener('message', handler)
          if ('error' in e.data) {
            reject(new Error(e.data.error))
          } else {
            resolve(e.data.result)
          }
        }

        w.addEventListener('message', handler)
        // Bridge appends `id` so a typo'd id in the caller's payload is
        // silently overridden — caller cannot break correlation by accident.
        w.postMessage({ ...payload, id })
      }),
  }
}
