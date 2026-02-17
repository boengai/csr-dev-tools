export type PickedColor = {
  hex: string
  hsl: string
  rgb: string
}

export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export const rgbToHsl = (r: number, g: number, b: number): string => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
        break
      case gn:
        h = ((bn - rn) / d + 2) / 6
        break
      case bn:
        h = ((rn - gn) / d + 4) / 6
        break
    }
  }

  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
}

export const pixelToColor = (r: number, g: number, b: number): PickedColor => ({
  hex: rgbToHex(r, g, b),
  hsl: rgbToHsl(r, g, b),
  rgb: `rgb(${r}, ${g}, ${b})`,
})
