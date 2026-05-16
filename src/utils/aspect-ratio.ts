import type { AspectRatioInput, AspectRatioOutput } from '@/types'

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

const INVALID_WIDTH_MSG = 'Enter a valid width (e.g., 1920)'
const INVALID_HEIGHT_MSG = 'Enter a valid height (e.g., 1080)'
const INVALID_RATIO_MSG = 'Enter a valid ratio (e.g., 16:9 or 1.778)'

export const solveAspectRatio = (input: AspectRatioInput): AspectRatioOutput => {
  const { source, width, height, ratio, locked, lastEdited } = input

  if (source === 'width') {
    const wNum = Number(width)
    if (Number.isNaN(wNum) || wNum <= 0) throw new Error(INVALID_WIDTH_MSG)
    if (ratio.trim()) {
      const parsed = parseRatio(ratio)
      if (parsed) {
        const newH = Math.round(calculateDimension(wNum, parsed.w, parsed.h, 'height')).toString()
        return { height: newH, ratio, width }
      }
      return { height, ratio, width }
    }
    if (height.trim()) {
      const hNum = Number(height)
      if (!Number.isNaN(hNum) && hNum > 0) {
        return { height, ratio: simplifyRatio(wNum, hNum), width }
      }
    }
    return { height, ratio, width }
  }

  if (source === 'height') {
    const hNum = Number(height)
    if (Number.isNaN(hNum) || hNum <= 0) throw new Error(INVALID_HEIGHT_MSG)
    if (ratio.trim()) {
      const parsed = parseRatio(ratio)
      if (parsed) {
        const newW = Math.round(calculateDimension(hNum, parsed.w, parsed.h, 'width')).toString()
        return { height, ratio, width: newW }
      }
      return { height, ratio, width }
    }
    if (width.trim()) {
      const wNum = Number(width)
      if (!Number.isNaN(wNum) && wNum > 0) {
        return { height, ratio: simplifyRatio(wNum, hNum), width }
      }
    }
    return { height, ratio, width }
  }

  // source === 'ratio' — recompute the unlocked / non-last-edited side.
  // Errors on the dependent side are silent (today's behavior) — only ratio's own
  // parse error throws.
  const parsed = parseRatio(ratio)
  if (!parsed) throw new Error(INVALID_RATIO_MSG)

  const chooseRecompute = (): 'width' | 'height' | null => {
    if (locked === 'width' && width.trim()) return 'height'
    if (locked === 'height' && height.trim()) return 'width'
    if (lastEdited === 'width' && width.trim()) return 'height'
    if (lastEdited === 'height' && height.trim()) return 'width'
    return null
  }

  const target = chooseRecompute()
  if (target === 'height') {
    const wNum = Number(width)
    if (Number.isNaN(wNum) || wNum <= 0) return { height, ratio, width }
    const newH = Math.round(calculateDimension(wNum, parsed.w, parsed.h, 'height')).toString()
    return { height: newH, ratio, width }
  }
  if (target === 'width') {
    const hNum = Number(height)
    if (Number.isNaN(hNum) || hNum <= 0) return { height, ratio, width }
    const newW = Math.round(calculateDimension(hNum, parsed.w, parsed.h, 'width')).toString()
    return { height, ratio, width: newW }
  }
  return { height, ratio, width }
}
