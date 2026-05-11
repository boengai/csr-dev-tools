import { useCallback, useRef } from 'react'

export type StaleSafeSession = {
  /** True iff no newer session has been started since this one. */
  isFresh: () => boolean
  /** Run `fn` only if this session is still fresh; otherwise return undefined. */
  ifFresh: <T>(fn: () => T) => T | undefined
}

/**
 * Returns a factory that bumps a monotonic session counter and yields a token
 * representing the new session. After an `await`, guard state mutations with
 * `token.ifFresh(...)` so a slow earlier session can't overwrite the result
 * of a newer one. Replaces the hand-rolled `++sessionRef.current` +
 * `if (session === sessionRef.current)` pattern.
 */
export function useStaleSafeAsync(): () => StaleSafeSession {
  const ref = useRef(0)

  return useCallback(() => {
    const token = ++ref.current
    return {
      isFresh: () => token === ref.current,
      ifFresh: (fn) => (token === ref.current ? fn() : undefined),
    }
  }, [])
}
