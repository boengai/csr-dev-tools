import { useEffect, useMemo } from 'react'

import type { UseToolFieldsPersistedOptions, UseToolFieldsResult } from '@/types'

import { useToolFields } from '../useToolFields'
import { readJsonStorage, writeJsonStorage } from './jsonStorage'

/**
 * Persistent variant of [[useToolFields]]: owns the localStorage round-trip
 * for the input bag plus the mount-time recompute trigger. Same invariants
 * as `useToolFields` (debounced, stale-safe, empty-bypass, unmount-safe,
 * same-tick partial merge) — see CONTEXT.md → "Persistent tool field bag".
 *
 * Mount autorun fires when EITHER:
 *   - `options.autorunOnMount === true` (explicit, isEmpty-independent), OR
 *   - `options.isEmpty` is provided AND the restored bag passes `!isEmpty(bag)`.
 * Without either, the caller is explicitly responsible for triggering the
 * first compute. The autorun decision is owned by `useToolFields` via its
 * own `autorunOnMount` option — this hook just computes the effective flag.
 */
export function useToolFieldsPersisted<F, R>(options: UseToolFieldsPersistedOptions<F, R>): UseToolFieldsResult<F, R> {
  const { storageKey, ...fieldsOptions } = options

  const initialBag = useMemo(
    () => readJsonStorage(storageKey, fieldsOptions.initial),
    // Read-once on mount; bag changes go through useToolFields, not via re-running this memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only seed
    [],
  )

  const effectiveAutorun =
    fieldsOptions.autorunOnMount === true ||
    (fieldsOptions.isEmpty !== undefined && !fieldsOptions.isEmpty(initialBag))

  const fields = useToolFields<F, R>({
    ...fieldsOptions,
    autorunOnMount: effectiveAutorun,
    initial: initialBag,
  })

  // Fires once on mount with initialBag (re-)persisting the seed, and on
  // every subsequent inputs change. Initial write is intentional: it pins
  // the in-memory bag to storage even when readJsonStorage returned the fallback.
  useEffect(() => {
    writeJsonStorage(storageKey, fields.inputs)
  }, [storageKey, fields.inputs])

  return fields
}
