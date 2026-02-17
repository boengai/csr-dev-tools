import { describe, expect, it } from 'vitest'

import {
  buildTransformString,
  DEFAULT_ANIMATION_CONFIG,
  generateAnimationCss,
  type AnimationConfig,
  type KeyframeStep,
} from './css-animation'

describe('css-animation', () => {
  describe('buildTransformString', () => {
    it('combines translate, rotate, and scale', () => {
      const step: KeyframeStep = {
        backgroundColor: '#000',
        opacity: 1,
        percent: 0,
        rotate: 45,
        scale: 1.5,
        translateX: 10,
        translateY: -20,
      }
      expect(buildTransformString(step)).toBe('translateX(10px) translateY(-20px) rotate(45deg) scale(1.5)')
    })
  })

  describe('generateAnimationCss', () => {
    it('generates correct CSS for simple fade-in (0%→100% opacity)', () => {
      const css = generateAnimationCss(DEFAULT_ANIMATION_CONFIG)
      expect(css).toContain('@keyframes custom-animation')
      expect(css).toContain('0% {')
      expect(css).toContain('opacity: 0;')
      expect(css).toContain('100% {')
      expect(css).toContain('opacity: 1;')
    })

    it('generates multi-keyframe with transforms at 0%, 50%, 100%', () => {
      const config: AnimationConfig = {
        ...DEFAULT_ANIMATION_CONFIG,
        keyframes: [
          { backgroundColor: '#000', opacity: 1, percent: 0, rotate: 0, scale: 1, translateX: 0, translateY: 0 },
          { backgroundColor: '#000', opacity: 1, percent: 50, rotate: 180, scale: 2, translateX: 100, translateY: 0 },
          { backgroundColor: '#000', opacity: 1, percent: 100, rotate: 360, scale: 1, translateX: 0, translateY: 0 },
        ],
      }
      const css = generateAnimationCss(config)
      expect(css).toContain('50% {')
      expect(css).toContain('rotate(180deg)')
      expect(css).toContain('scale(2)')
      expect(css).toContain('translateX(100px)')
    })

    it('includes animation shorthand with all properties', () => {
      const css = generateAnimationCss(DEFAULT_ANIMATION_CONFIG)
      expect(css).toContain('animation: custom-animation 1s ease 1 normal forwards;')
    })

    it('outputs infinite iteration-count', () => {
      const config: AnimationConfig = { ...DEFAULT_ANIMATION_CONFIG, iterationCount: 'infinite' }
      const css = generateAnimationCss(config)
      expect(css).toContain('infinite')
    })

    it('outputs alternate direction', () => {
      const config: AnimationConfig = { ...DEFAULT_ANIMATION_CONFIG, direction: 'alternate' }
      const css = generateAnimationCss(config)
      expect(css).toContain('alternate')
    })

    it('sorts keyframes by percent', () => {
      const config: AnimationConfig = {
        ...DEFAULT_ANIMATION_CONFIG,
        keyframes: [
          { backgroundColor: '#000', opacity: 1, percent: 100, rotate: 0, scale: 1, translateX: 0, translateY: 0 },
          { backgroundColor: '#000', opacity: 0, percent: 0, rotate: 0, scale: 1, translateX: 0, translateY: 0 },
          { backgroundColor: '#000', opacity: 0.5, percent: 50, rotate: 0, scale: 1, translateX: 0, translateY: 0 },
        ],
      }
      const css = generateAnimationCss(config)
      const idx0 = css.indexOf('0% {')
      const idx50 = css.indexOf('50% {')
      const idx100 = css.indexOf('100% {')
      expect(idx0).toBeLessThan(idx50)
      expect(idx50).toBeLessThan(idx100)
    })

    it('produces valid CSS from default config', () => {
      const css = generateAnimationCss(DEFAULT_ANIMATION_CONFIG)
      expect(css).toContain('@keyframes')
      expect(css).toContain('.animated-element {')
      expect(css).toContain('animation:')
    })
  })
})
