import type { ImageProcessingResult } from '@/types'

export type OriginalInfo = {
  height: number
  name: string
  size: number
  width: number
}

export type State = {
  compressed: ImageProcessingResult | null
  originalInfo: OriginalInfo | null
  processing: boolean
  quality: number
  showProgress: boolean
  source: File | null
}

export type Action =
  | { type: 'SET_COMPRESSED'; payload: ImageProcessingResult | null }
  | { type: 'SET_ORIGINAL_INFO'; payload: OriginalInfo | null }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_QUALITY'; payload: number }
  | { type: 'SET_SHOW_PROGRESS'; payload: boolean }
  | { type: 'SET_SOURCE'; payload: File | null }
  | { type: 'CLEAR_ON_REJECT' }
  | { type: 'START_COMPRESS'; payload: { source: File } }
  | { type: 'FINISH_COMPRESS' }
