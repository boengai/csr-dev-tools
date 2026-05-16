import { useCallback, useState } from 'react'

import type { SetValue } from '@/types/hooks/persist/useInputLocalStorage'

import { readJsonStorage, writeJsonStorage } from './jsonStorage'

export function useInputLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => readJsonStorage(key, initialValue))

  const setValue: SetValue<T> = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value
        writeJsonStorage(key, nextValue)
        return nextValue
      })
    },
    [key],
  )

  return [storedValue, setValue]
}
