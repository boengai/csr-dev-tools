export type KeyframeStep = {
  backgroundColor: string
  opacity: number
  percent: number
  rotate: number
  scale: number
  translateX: number
  translateY: number
}

export type AnimationDirection = 'alternate' | 'alternate-reverse' | 'normal' | 'reverse'

export type AnimationFillMode = 'backwards' | 'both' | 'forwards' | 'none'

export type AnimationTimingFunction = 'ease' | 'ease-in' | 'ease-in-out' | 'ease-out' | 'linear'

export type AnimationConfig = {
  direction: AnimationDirection
  duration: number
  fillMode: AnimationFillMode
  iterationCount: string
  keyframes: Array<KeyframeStep>
  name: string
  timingFunction: AnimationTimingFunction
}
