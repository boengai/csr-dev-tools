export type CropRegion = {
  height: number
  width: number
  x: number
  y: number
}

export type AspectRatioPreset = '1:1' | '16:9' | '3:2' | '4:3' | 'free'

export type AspectRatioOption = {
  label: string
  ratio: number | undefined
  value: AspectRatioPreset
}
