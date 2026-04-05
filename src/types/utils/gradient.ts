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
