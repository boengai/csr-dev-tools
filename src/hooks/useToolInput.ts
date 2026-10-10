import { useCallback, useRef, useState } from 'react'

import type { UseToolInputOptions, UseToolInputResult } from '@/types'

import { readJsonStorage } from './persist/jsonStorage'
import { useDebouncedJsonWrite } from './persist/useDebouncedJsonWrite'
import { useMountOnce } from './useMountOnce'
import { useToolComputation } from './useToolComputation'

/**
 * Tool computation pipeline that owns its single input value. Single-Input
 * variant of [[useToolFields]] — the hook holds the input, mirrors writes
 * into the pipeline, and exposes the same `reset()` + `recompute()` +
 * `autorunOnMount` surface for parity.
 *
 * Optional persistence: pass `storageKey` to seed the input from localStorage
 * once on mount and write it back (trailing-debounced, flushed on unmount and
 * `pagehide`). With `storageKey`, mount autorun also fires when `isEmpty` is
 * provided AND the restored input is non-empty.
 *
 * See CONTEXT.md → "Tool input" for when to pick this over `useToolComputation`.
 */
export function useToolInput<I, R>(options: UseToolInputOptions<I, R>): UseToolInputResult<I, R> {
  const { storageKey } = options
  const [seed] = useState<I>(() =>
    storageKey === undefined ? options.initial : readJsonStorage(storageKey, options.initial),
  )
  const [input, setInputState] = useState<I>(seed)
  // Every setter writes this synchronously, so handlers invoked in the same
  // tick see the latest value without a render-time mirror.
  const inputRef = useRef(seed)
  const initialRef = useRef(options.initial)

  const debounceMs = options.debounceMs ?? 300
  const persist = useDebouncedJsonWrite<I>(storageKey, debounceMs)

  const {
    error,
    isPending,
    result,
    setInput: pipelineSetInput,
    setInputImmediate: pipelineSetInputImmediate,
  } = useToolComputation<I, R>(options.compute, {
    debounceMs,
    errorFallback: options.errorFallback,
    errorLabel: options.errorLabel,
    initial: options.initialResult,
    isEmpty: options.isEmpty,
    onError: options.onError,
  })

  const setInput = useCallback(
    (val: I) => {
      inputRef.current = val
      setInputState(val)
      persist.schedule(val)
      pipelineSetInput(val)
    },
    [persist, pipelineSetInput],
  )

  const setInputImmediate = useCallback(
    (val: I) => {
      inputRef.current = val
      setInputState(val)
      persist.writeNow(val)
      pipelineSetInputImmediate(val)
    },
    [persist, pipelineSetInputImmediate],
  )

  const recompute = useCallback(() => {
    pipelineSetInputImmediate(inputRef.current)
  }, [pipelineSetInputImmediate])

  const reset = useCallback(() => {
    const init = initialRef.current
    inputRef.current = init
    setInputState(init)
    persist.writeNow(init)
    pipelineSetInputImmediate(init)
  }, [persist, pipelineSetInputImmediate])

  // Decided once from the mount-time seed (the restored value when persisted).
  const [autorun] = useState(
    () =>
      options.autorunOnMount === true ||
      (storageKey !== undefined && options.isEmpty !== undefined && !options.isEmpty(seed)),
  )
  useMountOnce(() => {
    if (autorun) pipelineSetInputImmediate(inputRef.current)
  })

  return { error, input, isPending, recompute, reset, result, setInput, setInputImmediate }
}
