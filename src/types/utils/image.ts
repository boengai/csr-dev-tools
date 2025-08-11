export type ConvertImageOptions = {
  backgroundColor?: string // used for jpeg background fill; defaults to white
  maxHeight?: number
  maxWidth?: number
  quality?: number // 0.1 for lossy formats (webp/jpeg). Defaults to 0.8
}
