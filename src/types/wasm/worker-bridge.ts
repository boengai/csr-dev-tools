/**
 * Wire-shape every worker built on the worker bridge must conform to.
 * Terminal envelopes (`result` / `error`) settle the call; the optional
 * `progress` envelope is non-terminal and is forwarded to that call's
 * `onProgress`. See `src/wasm/worker-bridge.ts`.
 */
export type WorkerResponse<T> =
  | { id: number; result: T }
  | { id: number; error: string }
  | { id: number; progress: number }

/** Request envelope the bridge posts: the caller's payload plus the bridge-minted `id`. */
export type WorkerRequest<TReq extends object> = TReq & { id: number }

export type WorkerCallOptions = {
  /** Non-terminal progress envelopes for this call (`{ id, progress }`). */
  onProgress?: (progress: number) => void
  /**
   * Reject with a `WorkerAbortError` (`reason: 'timeout'`) and terminate the
   * worker if no terminal envelope arrives within this many ms. Termination
   * is the only way to stop a runaway synchronous job, so every other pending
   * call on the same bridge is rejected too.
   */
  timeoutMs?: number
  /** Transferables to move (not clone) with the posted payload. */
  transfer?: Array<Transferable>
}

export type WorkerAbortReason = 'cancel' | 'timeout'

export type WorkerBridge<TReq extends object> = {
  call: <TRes = unknown>(payload: TReq, options?: WorkerCallOptions) => Promise<TRes>
  /**
   * Terminate the worker and reject every pending call with a
   * `WorkerAbortError` (`reason: 'cancel'`). The next `call` lazily
   * constructs a fresh worker.
   */
  cancel: () => void
  /** True while at least one call is awaiting a terminal envelope. */
  hasPending: () => boolean
}
