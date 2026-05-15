import { useEffect, useMemo } from 'react'

import type { UseToolFieldsPersistedOptions, UseToolFieldsResult } from '@/types'
import { useMountOnce } from './useMountOnce'
import { useToolFields } from './useToolFields'

function readBag<F>(key: string, fallback: F): F {
  try {
    const item = localStorage.getItem(key)
    return item !== null ? (JSON.parse(item) as F) : fallback
  } catch {
    return fallback
  }
}

function writeBag<F>(key: string, value: F): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full — accept; the in-memory bag remains the source of truth
  }
}

/**
 * Persistent variant of [[useToolFields]]: owns the localStorage round-trip
 * for the input bag plus the mount-time recompute trigger. Same invariants
 * as `useToolFields` (debounced, stale-safe, empty-bypass, unmount-safe,
 * same-tick partial merge) — see CONTEXT.md → "Persistent tool field bag".
 *
 * Autorun fires on mount only when `options.isEmpty` is provided AND the
 * restored bag passes `!isEmpty(bag)` — without `isEmpty`, the caller is
 * explicitly responsible for triggering the first compute.
 */
export function useToolFieldsPersisted<F, R>(
  options: UseToolFieldsPersistedOptions<F, R>,
): UseToolFieldsResult<F, R> {
  const { storageKey, ...fieldsOptions } = options

  const initialBag = useMemo(
    () => readBag(storageKey, fieldsOptions.initial),
    // Read-once on mount; bag changes go through useToolFields, not via re-running this memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only seed
    [],
  )

  const fields = useToolFields<F, R>({ ...fieldsOptions, initial: initialBag })

  useMountOnce(() => {
    if (fieldsOptions.isEmpty && !fieldsOptions.isEmpty(initialBag)) {
      fields.setFieldsImmediate({})
    }
  })

  // Fires once on mount with initialBag (re-)persisting the seed, and on
  // every subsequent inputs change. Initial write is intentional: it pins
  // the in-memory bag to storage even when readBag returned the fallback.
  useEffect(() => {
    writeBag(storageKey, fields.inputs)
  }, [storageKey, fields.inputs])

  return fields
}
