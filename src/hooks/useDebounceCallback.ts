import { type RefObject, useCallback, useRef } from 'react'

/**
 * A hook that debounces a callback function by delaying its execution until after a specified delay
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the callback function
 */
export function useDebounceCallback<T extends (...args: Array<never>) => unknown>(callback: T, delay: number = 800): T {
  const timeoutRef: RefObject<number | undefined> = useRef<number | undefined>(undefined)

  const debouncedCallback: T = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay],
  ) as T

  return debouncedCallback
}
