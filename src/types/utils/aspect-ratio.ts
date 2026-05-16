export type AspectRatioSource = 'width' | 'height' | 'ratio'

export type AspectRatioLastEdited = 'width' | 'height'

export type AspectRatioLocked = 'width' | 'height' | null

export type AspectRatioInput = {
  source: AspectRatioSource
  width: string
  height: string
  ratio: string
  locked: AspectRatioLocked
  lastEdited: AspectRatioLastEdited
}

export type AspectRatioOutput = {
  width: string
  height: string
  ratio: string
}
