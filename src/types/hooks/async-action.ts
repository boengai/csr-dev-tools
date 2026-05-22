export type UseAsyncActionOptions = {
  /** Always show this exact toast string when the action rejects (and the
   * call is still fresh + mounted). Mutually exclusive with `errorFallback`
   * and `onError`. */
  errorLabel?: string
  /** Toast `err.message` if the rejection is an `Error`, otherwise this
   * fallback string. Mutually exclusive with `errorLabel` and `onError`. */
  errorFallback?: string
  /** Fires with the rejection reason when the action throws, but only if the
   * call is still fresh (no newer run started) and the component is mounted.
   * Wins over `errorLabel` / `errorFallback` — the hook does not toast on
   * its behalf when this is set. */
  onError?: (err: unknown) => void
}

export type UseAsyncActionResult<T> = {
  pending: boolean
  result: T | null
  /** Invokes the latest action. Resolves with the action's value when fresh
   * and mounted, or `undefined` if a newer run superseded it or the component
   * unmounted during the await. */
  run: () => Promise<T | undefined>
  /** Clears `result`. Does not cancel an in-flight run. */
  reset: () => void
}
