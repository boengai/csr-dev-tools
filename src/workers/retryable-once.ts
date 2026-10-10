/**
 * Memoise an async initialiser, but evict a rejection so the next call
 * retries. Used for worker-side wasm `init()` and model pipelines, where a
 * transient failure (network blip, aborted fetch) must not poison the worker
 * for the rest of the session.
 */
export function retryableOnce<T>(fn: () => Promise<T>): () => Promise<T> {
  let ready: Promise<T> | null = null
  return () => {
    if (!ready) {
      const attempt: Promise<T> = fn().catch((err: unknown) => {
        if (ready === attempt) ready = null
        throw err
      })
      ready = attempt
    }
    return ready
  }
}
