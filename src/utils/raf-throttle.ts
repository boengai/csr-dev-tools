/**
 * Coalesces calls to at most one per animation frame. The frame runs `fn`
 * with the arguments of the *latest* call in that frame, so a fast stream of
 * pointer moves always resolves to the most recent position.
 *
 * Create the throttled function once (e.g. `useMemo`) — a fresh wrapper per
 * event has its own empty frame slot and throttles nothing.
 */
export const rafThrottle = <A extends Array<unknown>>(fn: (...args: A) => void): ((...args: A) => void) => {
  let frame: number | null = null
  let latest: A
  return (...args: A) => {
    latest = args
    if (frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      fn(...latest)
    })
  }
}
