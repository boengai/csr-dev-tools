import { useCallback, useEffect, useRef, useState } from 'react'

import type { UseAsyncActionOptions, UseAsyncActionResult } from '@/types'

import { useStaleSafeAsync } from './useStaleSafeAsync'

/**
 * Button-fired (or one-shot) async action with stale-safety + unmount-safety.
 *
 * Wraps an async function so the latest invocation always wins and a stale
 * resolution never overwrites a fresh result. Setstate calls after `await` are
 * also guarded against unmount so unmounted-component warnings can't surface.
 *
 * Per-call-site concerns (input state, validation/early returns, success
 * messaging) stay at the call site. The hook owns `pending` and `result`.
 */
export function useAsyncAction<T>(
  action: () => Promise<T>,
  options?: UseAsyncActionOptions,
): UseAsyncActionResult<T> {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<T | null>(null)

  const actionRef = useRef(action)
  actionRef.current = action
  const onErrorRef = useRef(options?.onError)
  onErrorRef.current = options?.onError

  const newSession = useStaleSafeAsync()
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const run = useCallback(async (): Promise<T | undefined> => {
    const session = newSession()
    setPending(true)
    setResult(null)
    try {
      const value = await actionRef.current()
      if (!session.isFresh() || !mountedRef.current) return undefined
      setResult(value)
      return value
    } catch (err) {
      if (!session.isFresh() || !mountedRef.current) return undefined
      onErrorRef.current?.(err)
      return undefined
    } finally {
      if (session.isFresh() && mountedRef.current) {
        setPending(false)
      }
    }
  }, [newSession])

  const reset = useCallback(() => {
    setResult(null)
  }, [])

  return { pending, reset, result, run }
}
