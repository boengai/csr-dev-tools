import { useCallback, useRef, useState } from 'react'

import type { UseToolFieldsOptions, UseToolFieldsResult } from '@/types'
import { useToolComputation } from './useToolComputation'

/**
 * Tool computation pipeline that owns its input bag. A multi-field variant of
 * [[useToolComputation]] — the hook holds the field values, fans partial
 * updates into a complete bag, and routes that bag through the same four
 * invariants (debounced, stale-safe, empty-bypass, unmount-safe).
 *
 * See CONTEXT.md → "Tool computation pipeline" for the invariants and
 * "Tool field bag" for when to pick this over `useToolComputation`.
 */
export function useToolFields<F, R>(options: UseToolFieldsOptions<F, R>): UseToolFieldsResult<F, R> {
  const [inputs, setInputs] = useState<F>(options.initial)
  const inputsRef = useRef(inputs)
  inputsRef.current = inputs
  const initialRef = useRef(options.initial)

  const { error, isPending, result, setInput, setInputImmediate } = useToolComputation<F, R>(options.compute, {
    debounceMs: options.debounceMs,
    initial: options.initialResult,
    isEmpty: options.isEmpty,
    onError: options.onError,
  })

  const setFields = useCallback(
    (partial: Partial<F>) => {
      const next = { ...inputsRef.current, ...partial }
      inputsRef.current = next
      setInputs(next)
      setInput(next)
    },
    [setInput],
  )

  const setFieldsImmediate = useCallback(
    (partial: Partial<F>) => {
      const next = { ...inputsRef.current, ...partial }
      inputsRef.current = next
      setInputs(next)
      setInputImmediate(next)
    },
    [setInputImmediate],
  )

  const reset = useCallback(() => {
    const init = initialRef.current
    inputsRef.current = init
    setInputs(init)
    setInputImmediate(init)
  }, [setInputImmediate])

  return { error, inputs, isPending, reset, result, setFields, setFieldsImmediate }
}
