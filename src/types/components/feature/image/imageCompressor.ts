export type OriginalInfo = {
  height: number
  name: string
  size: number
  width: number
}

export type CompressInput = { file: File | null; quality: number }
