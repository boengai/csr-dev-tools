import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { DebouncedJsonWrite } from '@/types'

import { writeJsonStorage } from './jsonStorage'

/**
 * Trailing-debounced `writeJsonStorage`. Coalesces rapid writes (one per
 * keystroke) into a single `JSON.stringify` + `localStorage.setItem` after
 * `delayMs` of quiet, and flushes any pending write on unmount and on
 * `pagehide` so a reload or navigation inside the debounce window loses
 * nothing.
 *
 * `storageKey === undefined` turns every call into a no-op — lets the
 * pipeline hooks call it unconditionally whether or not they persist.
 *
 * Used by `useToolInput` / `useToolFields` for their `storageKey` option.
 * See CONTEXT.md → "Tool input" / "Tool field bag" (persistence).
 */
export function useDebouncedJsonWrite<T>(storageKey: string | undefined, delayMs: number): DebouncedJsonWrite<T> {
  const pendingRef = useRef<{ key: string; value: T } | null>(null)
  const timerRef = useRef<number | undefined>(undefined)

  const flush = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    const pending = pendingRef.current
    if (pending === null) return
    pendingRef.current = null
    writeJsonStorage(pending.key, pending.value)
  }, [])

  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  const schedule = useCallback(
    (value: T) => {
      if (storageKey === undefined) return
      // A key change mid-debounce must not drop the old key's pending write.
      if (pendingRef.current !== null && pendingRef.current.key !== storageKey) flush()
      pendingRef.current = { key: storageKey, value }
      if (timerRef.current !== undefined) clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(flush, delayMs)
    },
    [delayMs, flush, storageKey],
  )

  const writeNow = useCallback(
    (value: T) => {
      if (storageKey === undefined) return
      schedule(value)
      flush()
    },
    [flush, schedule, storageKey],
  )

  return useMemo(() => ({ flush, schedule, writeNow }), [flush, schedule, writeNow])
}
