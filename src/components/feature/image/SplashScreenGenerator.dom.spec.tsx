/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { nth } from '@/test/nth'
import { generateAllAssets } from '@/utils'
import { buildZipBlob } from '@/utils/zip'

import { SplashScreenGenerator } from './SplashScreenGenerator'

vi.mock('@/utils/zip', () => ({ buildZipBlob: vi.fn(async () => new Blob(['zip'])) }))
vi.mock('@/utils/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/download')>()),
  downloadBlob: vi.fn(),
}))
vi.mock('@/utils/image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/image')>()),
  loadImageFromBlob: vi.fn(async () => ({ naturalHeight: 1024, naturalWidth: 1024 })),
}))
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  generateAllAssets: vi.fn(async () => ({
    icons: [
      { blob: new Blob(['i']), fileName: 'icon-192x192.png', maskable: false, size: 192 },
      { blob: new Blob(['m']), fileName: 'maskable-icon-192x192.png', maskable: true, size: 192 },
    ],
    manifestJson: '{"icons":[]}',
    metaTags: '<link rel="apple-touch-startup-image" />',
    splashScreens: [
      {
        blob: new Blob(['s']),
        device: { category: 'iphone', height: 2532, name: 'iPhone 13', scaleFactor: 3, width: 1170 },
        fileName: 'iphone-13-portrait.png',
        orientation: 'portrait',
      },
    ],
  })),
}))

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL

const settle = () => act(async () => {})

beforeEach(() => {
  // The asset tabs measure their indicator; jsdom has no layout.
  globalThis.ResizeObserver ??= class {
    disconnect() {}
    observe() {}
    unobserve() {}
  }
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
  vi.clearAllMocks()
})

describe('SplashScreenGenerator', () => {
  it('generates on Generate All Assets with the controls, and zips assets and config into their folders', async () => {
    render(<SplashScreenGenerator autoOpen />)
    const input = document.querySelector<HTMLInputElement>('input[name="image"]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File(['x'], 'logo.png', { type: 'image/png' })] } })
    })
    await settle()
    expect(generateAllAssets).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Generate All Assets' }))
    await settle()

    expect(generateAllAssets).toHaveBeenCalledWith(expect.anything(), '#ffffff', 0.5, expect.any(Function))
    const output = document.querySelector<HTMLElement>('[data-slot="tool-output"]') as HTMLElement
    expect(within(output).getByRole('tab', { name: 'iPhone splash' })).toBeInTheDocument()
    expect(within(output).getByRole('button', { name: 'Copy iOS meta tags to clipboard' })).toBeInTheDocument()

    fireEvent.click(within(output).getByRole('button', { name: 'Download ZIP' }))
    await settle()
    expect(Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])).toEqual([
      'ios-splash/iphone-13-portrait.png',
      'icons/icon-192x192.png',
      'icons/maskable/maskable-icon-192x192.png',
      'apple-splash-meta.html',
      'manifest-icons.json',
    ])
  })
})
