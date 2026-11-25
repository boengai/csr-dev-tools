export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const kindOf = (value: unknown): string => (Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value)

// A number also accepts text: `indent` is saved as `2` or `'tab'`, and a
// Generator reports a bad number itself.
const fits = (stored: unknown, initial: unknown): boolean =>
  kindOf(stored) === kindOf(initial) || (typeof initial === 'number' && typeof stored === 'string')

/** Lays a stored JSON value over its default. See CONTEXT.md → Persisted tool input. */
export const restoreJson = <T>(stored: unknown, initial: T): T => {
  if (!fits(stored, initial)) return initial
  if (Array.isArray(initial)) {
    const item: unknown = initial[0] ?? ''
    return (stored as Array<unknown>).filter((value) => fits(value, item)).map((value) => restoreJson(value, item)) as T
  }
  if (isRecord(initial)) {
    const fields = stored as Record<string, unknown>
    const declared = Object.entries(initial).map(([key, value]) => [key, restoreJson(fields[key], value)])
    return { ...fields, ...Object.fromEntries(declared) } as T
  }
  return stored as T
}
