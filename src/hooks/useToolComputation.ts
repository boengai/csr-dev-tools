import { useCallback, useEffect, useRef, useState } from 'react'

import type { ToolComputeContext, UseToolComputationOptions, UseToolComputationResult } from '@/types'

import { useToast } from './state/useToast'

type PipelineErrorRouting<I> = {
  errorLabel?: string
  errorFallback?: string
  onError?: (err: unknown, input: I) => void
}

/**
 * Routes a pipeline rejection to the configured error handler. Precedence:
 * `onError` > `errorFallback` > `errorLabel`. Reads the toast store lazily
 * via `getState()` so callers don't subscribe to toast state.
 *
 * Shared between `useToolComputation` and `useAsyncAction`. Exported so the
 * latter can route through the same shape without duplicating the precedence.
 */
export function reportPipelineError<I>(err: unknown, input: I, routing: PipelineErrorRouting<I>): void {
  if (routing.onError) {
    routing.onError(err, input)
    return
  }
  if (routing.errorFallback !== undefined) {
    useToast.getState().showError(err instanceof Error ? err.message : routing.errorFallback)
    return
  }
  if (routing.errorLabel !== undefined) {
    useToast.getState().showError(routing.errorLabel)
  }
}

/**
 * True for rejections that mean "this compute was cancelled" — a DOM
 * `AbortError` (e.g. `signal.throwIfAborted()`, an aborted `fetch`). The
 * pipeline treats these as silent: no error state, no toast.
 */
export function isAbortError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError'
}

/**
 * Tool computation pipeline: debounced + stale-safe async transformation from
 * a Tool's input to its result. Owns `result`, `error`, `isPending`, plus a
 * `recompute()` primitive that re-fires compute with the last input.
 * See CONTEXT.md → "Tool computation pipeline" for the four invariants.
 *
 * Each compute receives `{ signal }`; the signal is aborted when a newer
 * input is enqueued, on the `isEmpty` bypass, and on unmount, so cancellable
 * work stops instead of only having its result dropped. An abort rejection
 * is silent.
 */
export function useToolComputation<I, R>(
  compute: (input: I, context: ToolComputeContext) => Promise<R> | R,
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
  const controllerRef = useRef<AbortController | null>(null)
  const sessionRef = useRef(0)
  const mountedRef = useRef(true)
  // Holds the last input passed to setInput / setInputImmediate. Boxed so
  // a legitimately-`undefined` input is distinguishable from "never set."
  const inputRef = useRef<{ value: I } | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }
      // Invalidate any in-flight compute so its resolution is dropped, and
      // tell cancellable work to stop.
      sessionRef.current += 1
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [])

  const enqueue = useCallback((input: I, delayMs: number) => {
    const { initial, isEmpty } = optionsRef.current

    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    // A newer input (or the empty bypass) supersedes whatever is in flight.
    controllerRef.current?.abort()
    controllerRef.current = null

    if (isEmpty?.(input)) {
      sessionRef.current += 1
      setResult(initial)
      setError(null)
      setIsPending(false)
      return
    }

    setIsPending(true)
    const session = ++sessionRef.current
    const controller = new AbortController()
    controllerRef.current = controller

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = undefined
      void (async () => {
        try {
          const value = await computeRef.current(input, { signal: controller.signal })
          if (session !== sessionRef.current || !mountedRef.current) return
          if (controllerRef.current === controller) controllerRef.current = null
          setResult(value)
          setError(null)
          setIsPending(false)
        } catch (err) {
          if (session !== sessionRef.current || !mountedRef.current) return
          if (controllerRef.current === controller) controllerRef.current = null
          if (controller.signal.aborted || isAbortError(err)) {
            setIsPending(false)
            return
          }
          setError(err)
          setIsPending(false)
          reportPipelineError(err, input, optionsRef.current)
        }
      })()
    }, delayMs)
  }, [])

  const setInput = useCallback(
    (input: I) => {
      inputRef.current = { value: input }
      enqueue(input, optionsRef.current.debounceMs ?? 300)
    },
    [enqueue],
  )

  const setInputImmediate = useCallback(
    (input: I) => {
      inputRef.current = { value: input }
      enqueue(input, 0)
    },
    [enqueue],
  )

  const recompute = useCallback(() => {
    const current = inputRef.current
    if (current === null) return
    enqueue(current.value, 0)
  }, [enqueue])

  return { error, isPending, recompute, result, setInput, setInputImmediate }
}
