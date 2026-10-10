import type { SplashScreenDevice } from '@/constants'

export type SplashScreenResult = {
  blob: Blob
  device: SplashScreenDevice
  fileName: string
  orientation: SplashOrientation
}

export type PwaIconResult = {
  blob: Blob
  fileName: string
  maskable: boolean
  size: number
}

export type SplashScreenGeneratorOutput = {
  icons: Array<PwaIconResult>
  manifestJson: string
  metaTags: string
  splashScreens: Array<SplashScreenResult>
}

export type ManifestIconEntry = { purpose: string; sizes: string; src: string; type: string }

export type SplashOrientation = 'landscape' | 'portrait'
