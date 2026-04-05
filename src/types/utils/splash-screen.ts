import type { SplashScreenDevice } from '@/constants'

export type SplashScreenResult = {
  blob: Blob
  dataUrl: string
  device: SplashScreenDevice
  fileName: string
  orientation: 'landscape' | 'portrait'
}

export type PwaIconResult = {
  blob: Blob
  dataUrl: string
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
