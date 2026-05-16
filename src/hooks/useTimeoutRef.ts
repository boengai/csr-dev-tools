import { useCallback, useEffect, useRef } from 'react'

/**
 * Manages a single pending `setTimeout` handle with automatic cancellation on
 * unmount and on each re-schedule. The call site provides the callback + delay
 * per invocation so the hook can serve multiple unrelated timer needs without
 * stuffing them through one closure.
 *
 * Pick this for "fire-once-after-delay" UI patterns (CopyButton's 2s success
 * indicator reset, ImageCompressor's 300ms progress-bar delay). For
 * "fire-on-quiet" debouncing of repeated invocations of the SAME callback,
 * use `useDebounceCallback`.
 */
export function useTimeoutRef(): {
  schedule: (callback: () => void, delay: number) => void
  cancel: () => void
} {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const schedule = useCallback((callback: () => void, delay: number) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      callback()
    }, delay)
  }, [])

  return { cancel, schedule }
}
