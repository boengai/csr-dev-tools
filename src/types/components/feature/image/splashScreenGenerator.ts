/** Splash Screen Generator's controls bag (the shell owns it and resets it on close). */
export type SplashControls = {
  backgroundColor: string
  /** Percent of the canvas the image fills, as the range input's string value. */
  imageScale: string
}

export type SplashSourcePreviewProps = SplashControls & {
  image: HTMLImageElement
  sourceUrl: string
}
