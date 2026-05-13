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
