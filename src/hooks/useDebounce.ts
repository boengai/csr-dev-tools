import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'

/**
 * A hook that debounces a value by delaying its update until after a specified delay
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T = unknown>(value: T, delay: number = 800): T {
  const [debouncedValue, setDebouncedValue]: [T, Dispatch<SetStateAction<T>>] = useState<T>(value)

  useEffect(() => {
    const handler: number = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
