export const deepSortJson = (value: unknown): unknown => {
  if (value === null || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    const sorted = value.map((item) => deepSortJson(item))
    sorted.sort((a, b) => {
      const aStr = JSON.stringify(a)
      const bStr = JSON.stringify(b)
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
    })
    return sorted
  }

  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = deepSortJson((value as Record<string, unknown>)[key])
  }
  return sorted
}

export const normalizeJson = (input: string): string => {
  const parsed = JSON.parse(input) as unknown
  const sorted = deepSortJson(parsed)
  return JSON.stringify(sorted, null, 2)
}

export const getJsonDiffError = (input: string, label: string): string | null => {
  if (input.trim().length === 0) return null
  try {
    JSON.parse(input)
    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return `${label} JSON is invalid: ${message}`
  }
}
