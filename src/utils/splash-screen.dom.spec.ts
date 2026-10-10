/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IOS_DEVICES, MASKABLE_ICON_SIZES, PWA_ICON_SIZES } from '@/constants'

import { generateAllAssets } from './splash-screen'

vi.mock('./canvas', () => ({ canvasToBlob: vi.fn(async () => new Blob(['png'], { type: 'image/png' })) }))

beforeEach(() => {
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
})
