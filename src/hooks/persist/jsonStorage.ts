/**
 * JSON-on-localStorage primitives shared by `useInputLocalStorage`,
 * `useToolFieldsPersisted`, and `useToolComputationPersisted`. All three
 * hooks need the same try-catch shape: read the JSON-encoded value if
 * present and parseable, fall back to a default otherwise; write the
 * JSON-encoded value, swallowing quota errors so the in-memory state
 * stays the source of truth.
 *
 * Plain functions (not hooks). Locality with the persist hooks is
 * intentional — these helpers exist because of those hooks.
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
