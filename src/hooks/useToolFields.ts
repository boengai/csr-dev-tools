import { useCallback, useRef, useState } from 'react'

import type { UseToolFieldsOptions, UseToolFieldsResult } from '@/types'

import { readJsonStorage } from './persist/jsonStorage'
import { useDebouncedJsonWrite } from './persist/useDebouncedJsonWrite'
import { useMountOnce } from './useMountOnce'
import { useToolComputation } from './useToolComputation'

/**
 * Tool computation pipeline that owns its input bag. A multi-field variant of
 * [[useToolComputation]] — the hook holds the field values, fans partial
 * updates into a complete bag, and routes that bag through the same four
 * invariants (debounced, stale-safe, empty-bypass, unmount-safe).
 *
 * Exposes `recompute()` to fire compute with the current bag — the documented
 * canonical alternative to the `setFieldsImmediate({})` empty-partial idiom.
 *
 * Optional persistence: pass `storageKey` to seed the bag from localStorage
 * once on mount and write it back (trailing-debounced, flushed on unmount and
 * `pagehide`). Mount autorun fires when `autorunOnMount === true` OR (with
 * `storageKey`) when `isEmpty` is provided AND the restored bag is non-empty.
 *
 * See CONTEXT.md → "Tool computation pipeline" for the invariants and
 * "Tool field bag" for when to pick this over `useToolComputation`.
 */
export function useToolFields<F, R>(options: UseToolFieldsOptions<F, R>): UseToolFieldsResult<F, R> {
  const { storageKey } = options
  const [seed] = useState<F>(() =>
    storageKey === undefined ? options.initial : readJsonStorage(storageKey, options.initial),
  )
  const [inputs, setInputs] = useState<F>(seed)
  // Every setter writes this synchronously so same-tick partials compose
  // (the Tool field bag's extra invariant) without a render-time mirror.
  const inputsRef = useRef(seed)
  const initialRef = useRef(options.initial)

  const debounceMs = options.debounceMs ?? 300
  const persist = useDebouncedJsonWrite<F>(storageKey, debounceMs)

  const { error, isPending, result, setInput, setInputImmediate } = useToolComputation<F, R>(options.compute, {
    debounceMs,
    errorFallback: options.errorFallback,
    errorLabel: options.errorLabel,
    initial: options.initialResult,
    isEmpty: options.isEmpty,
    onError: options.onError,
  })

  const setFields = useCallback(
    (partial: Partial<F>) => {
      const next = { ...inputsRef.current, ...partial }
      inputsRef.current = next
      setInputs(next)
      persist.schedule(next)
      setInput(next)
    },
    [persist, setInput],
  )

  const setFieldsImmediate = useCallback(
    (partial: Partial<F>) => {
      const next = { ...inputsRef.current, ...partial }
      inputsRef.current = next
      setInputs(next)
      persist.writeNow(next)
      setInputImmediate(next)
    },
    [persist, setInputImmediate],
  )

  const recompute = useCallback(() => {
    setInputImmediate(inputsRef.current)
  }, [setInputImmediate])

  const reset = useCallback(() => {
    const init = initialRef.current
    inputsRef.current = init
    setInputs(init)
    persist.writeNow(init)
    setInputImmediate(init)
  }, [persist, setInputImmediate])

  // Decided once from the mount-time seed (the restored bag when persisted).
  const [autorun] = useState(
    () =>
      options.autorunOnMount === true ||
      (storageKey !== undefined && options.isEmpty !== undefined && !options.isEmpty(seed)),
  )
  useMountOnce(() => {
    if (autorun) setInputImmediate(inputsRef.current)
  })

  return { error, inputs, isPending, recompute, reset, result, setFields, setFieldsImmediate }
}
