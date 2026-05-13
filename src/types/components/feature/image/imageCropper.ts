import type { Crop, PixelCrop } from 'react-image-crop'

import type { AspectRatioPreset } from '@/types'

export type ImageCropperState = {
  aspectPreset: AspectRatioPreset
  completedCrop: PixelCrop | null
  crop: Crop | undefined
  dialogOpen: boolean
  processing: boolean
  showProgress: boolean
  source: File | null
  tabValue: string
}

export type ImageCropperAction =
  | { type: 'SET_ASPECT_PRESET'; payload: AspectRatioPreset }
  | { type: 'SET_COMPLETED_CROP'; payload: PixelCrop | null }
  | { type: 'SET_CROP'; payload: Crop | undefined }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SHOW_PROGRESS'; payload: boolean }
  | { type: 'SET_SOURCE'; payload: File | null }
  | { type: 'SET_TAB_VALUE'; payload: string }
  | { type: 'INPUT_FILE'; payload: File }
  | { type: 'FINISH_PROCESSING' }
  | { type: 'RESET' }
