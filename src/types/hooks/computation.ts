export type UseToolComputationOptions<I, R> = {
  initial: R
  debounceMs?: number
  isEmpty?: (input: I) => boolean
  onError?: (error: unknown, input: I) => void
}

export type UseToolComputationResult<I, R> = {
  error: unknown | null
  isPending: boolean
  result: R
  /** Debounced input change. Use for keystroke-driven inputs. */
  setInput: (input: I) => void
  /**
   * Same pipeline as `setInput` (stale-safety, `isEmpty` bypass, unmount-safe)
   * but bypasses the debounce wait. Use for setting changes (algorithm
   * toggles, mode pickers) where a 300ms click→result delay would feel broken.
   */
  setInputImmediate: (input: I) => void
}

export type UseToolFieldsOptions<F, R> = {
  compute: (input: F) => R | Promise<R>
  debounceMs?: number
  /** Initial input bag — also the value `reset()` restores. */
  initial: F
  /** Initial result, used until the first compute resolves and after `reset()` short-circuits via `isEmpty`. */
  initialResult: R
  isEmpty?: (input: F) => boolean
  onError?: (error: unknown, input: F) => void
}

export type UseToolFieldsResult<F, R> = {
  error: unknown | null
  inputs: F
  isPending: boolean
  /**
   * Restore inputs to `options.initial` and clear pending compute.
   * If `isEmpty(initial)` is true the result resets to `initialResult`
   * synchronously; otherwise the pipeline recomputes from `initial`.
   */
  reset: () => void
  result: R
  /**
   * Debounced field update. Pass a partial — fields not in the object stay
   * as-is. Call once per intent; back-to-back calls in the same tick only
   * commit the last one.
   */
  setFields: (partial: Partial<F>) => void
  /** Same as `setFields` but bypasses the debounce wait. */
  setFieldsImmediate: (partial: Partial<F>) => void
}
