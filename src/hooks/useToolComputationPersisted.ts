import { useCallback, useEffect, useMemo, useState } from 'react'

import type { UseToolComputationPersistedOptions, UseToolComputationPersistedResult } from '@/types'
import { useMountOnce } from './useMountOnce'
import { useToolComputation } from './useToolComputation'

function readValue<I>(key: string, fallback: I): I {
  try {
    const item = localStorage.getItem(key)
    return item !== null ? (JSON.parse(item) as I) : fallback
  } catch {
    return fallback
  }
}

function writeValue<I>(key: string, value: I): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full — accept; the in-memory value remains the source of truth
  }
}

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
  const { storageKey, initial, initialResult, ...computeOptions } = options

  const initialInput = useMemo(
    () => readValue(storageKey, initial),
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
  } = useToolComputation<I, R>(options.compute, {
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
  // the in-memory input to storage even when readValue returned the fallback.
  useEffect(() => {
    writeValue(storageKey, input)
  }, [storageKey, input])

  return { error, input, isPending, result, setInput, setInputImmediate }
}
