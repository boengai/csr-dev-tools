import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

type EnvParseResult = {
  entries: Array<{ key: string; value: string }>
  warnings: Array<string>
}

export const parseEnv = (input: string): EnvParseResult => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const lines = input.split('\n')
  const entries: Array<{ key: string; value: string }> = []
  const warnings: Array<string> = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.length === 0 || line.startsWith('#')) continue

    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) {
      warnings.push(`Line ${i + 1}: malformed (no = sign)`)
      continue
    }

    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (key.length === 0) {
      warnings.push(`Line ${i + 1}: empty key`)
      continue
    }

    entries.push({ key, value })
  }

  return { entries, warnings }
}

const needsQuoting = (value: string): boolean => {
  return /[\s"'#=\\]/.test(value) || value.length === 0
}

export const envToJson = (input: string): { output: string; warnings: Array<string> } => {
  const { entries, warnings } = parseEnv(input)
  const obj: Record<string, string> = {}
  for (const { key, value } of entries) {
    obj[key] = value
  }
  return { output: JSON.stringify(obj, null, 2), warnings }
}

export const envToYaml = (input: string): { output: string; warnings: Array<string> } => {
  const { entries, warnings } = parseEnv(input)
  const obj: Record<string, string> = {}
  for (const { key, value } of entries) {
    obj[key] = value
  }
  return { output: stringifyYaml(obj, { indent: 2 }), warnings }
}

export const jsonToEnv = (input: string): string => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const obj = JSON.parse(input)
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Input must be a JSON object')
  }
  return Object.entries(obj)
    .map(([key, value]) => {
      if (value !== null && typeof value === 'object') {
        throw new Error(`Value for "${key}" is a nested object/array — .env only supports flat key=value pairs`)
      }
      const strVal = String(value ?? '')
      if (needsQuoting(strVal)) {
        const escaped = strVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        return `${key}="${escaped}"`
      }
      return `${key}=${strVal}`
    })
    .join('\n')
}

export const yamlToEnv = (input: string): string => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const obj = parseYaml(input)
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Input must be a YAML mapping')
  }
  return Object.entries(obj)
    .map(([key, value]) => {
      if (value !== null && typeof value === 'object') {
        throw new Error(`Value for "${key}" is a nested object/array — .env only supports flat key=value pairs`)
      }
      const strVal = String(value ?? '')
      if (needsQuoting(strVal)) {
        const escaped = strVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        return `${key}="${escaped}"`
      }
      return `${key}=${strVal}`
    })
    .join('\n')
}
