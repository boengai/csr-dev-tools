export type GradientStop = {
  color: string
  position: number
}

export type GradientType = 'linear' | 'radial'

export type GradientConfig = {
  angle: number
  stops: Array<GradientStop>
  type: GradientType
}

export const DEFAULT_GRADIENT: GradientConfig = {
  angle: 135,
  stops: [
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 },
  ],
  type: 'linear',
}

export function generateGradientCss(type: GradientType, angle: number, stops: Array<GradientStop>): string {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position)
  const stopsStr = sortedStops.map((s) => `${s.color} ${s.position}%`).join(', ')

  if (type === 'radial') {
    return `radial-gradient(circle, ${stopsStr})`
  }
  return `linear-gradient(${angle}deg, ${stopsStr})`
}
