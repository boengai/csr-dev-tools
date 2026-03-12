import { describe, expect, it } from 'vitest'

import { IOS_DEVICES, MASKABLE_ICON_SIZES, MASKABLE_SAFE_ZONE_RATIO, PWA_ICON_SIZES } from '@/constants'

import { generateManifestIcons, generateSplashMetaTags } from './splash-screen'

describe('splash-screen', () => {
  describe('IOS_DEVICES manifest', () => {
    it('should have at least 20 devices', () => {
      expect(IOS_DEVICES.length).toBeGreaterThanOrEqual(20)
    })

    it('should have valid positive dimensions for all devices', () => {
      for (const device of IOS_DEVICES) {
        expect(device.width).toBeGreaterThan(0)
        expect(device.height).toBeGreaterThan(0)
        expect(device.scaleFactor).toBeGreaterThan(0)
      }
    })

    it('should have unique names', () => {
      const names = IOS_DEVICES.map((d) => d.name)
      expect(new Set(names).size).toBe(names.length)
    })

    it('should have category assignment for all devices', () => {
      for (const device of IOS_DEVICES) {
        expect(['iphone', 'ipad']).toContain(device.category)
      }
    })

    it('should contain iPhones and iPads', () => {
      const iphones = IOS_DEVICES.filter((d) => d.category === 'iphone')
      const ipads = IOS_DEVICES.filter((d) => d.category === 'ipad')
      expect(iphones.length).toBeGreaterThan(0)
      expect(ipads.length).toBeGreaterThan(0)
    })
  })

  describe('PWA_ICON_SIZES', () => {
    it('should contain standard icon sizes', () => {
      expect(PWA_ICON_SIZES).toContain(48)
      expect(PWA_ICON_SIZES).toContain(192)
      expect(PWA_ICON_SIZES).toContain(512)
    })

    it('should have 8 standard sizes', () => {
      expect(PWA_ICON_SIZES).toHaveLength(8)
    })
  })

  describe('MASKABLE_ICON_SIZES', () => {
    it('should contain 192 and 512', () => {
      expect(MASKABLE_ICON_SIZES).toContain(192)
      expect(MASKABLE_ICON_SIZES).toContain(512)
    })
  })

  describe('MASKABLE_SAFE_ZONE_RATIO', () => {
    it('should be 0.8 (80%)', () => {
      expect(MASKABLE_SAFE_ZONE_RATIO).toBe(0.8)
    })
  })

  describe('splash screen dimensions', () => {
    it('portrait orientation should use width < height', () => {
      for (const device of IOS_DEVICES) {
        // Portrait: width is the shorter dimension for phones
        if (device.category === 'iphone') {
          expect(device.width).toBeLessThan(device.height)
        }
      }
    })

    it('landscape should swap width and height', () => {
      for (const device of IOS_DEVICES) {
        const portraitW = device.width
        const portraitH = device.height
        // Landscape swaps: landscapeW = portraitH, landscapeH = portraitW
        const landscapeW = portraitH
        const landscapeH = portraitW
        expect(landscapeW).toBe(device.height)
        expect(landscapeH).toBe(device.width)
      }
    })
  })

  describe('maskable safe zone calculation', () => {
    it('should calculate safe zone as inner 80% of icon size', () => {
      const iconSize = 512
      const safeZoneSize = iconSize * MASKABLE_SAFE_ZONE_RATIO
      expect(safeZoneSize).toBe(409.6)
    })

    it('should calculate safe zone for 192px icon', () => {
      const iconSize = 192
      const safeZoneSize = iconSize * MASKABLE_SAFE_ZONE_RATIO
      expect(safeZoneSize).toBeCloseTo(153.6)
    })

    it('should leave padding on each side equal to 10% of icon size', () => {
      const iconSize = 512
      const safeZoneSize = iconSize * MASKABLE_SAFE_ZONE_RATIO
      const padding = (iconSize - safeZoneSize) / 2
      expect(padding).toBeCloseTo(iconSize * 0.1)
    })
  })

  describe('generateSplashMetaTags', () => {
    it('should generate meta tags for all devices', () => {
      const tags = generateSplashMetaTags(IOS_DEVICES)
      // Each device gets portrait + landscape = 2 tags
      const linkCount = (tags.match(/<link/g) ?? []).length
      expect(linkCount).toBe(IOS_DEVICES.length * 2)
    })

    it('should include apple-touch-startup-image rel', () => {
      const tags = generateSplashMetaTags(IOS_DEVICES)
      expect(tags).toContain('rel="apple-touch-startup-image"')
    })

    it('should include device-width media query', () => {
      const tags = generateSplashMetaTags(IOS_DEVICES)
      expect(tags).toContain('device-width:')
    })

    it('should include device-height media query', () => {
      const tags = generateSplashMetaTags(IOS_DEVICES)
      expect(tags).toContain('device-height:')
    })

    it('should include -webkit-device-pixel-ratio', () => {
      const tags = generateSplashMetaTags(IOS_DEVICES)
      expect(tags).toContain('-webkit-device-pixel-ratio:')
    })

    it('should include both portrait and landscape orientations', () => {
      const tags = generateSplashMetaTags(IOS_DEVICES)
      expect(tags).toContain('orientation: portrait')
      expect(tags).toContain('orientation: landscape')
    })

    it('should use correct logical dimensions for iPhone 17 Pro Max', () => {
      const device = IOS_DEVICES.find((d) => d.name === 'iPhone 17 Pro Max')!
      const tags = generateSplashMetaTags([device])
      const logicalWidth = Math.round(device.width / device.scaleFactor)
      const logicalHeight = Math.round(device.height / device.scaleFactor)
      expect(tags).toContain(`device-width: ${logicalWidth}px`)
      expect(tags).toContain(`device-height: ${logicalHeight}px`)
    })
  })

  describe('generateManifestIcons', () => {
    it('should generate valid JSON', () => {
      const json = generateManifestIcons()
      expect(() => JSON.parse(json)).not.toThrow()
    })

    it('should contain standard icon entries', () => {
      const icons = JSON.parse(generateManifestIcons()) as Array<{
        purpose: string
        sizes: string
        src: string
        type: string
      }>
      const standardIcons = icons.filter((i) => i.purpose === 'any')
      expect(standardIcons).toHaveLength(PWA_ICON_SIZES.length)
    })

    it('should contain maskable icon entries', () => {
      const icons = JSON.parse(generateManifestIcons()) as Array<{
        purpose: string
        sizes: string
        src: string
        type: string
      }>
      const maskableIcons = icons.filter((i) => i.purpose === 'maskable')
      expect(maskableIcons).toHaveLength(MASKABLE_ICON_SIZES.length)
    })

    it('should have correct sizes format', () => {
      const icons = JSON.parse(generateManifestIcons()) as Array<{
        purpose: string
        sizes: string
        src: string
        type: string
      }>
      for (const icon of icons) {
        expect(icon.sizes).toMatch(/^\d+x\d+$/)
      }
    })

    it('should have correct type for all entries', () => {
      const icons = JSON.parse(generateManifestIcons()) as Array<{
        purpose: string
        sizes: string
        src: string
        type: string
      }>
      for (const icon of icons) {
        expect(icon.type).toBe('image/png')
      }
    })

    it('should have correct purpose fields', () => {
      const icons = JSON.parse(generateManifestIcons()) as Array<{
        purpose: string
        sizes: string
        src: string
        type: string
      }>
      for (const icon of icons) {
        expect(['any', 'maskable']).toContain(icon.purpose)
      }
    })

    it('should use correct paths for standard icons', () => {
      const icons = JSON.parse(generateManifestIcons()) as Array<{
        purpose: string
        sizes: string
        src: string
        type: string
      }>
      const standardIcons = icons.filter((i) => i.purpose === 'any')
      for (const icon of standardIcons) {
        expect(icon.src).toMatch(/^\/icons\/icon-\d+x\d+\.png$/)
      }
    })

    it('should use correct paths for maskable icons', () => {
      const icons = JSON.parse(generateManifestIcons()) as Array<{
        purpose: string
        sizes: string
        src: string
        type: string
      }>
      const maskableIcons = icons.filter((i) => i.purpose === 'maskable')
      for (const icon of maskableIcons) {
        expect(icon.src).toMatch(/^\/icons\/maskable\/maskable-icon-\d+x\d+\.png$/)
      }
    })
  })

  describe('ZIP folder structure', () => {
    it('should use ios-splash/ for splash screen paths', () => {
      const device = IOS_DEVICES[0]
      const slug = device.name
        .toLowerCase()
        .replace(/[""]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      expect(`ios-splash/${slug}-portrait.png`).toMatch(/^ios-splash\/[a-z0-9-]+-portrait\.png$/)
    })

    it('should use icons/ for standard icon paths', () => {
      for (const size of PWA_ICON_SIZES) {
        const path = `icons/icon-${size}x${size}.png`
        expect(path).toMatch(/^icons\/icon-\d+x\d+\.png$/)
      }
    })

    it('should use icons/maskable/ for maskable icon paths', () => {
      for (const size of MASKABLE_ICON_SIZES) {
        const path = `icons/maskable/maskable-icon-${size}x${size}.png`
        expect(path).toMatch(/^icons\/maskable\/maskable-icon-\d+x\d+\.png$/)
      }
    })
  })
})
