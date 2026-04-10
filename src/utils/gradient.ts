import type { GradientStop, GradientType, GradientConfig } from '@/types/utils/gradient'

export const DEFAULT_GRADIENT: GradientConfig = {
  angle: 135,
  stops: [
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 },
  ],
  type: 'linear',
}

export function generateGradientCss(type: GradientType, angle: number, stops: Array<GradientStop>): string {
  if (stops.length === 0)
    return type === 'radial'
      ? 'radial-gradient(circle, #000 0%, #fff 100%)'
      : 'linear-gradient(0deg, #000 0%, #fff 100%)'
  const clampedAngle = Math.max(0, Math.min(360, angle))
  const sortedStops = [...stops].sort((a, b) => a.position - b.position)
  const stopsStr = sortedStops.map((s) => `${s.color} ${Math.max(0, Math.min(100, s.position))}%`).join(', ')

  if (type === 'radial') {
    return `radial-gradient(circle, ${stopsStr})`
  }
  return `linear-gradient(${clampedAngle}deg, ${stopsStr})`
}

export type { GradientStop, GradientType, GradientConfig } from '@/types/utils/gradient'
