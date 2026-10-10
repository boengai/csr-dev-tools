/** Request posted to `src/workers/background-removal.worker.ts` (the bridge adds `id`). */
export type BgRemovalWorkerRequest = {
  /** Encoded image file bytes (transferred, not cloned). */
  bytes: ArrayBuffer
  /** MIME type of `bytes`, e.g. `image/png`. */
  type: string
}

/** Segmented foreground as raw RGBA pixels (alpha = mask), transferred back to the main thread. */
export type BgRemovalResult = {
  height: number
  rgba: ArrayBuffer
  width: number
}
