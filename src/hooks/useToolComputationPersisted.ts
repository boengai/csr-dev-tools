import { useCallback, useEffect, useMemo, useState } from 'react'

import type { UseToolComputationPersistedOptions, UseToolComputationPersistedResult } from '@/types'
import { readJsonStorage, writeJsonStorage } from './persist/jsonStorage'
import { useMountOnce } from './useMountOnce'
import { useToolComputation } from './useToolComputation'

/**
 * Persistent variant of [[useToolComputation]] for single-Input Tools: owns the
 * localStorage round-trip + the mount-time recompute trigger. Same invariants
 * as `useToolComputation` (debounced, stale-safe, empty-bypass, unmount-safe) —
 * see CONTEXT.md → "Persistent tool computation".
 *
 * Autorun fires on mount only when `options.isEmpty` is provided AND the
 * restored input passes `!isEmpty(input)` — without `isEmpty`, the caller is
 * explicitly responsible for triggering the first compute.
 */
export function useToolComputationPersisted<I, R>(
  options: UseToolComputationPersistedOptions<I, R>,
): UseToolComputationPersistedResult<I, R> {
  const { storageKey, initial, initialResult, compute, ...computeOptions } = options

  const initialInput = useMemo(
    () => readJsonStorage(storageKey, initial),
    // Read-once on mount; subsequent input changes go through setInput / setInputImmediate.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only seed
    [],
  )

  const [input, setInputState] = useState<I>(initialInput)

  const {
    error,
    isPending,
    result,
    setInput: pipelineSetInput,
    setInputImmediate: pipelineSetInputImmediate,
  } = useToolComputation<I, R>(compute, {
    ...computeOptions,
    initial: initialResult,
  })

  const setInput = useCallback(
    (value: I) => {
      setInputState(value)
      pipelineSetInput(value)
    },
    [pipelineSetInput],
  )

  const setInputImmediate = useCallback(
    (value: I) => {
      setInputState(value)
      pipelineSetInputImmediate(value)
    },
    [pipelineSetInputImmediate],
  )

  useMountOnce(() => {
    if (computeOptions.isEmpty && !computeOptions.isEmpty(initialInput)) {
      pipelineSetInputImmediate(initialInput)
    }
  })

  // Fires once on mount with initialInput (re-)persisting the seed, and on
  // every subsequent input change. Initial write is intentional: it pins
  // the in-memory input to storage even when readJsonStorage returned the fallback.
  useEffect(() => {
    writeJsonStorage(storageKey, input)
  }, [storageKey, input])

  return { error, input, isPending, result, setInput, setInputImmediate }
}
