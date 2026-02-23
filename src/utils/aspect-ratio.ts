const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export const simplifyRatio = (width: number, height: number): string => {
  if (width <= 0 || height <= 0) return ''
  const w = Math.round(width)
  const h = Math.round(height)
  if (w <= 0 || h <= 0) return ''
  const divisor = gcd(w, h)
  return `${w / divisor}:${h / divisor}`
}

export const calculateDimension = (
  known: number,
  ratioW: number,
  ratioH: number,
  solveFor: 'width' | 'height',
): number => {
  if (ratioW <= 0 || ratioH <= 0 || known <= 0) return 0
  if (solveFor === 'height') return (known / ratioW) * ratioH
  return (known / ratioH) * ratioW
}

export const parseRatio = (input: string): { w: number; h: number } | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    if (parts.length !== 2) return null
    const w = Number(parts[0])
    const h = Number(parts[1])
    if (Number.isNaN(w) || Number.isNaN(h) || w <= 0 || h <= 0) return null
    return { w, h }
  }

  const decimal = Number(trimmed)
  if (Number.isNaN(decimal) || decimal <= 0) return null
  return { w: decimal, h: 1 }
}
