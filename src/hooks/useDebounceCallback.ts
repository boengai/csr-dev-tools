import { useCallback, useEffect, useRef } from 'react'

/**
 * Debounces `callback` so it runs only after `delay` ms of inactivity since
 * the last call. The pending invocation is cancelled when the consuming
 * component unmounts to prevent state updates on unmounted components.
 *
 * Each call captures the current `callback` and `delay`. Changing either while
 * a timer is in-flight does NOT reschedule — the pending timer fires the
 * previously-captured callback at its original delay.
 */
export function useDebounceCallback<T extends (...args: Array<never>) => unknown>(callback: T, delay: number = 800): T {
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay],
  ) as T

  return debouncedCallback
}
