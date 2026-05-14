import type { HSLColor } from '@/types'
import { convertColor } from '@/wasm/color'

export const normalizeHue = (hue: number): number => ((hue % 360) + 360) % 360

export const hexToHsl = async (hex: string): Promise<HSLColor> => {
  const result = await convertColor(hex, 'hex')
  // Parse the HSL string back into an HSLColor object
  const match = result.hsl.match(/hsl\(([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%\)/)
  if (!match) {
    throw new Error('Failed to parse HSL result')
  }
  return {
    h: Number(match[1]),
    l: Number(match[3]),
    s: Number(match[2]),
  }
}
