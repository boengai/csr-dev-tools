import type { HSLColor } from '@/types'

export type HarmonyType = 'analogous' | 'complementary' | 'monochromatic' | 'split-complementary' | 'triadic'

export type PaletteColor = {
  hex: string
  hsl: HSLColor
  rgb: string
}
