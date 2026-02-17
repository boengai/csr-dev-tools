export type KeyframeStep = {
  backgroundColor: string
  opacity: number
  percent: number
  rotate: number
  scale: number
  translateX: number
  translateY: number
}

export type AnimationConfig = {
  direction: string
  duration: number
  fillMode: string
  iterationCount: string
  keyframes: Array<KeyframeStep>
  name: string
  timingFunction: string
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  direction: 'normal',
  duration: 1,
  fillMode: 'forwards',
  iterationCount: '1',
  keyframes: [
    { backgroundColor: '#6366f1', opacity: 0, percent: 0, rotate: 0, scale: 1, translateX: 0, translateY: 0 },
    { backgroundColor: '#6366f1', opacity: 1, percent: 100, rotate: 0, scale: 1, translateX: 0, translateY: 0 },
  ],
  name: 'custom-animation',
  timingFunction: 'ease',
}

export const buildTransformString = (step: KeyframeStep): string => {
  return `translateX(${step.translateX}px) translateY(${step.translateY}px) rotate(${step.rotate}deg) scale(${step.scale})`
}

const formatKeyframeBlock = (step: KeyframeStep): string => {
  const lines = [
    `    opacity: ${step.opacity};`,
    `    transform: ${buildTransformString(step)};`,
    `    background-color: ${step.backgroundColor};`,
  ]
  return `  ${step.percent}% {\n${lines.join('\n')}\n  }`
}

export const generateAnimationCss = (config: AnimationConfig): string => {
  const sorted = [...config.keyframes].sort((a, b) => a.percent - b.percent)
  const keyframeBlocks = sorted.map(formatKeyframeBlock).join('\n')
  const keyframesRule = `@keyframes ${config.name} {\n${keyframeBlocks}\n}`
  const shorthand = `animation: ${config.name} ${config.duration}s ${config.timingFunction} ${config.iterationCount} ${config.direction} ${config.fillMode};`
  const selector = `.animated-element {\n  ${shorthand}\n}`
  return `${keyframesRule}\n\n${selector}`
}
