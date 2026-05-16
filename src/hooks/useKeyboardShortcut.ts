import { useEffect, useRef } from 'react'

/**
 * Subscribes a document-level `keydown` listener that fires `handler` when
 * `predicate` matches the event. The predicate + handler latest references
 * are captured via refs so callers don't need to memoize them; the
 * subscription only re-attaches when `enabled` flips.
 *
 * Pick this for app-level or modal-level keyboard shortcuts. For
 * scoped-to-element keyboard nav inside a searchable list, see
 * [[Keyboard list navigation]] (`useKeyboardListNav`).
 */
export function useKeyboardShortcut(
  predicate: (event: KeyboardEvent) => boolean,
  handler: (event: KeyboardEvent) => void,
  options?: { enabled?: boolean },
): void {
  const enabled = options?.enabled ?? true
  const predicateRef = useRef(predicate)
  predicateRef.current = predicate
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (predicateRef.current(event)) {
        handlerRef.current(event)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled])
}
