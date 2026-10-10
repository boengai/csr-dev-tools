/**
 * JSON-on-localStorage primitives with the project's standard try-catch
 * policy: read returns the JSON-encoded value if present and parseable,
 * fall back to a default otherwise; write swallows quota errors so the
 * in-memory state stays the source of truth.
 *
 * Adopters today: `useInputLocalStorage`, `useDebouncedJsonWrite` (the
 * writer behind `useToolInput` / `useToolFields`'s `storageKey`), the
 * `storageKey` seed read in those two hooks, plus
 * `BidirectionalConverter` for its per-mode source storage where the key
 * is derived from the current mode rather than being static.
 *
 * Plain functions (not hooks). React-side state ownership stays with
 * the adopter.
 */

export function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    return item !== null ? (JSON.parse(item) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJsonStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable — accept; the in-memory value remains the source of truth
  }
}
