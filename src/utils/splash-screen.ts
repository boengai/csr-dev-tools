import type { SplashScreenDevice } from '@/constants'
import { IOS_DEVICES, MASKABLE_ICON_SIZES, MASKABLE_SAFE_ZONE_RATIO, PWA_ICON_SIZES } from '@/constants'
import type { SplashScreenResult, PwaIconResult, SplashScreenGeneratorOutput } from '@/types/utils/splash-screen'
import { canvasToBlob } from './canvas'

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[""]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const generateSplashScreen = async (
  image: HTMLImageElement,
  device: SplashScreenDevice,
  orientation: 'landscape' | 'portrait',
  bgColor: string,
  imageScale = 0.5,
): Promise<SplashScreenResult> => {
  const width = orientation === 'portrait' ? device.width : device.height
  const height = orientation === 'portrait' ? device.height : device.width

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)

  const scale = Math.min(width / image.width, height / image.height) * imageScale
  const scaledW = image.width * scale
  const scaledH = image.height * scale
  const x = (width - scaledW) / 2
  const y = (height - scaledH) / 2
  ctx.drawImage(image, x, y, scaledW, scaledH)

  const dataUrl = canvas.toDataURL('image/png')
  const blob = await canvasToBlob(canvas)
  const slug = slugify(device.name)
  const fileName = `${slug}-${orientation}.png`

  return { blob, dataUrl, device, fileName, orientation }
}

const generatePwaIcon = async (
  image: HTMLImageElement,
  size: number,
  maskable: boolean,
  bgColor: string,
  imageScale = 1,
): Promise<PwaIconResult> => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, size, size)

  if (maskable) {
    const safeZoneSize = size * MASKABLE_SAFE_ZONE_RATIO
    const scale = Math.min(safeZoneSize / image.width, safeZoneSize / image.height) * imageScale
    const scaledW = image.width * scale
    const scaledH = image.height * scale
    const x = (size - scaledW) / 2
    const y = (size - scaledH) / 2
    ctx.drawImage(image, x, y, scaledW, scaledH)
  } else {
    const scale = Math.min(size / image.width, size / image.height) * imageScale
    const scaledW = image.width * scale
    const scaledH = image.height * scale
    const x = (size - scaledW) / 2
    const y = (size - scaledH) / 2
    ctx.drawImage(image, x, y, scaledW, scaledH)
  }

  const dataUrl = canvas.toDataURL('image/png')
  const blob = await canvasToBlob(canvas)
  const fileName = maskable ? `maskable-icon-${size}x${size}.png` : `icon-${size}x${size}.png`

  return { blob, dataUrl, fileName, maskable, size }
}

export const generateAllAssets = async (
  image: HTMLImageElement,
  bgColor: string,
  imageScale = 0.5,
  onProgress?: (current: number, total: number) => void,
): Promise<SplashScreenGeneratorOutput> => {
  const orientations: Array<'landscape' | 'portrait'> = ['portrait', 'landscape']
  const totalSplash = IOS_DEVICES.length * orientations.length
  const totalIcons = PWA_ICON_SIZES.length + MASKABLE_ICON_SIZES.length
  const total = totalSplash + totalIcons
  let current = 0

  const splashScreens: Array<SplashScreenResult> = []
  for (const device of IOS_DEVICES) {
    for (const orientation of orientations) {
      const result = await generateSplashScreen(image, device, orientation, bgColor, imageScale)
      splashScreens.push(result)
      current++
      onProgress?.(current, total)
    }
  }

  const icons: Array<PwaIconResult> = []
  for (const size of PWA_ICON_SIZES) {
    const result = await generatePwaIcon(image, size, false, bgColor, imageScale)
    icons.push(result)
    current++
    onProgress?.(current, total)
  }

  for (const size of MASKABLE_ICON_SIZES) {
    const result = await generatePwaIcon(image, size, true, bgColor, imageScale)
    icons.push(result)
    current++
    onProgress?.(current, total)
  }

  const metaTags = generateSplashMetaTags(IOS_DEVICES)
  const manifestJson = generateManifestIcons()

  return { icons, manifestJson, metaTags, splashScreens }
}

export const generateSplashMetaTags = (devices: Array<SplashScreenDevice>): string => {
  const tags: Array<string> = []

  for (const device of devices) {
    const slug = slugify(device.name)
    const logicalWidth = Math.round(device.width / device.scaleFactor)
    const logicalHeight = Math.round(device.height / device.scaleFactor)

    tags.push(
      `<link rel="apple-touch-startup-image"
  href="/ios-splash/${slug}-portrait.png"
  media="(device-width: ${logicalWidth}px) and (device-height: ${logicalHeight}px) and (-webkit-device-pixel-ratio: ${device.scaleFactor}) and (orientation: portrait)">`,
    )

    tags.push(
      `<link rel="apple-touch-startup-image"
  href="/ios-splash/${slug}-landscape.png"
  media="(device-width: ${logicalWidth}px) and (device-height: ${logicalHeight}px) and (-webkit-device-pixel-ratio: ${device.scaleFactor}) and (orientation: landscape)">`,
    )
  }

  return tags.join('\n')
}

export const generateManifestIcons = (): string => {
  const icons: Array<{ purpose: string; sizes: string; src: string; type: string }> = []

  for (const size of PWA_ICON_SIZES) {
    icons.push({
      purpose: 'any',
      sizes: `${size}x${size}`,
      src: `/icons/icon-${size}x${size}.png`,
      type: 'image/png',
    })
  }

  for (const size of MASKABLE_ICON_SIZES) {
    icons.push({
      purpose: 'maskable',
      sizes: `${size}x${size}`,
      src: `/icons/maskable/maskable-icon-${size}x${size}.png`,
      type: 'image/png',
    })
  }

  return JSON.stringify(icons, null, 2)
}

export const downloadSplashScreenZip = async (output: SplashScreenGeneratorOutput): Promise<void> => {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  for (const splash of output.splashScreens) {
    zip.file(`ios-splash/${splash.fileName}`, splash.blob)
  }

  for (const icon of output.icons) {
    if (icon.maskable) {
      zip.file(`icons/maskable/${icon.fileName}`, icon.blob)
    } else {
      zip.file(`icons/${icon.fileName}`, icon.blob)
    }
  }

  zip.file('apple-splash-meta.html', output.metaTags)
  zip.file('manifest-icons.json', output.manifestJson)

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = 'splash-screen-assets.zip'
  a.click()
  URL.revokeObjectURL(url)
}

export type { SplashScreenResult, PwaIconResult, SplashScreenGeneratorOutput } from '@/types/utils/splash-screen'
