export type UseAsyncActionOptions = {
  /** Fires with the rejection reason when the action throws, but only if the
   * call is still fresh (no newer run started) and the component is mounted. */
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
