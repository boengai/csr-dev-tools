import { useCallback, useRef, useState } from 'react'

import type { UseToolInputOptions, UseToolInputResult } from '@/types'

import { useMountOnce } from './useMountOnce'
import { useToolComputation } from './useToolComputation'

/**
 * Tool computation pipeline that owns its single input value. Single-Input
 * variant of [[useToolFields]] — the hook holds the input, mirrors writes
 * into the pipeline, and exposes the same `reset()` + `recompute()` +
 * `autorunOnMount` surface for parity.
 *
 * See CONTEXT.md → "Tool input" for when to pick this over `useToolComputation`.
 */
export function useToolInput<I, R>(options: UseToolInputOptions<I, R>): UseToolInputResult<I, R> {
  const [input, setInputState] = useState<I>(options.initial)
  const inputRef = useRef(input)
  inputRef.current = input
  const initialRef = useRef(options.initial)

  const {
    error,
    isPending,
    result,
    setInput: pipelineSetInput,
    setInputImmediate: pipelineSetInputImmediate,
  } = useToolComputation<I, R>(options.compute, {
    debounceMs: options.debounceMs,
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
      pipelineSetInput(val)
    },
    [pipelineSetInput],
  )

  const setInputImmediate = useCallback(
    (val: I) => {
      inputRef.current = val
      setInputState(val)
      pipelineSetInputImmediate(val)
    },
    [pipelineSetInputImmediate],
  )

  const recompute = useCallback(() => {
    pipelineSetInputImmediate(inputRef.current)
  }, [pipelineSetInputImmediate])

  const reset = useCallback(() => {
    const init = initialRef.current
    inputRef.current = init
    setInputState(init)
    pipelineSetInputImmediate(init)
  }, [pipelineSetInputImmediate])

  const autorunOnMount = options.autorunOnMount === true
  useMountOnce(() => {
    if (autorunOnMount) pipelineSetInputImmediate(inputRef.current)
  })

  return { error, input, isPending, recompute, reset, result, setInput, setInputImmediate }
}
