import type { PickedColor } from '@/types/utils/color-picker'

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

export type { PickedColor } from '@/types/utils/color-picker'

// One 2D context per canvas, requested with `willReadFrequently` (CPU-backed,
// so repeated getImageData reads are cheap). The option only applies on a
// canvas's *first* getContext call, so all access must go through here.
const readableContexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D | null>()

export const getReadableContext2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D | null => {
  if (!readableContexts.has(canvas)) {
    readableContexts.set(canvas, canvas.getContext('2d', { willReadFrequently: true }))
  }
  return readableContexts.get(canvas) ?? null
}

/** Color of the canvas pixel under a viewport point (clamped to the canvas bounds). */
export const readCanvasColorAt = (canvas: HTMLCanvasElement, clientX: number, clientY: number): PickedColor | null => {
  const ctx = getReadableContext2d(canvas)
  if (!ctx) return null
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = Math.min(Math.max(Math.floor((clientX - rect.left) * scaleX), 0), canvas.width - 1)
  const y = Math.min(Math.max(Math.floor((clientY - rect.top) * scaleY), 0), canvas.height - 1)
  // A 1x1 read always yields exactly one RGBA quadruple.
  const [r = 0, g = 0, b = 0] = ctx.getImageData(x, y, 1, 1).data
  return pixelToColor(r, g, b)
}
