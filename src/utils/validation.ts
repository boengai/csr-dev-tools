export const isValidHex = (value: string): boolean => {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
}

export const isValidRgb = (value: string): boolean => {
  const match = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
  if (!match) return false
  const [, r, g, b] = match
  return [r, g, b].every((v) => {
    const n = Number(v)
    return n >= 0 && n <= 255
  })
}

export const isValidHsl = (value: string): boolean => {
  const match = value.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/)
  if (!match) return false
  const [, h, s, l] = match
  return Number(h) >= 0 && Number(h) <= 360 && Number(s) >= 0 && Number(s) <= 100 && Number(l) >= 0 && Number(l) <= 100
}

export const isValidBase64 = (value: string): boolean => {
  if (value.length === 0) return false
  return /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length % 4 === 0
}

export const isValidUrl = (value: string): boolean => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export const isValidJson = (value: string): boolean => {
  if (value.trim().length === 0) return false
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

export const isValidJwt = (value: string): boolean => {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)
}

export const isValidUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export const isValidTimestamp = (value: string): boolean => {
  if (!/^\d+$/.test(value)) return false
  const num = Number(value)
  return num <= 4398046511103
}
