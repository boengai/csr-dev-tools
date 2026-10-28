/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IOS_DEVICES, MASKABLE_ICON_SIZES, PWA_ICON_SIZES, THUMBNAIL_REDUCING_GAP } from '@/constants'

import { createScaledDrawer } from './canvas'
import { generateAllAssets } from './splash-screen'

const { draw } = vi.hoisted(() => ({ draw: vi.fn() }))

vi.mock('./canvas', () => ({
  canvasToBlob: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  createScaledDrawer: vi.fn(() => draw),
}))

beforeEach(() => {
  vi.mocked(createScaledDrawer).mockClear()
  draw.mockClear()
  const ctx = { drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '' }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateAllAssets', () => {
  it('produces blobs only — no base64 dataURL copies of the full-size canvases', async () => {
    const image = Object.assign(new Image(), { height: 512, width: 512 })
    const output = await generateAllAssets(image, '#ffffff', 0.5)

    expect(output.splashScreens).toHaveLength(IOS_DEVICES.length * 2)
    expect(output.icons).toHaveLength(PWA_ICON_SIZES.length + MASKABLE_ICON_SIZES.length)
    expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
    for (const asset of [...output.splashScreens, ...output.icons]) {
      expect(asset.blob).toBeInstanceOf(Blob)
      expect(asset).not.toHaveProperty('dataUrl')
    }
  })

  it('draws every asset through one thumbnail-gap drawer, so the source pixels are read once', async () => {
    const image = Object.assign(new Image(), { height: 512, width: 512 })
    await generateAllAssets(image, '#ffffff', 0.5)

    expect(createScaledDrawer).toHaveBeenCalledTimes(1)
    expect(createScaledDrawer).toHaveBeenCalledWith(image, { reducingGap: THUMBNAIL_REDUCING_GAP })
    expect(draw).toHaveBeenCalledTimes(IOS_DEVICES.length * 2 + PWA_ICON_SIZES.length + MASKABLE_ICON_SIZES.length)
  })
})
