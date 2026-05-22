export type UseToolComputationOptions<I, R> = {
  initial: R
  debounceMs?: number
  isEmpty?: (input: I) => boolean
  /**
   * Pipeline-error toast: always show this exact string when compute rejects.
   * Mutually exclusive with `errorFallback` and `onError` (precedence:
   * `onError` > `errorFallback` > `errorLabel`).
   */
  errorLabel?: string
  /**
   * Pipeline-error toast with a generic fallback: shows `err.message` when
   * the rejection is an `Error`, otherwise this fallback string. Use when
   * compute throws user-facing messages (validation, `narrateParseError`)
   * that should reach the user verbatim. Mutually exclusive with
   * `errorLabel` and `onError`.
   */
  errorFallback?: string
  /**
   * Full callback for sites that need the input bag (context-specific
   * messages) or side effects beyond toasting. Wins over `errorLabel` /
   * `errorFallback` — the pipeline does not toast on its behalf.
   */
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
  /**
   * Fire compute with the current input (the last value passed to `setInput`
   * or `setInputImmediate`). No-op if neither has been called yet. Runs through
   * the same path as `setInputImmediate` — all four invariants apply, including
   * `isEmpty` short-circuit.
   */
  recompute: () => void
}

export type UseToolFieldsOptions<F, R> = {
  /**
   * Fire `recompute()` once on mount with `options.initial`. Honors the
   * pipeline's `isEmpty` short-circuit (no compute call if the initial bag
   * is empty). The named alternative to a per-Tool
   * `useMountOnce(() => recompute())` ritual.
   */
  autorunOnMount?: boolean
  compute: (input: F) => R | Promise<R>
  debounceMs?: number
  /** Initial input bag — also the value `reset()` restores. */
  initial: F
  /** Initial result, used until the first compute resolves and after `reset()` short-circuits via `isEmpty`. */
  initialResult: R
  isEmpty?: (input: F) => boolean
  /** See `UseToolComputationOptions.errorLabel`. */
  errorLabel?: string
  /** See `UseToolComputationOptions.errorFallback`. */
  errorFallback?: string
  /** See `UseToolComputationOptions.onError`. */
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
  /**
   * Fire compute with the current bag. Equivalent to `setFieldsImmediate({})`
   * (the empty-partial idiom) — kept as the canonical, named alternative.
   * Runs through the same path: all four invariants apply, including
   * `isEmpty` short-circuit.
   */
  recompute: () => void
}

export type UseToolInputOptions<I, R> = {
  /**
   * Fire compute once on mount with `options.initial`. Honors the
   * pipeline's `isEmpty` short-circuit (no compute call if the initial
   * input is empty). The named alternative to a per-Tool
   * `useMountOnce(() => recompute())` ritual.
   */
  autorunOnMount?: boolean
  compute: (input: I) => R | Promise<R>
  debounceMs?: number
  /** Initial input value — also the value `reset()` restores. */
  initial: I
  /** Initial result, used until the first compute resolves and after `reset()` short-circuits via `isEmpty`. */
  initialResult: R
  isEmpty?: (input: I) => boolean
  /** See `UseToolComputationOptions.errorLabel`. */
  errorLabel?: string
  /** See `UseToolComputationOptions.errorFallback`. */
  errorFallback?: string
  /** See `UseToolComputationOptions.onError`. */
  onError?: (error: unknown, input: I) => void
}

export type UseToolInputResult<I, R> = {
  error: unknown | null
  /** Current input value (live; updated by setInput / setInputImmediate / reset). */
  input: I
  isPending: boolean
  /**
   * Fire compute with the current input. Equivalent to `setInputImmediate(input)` —
   * kept as the canonical, named alternative. Runs through the same path:
   * all four pipeline invariants apply, including `isEmpty` short-circuit.
   */
  recompute: () => void
  /**
   * Restore input to `options.initial` and clear pending compute.
   * If `isEmpty(initial)` is true the result resets to `initialResult`
   * synchronously; otherwise the pipeline recomputes from `initial`.
   */
  reset: () => void
  result: R
  /** Debounced input change. Use for keystroke-driven inputs. */
  setInput: (input: I) => void
  /** Same pipeline as `setInput` but bypasses the debounce wait. */
  setInputImmediate: (input: I) => void
}

export type UseToolFieldsPersistedOptions<F, R> = UseToolFieldsOptions<F, R> & {
  /** localStorage key holding the persisted input bag (JSON-serialized). */
  storageKey: string
}

export type UseToolComputationPersistedOptions<I, R> = Omit<UseToolComputationOptions<I, R>, 'initial'> & {
  /** Compute function — same shape as the parameter to `useToolComputation`. */
  compute: (input: I) => R | Promise<R>
  /** Initial input value — also the value persisted on first mount when localStorage is empty. */
  initial: I
  /** Initial result, used until the first compute resolves. */
  initialResult: R
  /** localStorage key holding the persisted input value (JSON-serialized). */
  storageKey: string
}

export type UseToolComputationPersistedResult<I, R> = {
  error: unknown | null
  /** Current input value (live; updated by setInput / setInputImmediate). */
  input: I
  isPending: boolean
  result: R
  /** Debounced input change. Updates state, persists to localStorage, schedules debounced compute. */
  setInput: (input: I) => void
  /** Immediate input change. Updates state, persists, fires compute without debounce. */
  setInputImmediate: (input: I) => void
  /** Fire compute with the current input. See `UseToolComputationResult.recompute`. */
  recompute: () => void
}
