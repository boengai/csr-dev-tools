export type BoxShadowConfig = {
  alpha: number
  blur: number
  color: string
  hOffset: number
  inset: boolean
  spread: number
  vOffset: number
}

export const DEFAULT_BOX_SHADOW: BoxShadowConfig = {
  alpha: 25,
  blur: 8,
  color: '#000000',
  hOffset: 4,
  inset: false,
  spread: 0,
  vOffset: 4,
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const fullHex =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const r = Number.parseInt(fullHex.slice(0, 2), 16)
  const g = Number.parseInt(fullHex.slice(2, 4), 16)
  const b = Number.parseInt(fullHex.slice(4, 6), 16)
  const a = Math.round((alpha / 100) * 100) / 100
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function generateBoxShadowCSS(config: BoxShadowConfig): string {
  const { alpha, blur, color, hOffset, inset, spread, vOffset } = config
  const rgba = hexToRgba(color, alpha)
  const prefix = inset ? 'inset ' : ''
  return `${prefix}${hOffset}px ${vOffset}px ${blur}px ${spread}px ${rgba}`
}
