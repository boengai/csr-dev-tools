const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const key of Object.keys(obj).sort()) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey))
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value)
    } else if (value === null) {
      result[fullKey] = 'null'
    } else {
      result[fullKey] = String(value)
    }
  }
  return result
}

const escapeCsvField = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export const jsonToCsv = (input: string): string => {
  if (input.trim().length === 0) throw new Error('Empty input')

  const parsed: unknown = JSON.parse(input)

  if (!Array.isArray(parsed)) throw new Error('JSON must be an array of objects (e.g., [{"name": "Alice"}])')
  if (parsed.length === 0) throw new Error('JSON array must contain at least one object (e.g., [{"name": "Alice"}])')

  for (const item of parsed) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error('All array items must be objects (e.g., [{"name": "Alice"}])')
    }
  }

  const allKeys = new Set<string>()
  const flatRows = parsed.map((item) => {
    const flat = flattenObject(item as Record<string, unknown>)
    for (const key of Object.keys(flat)) {
      allKeys.add(key)
    }
    return flat
  })

  const headers = [...allKeys].sort()
  const headerRow = headers.map(escapeCsvField).join(',')
  const dataRows = flatRows.map((flat) => headers.map((h) => escapeCsvField(flat[h] ?? '')).join(','))

  return [headerRow, ...dataRows].join('\n')
}

const parseCsvRows = (input: string): Array<Array<string>> => {
  const rows: Array<Array<string>> = []
  let currentRow: Array<string> = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < input.length) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < input.length && input[i + 1] === '"') {
          currentField += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      currentField += char
      i++
      continue
    }

    if (char === '"') {
      if (currentField.length === 0) {
        inQuotes = true
        i++
        continue
      }
      currentField += char
      i++
      continue
    }

    if (char === ',') {
      currentRow.push(currentField)
      currentField = ''
      i++
      continue
    }

    if (char === '\r' && i + 1 < input.length && input[i + 1] === '\n') {
      currentRow.push(currentField)
      currentField = ''
      rows.push(currentRow)
      currentRow = []
      i += 2
      continue
    }

    if (char === '\n') {
      currentRow.push(currentField)
      currentField = ''
      rows.push(currentRow)
      currentRow = []
      i++
      continue
    }

    currentField += char
    i++
  }

  currentRow.push(currentField)
  if (currentRow.length > 1 || currentRow[0] !== '') {
    rows.push(currentRow)
  }

  return rows
}

export const csvToJson = (input: string, indent = 2): string => {
  if (input.trim().length === 0) throw new Error('Empty input')

  const rows = parseCsvRows(input)
  if (rows.length === 0) throw new Error('Empty input')

  const headers = rows[0]
  const dataRows = rows.slice(1)

  const objects = dataRows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])))

  return JSON.stringify(objects, null, indent)
}

export const getCsvParseError = (input: string): string | null => {
  if (input.trim().length === 0) return 'Empty input'

  let inQuotes = false
  let fieldStart = true

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < input.length && input[i + 1] === '"') {
          i++
        } else {
          inQuotes = false
          fieldStart = false
        }
      }
    } else if (char === '"' && fieldStart) {
      inQuotes = true
      fieldStart = false
    } else if (char === ',') {
      fieldStart = true
    } else if (char === '\r' && i + 1 < input.length && input[i + 1] === '\n') {
      fieldStart = true
      i++
    } else if (char === '\n') {
      fieldStart = true
    } else {
      fieldStart = false
    }
  }

  if (inQuotes) return 'Unterminated quoted field'
  return null
}
