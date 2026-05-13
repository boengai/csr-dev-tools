import { useCallback, useEffect, useRef, useState } from 'react'

import type { UseToolComputationOptions, UseToolComputationResult } from '@/types'

/**
 * Tool computation pipeline: debounced + stale-safe async transformation from
 * a Tool's input to its result. Owns `result`, `error`, and `isPending`.
 * See CONTEXT.md → "Tool computation pipeline" for the four invariants.
 */
export function useToolComputation<I, R>(
  compute: (input: I) => Promise<R> | R,
  options: UseToolComputationOptions<I, R>,
): UseToolComputationResult<I, R> {
  const [result, setResult] = useState<R>(options.initial)
  const [error, setError] = useState<unknown | null>(null)
  const [isPending, setIsPending] = useState(false)

  const optionsRef = useRef(options)
  optionsRef.current = options
  const computeRef = useRef(compute)
  computeRef.current = compute

  const timeoutRef = useRef<number | undefined>(undefined)
  const sessionRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }
      // Invalidate any in-flight compute so its resolution is dropped.
      sessionRef.current += 1
    }
  }, [])

  const enqueue = useCallback((input: I, delayMs: number) => {
    const { initial, isEmpty } = optionsRef.current

    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    if (isEmpty?.(input)) {
      sessionRef.current += 1
      setResult(initial)
      setError(null)
      setIsPending(false)
      return
    }

    setIsPending(true)
    const session = ++sessionRef.current

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = undefined
      void (async () => {
        try {
          const value = await computeRef.current(input)
          if (session !== sessionRef.current || !mountedRef.current) return
          setResult(value)
          setError(null)
          setIsPending(false)
        } catch (err) {
          if (session !== sessionRef.current || !mountedRef.current) return
          setError(err)
          setIsPending(false)
          optionsRef.current.onError?.(err, input)
        }
      })()
    }, delayMs)
  }, [])

  const setInput = useCallback(
    (input: I) => {
      enqueue(input, optionsRef.current.debounceMs ?? 300)
    },
    [enqueue],
  )

  const setInputImmediate = useCallback(
    (input: I) => {
      enqueue(input, 0)
    },
    [enqueue],
  )

  return { error, isPending, result, setInput, setInputImmediate }
}
