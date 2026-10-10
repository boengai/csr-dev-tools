import type { ImageFormat } from '@/types'

export type DownloadTarget = { filename: string; blob: Blob } | { filename: string; dataUrl: string }

export type ImageConvertorPreview = { height: number; url: string; width: number }

export type ImageConvertorTab = 'DOWNLOAD' | 'IMPORT' | 'PROCESSING' | 'SELECT_FORMAT'

export type ImageConvertorState = {
  previews: Array<ImageConvertorPreview>
  processing: number
  sources: Array<File>
  tabValue: string
  target: { format: ImageFormat; quality: string }
}

export type ImageConvertorAction =
  | { type: 'SET_TAB_VALUE'; payload: string }
  | { type: 'SET_SOURCES'; payload: Array<File> }
  | { type: 'SET_TARGET'; payload: { format: ImageFormat; quality: string } }
  | { type: 'SET_PROCESSING'; payload: number }
  | { type: 'SET_PREVIEWS'; payload: Array<ImageConvertorPreview> }
  | { type: 'INCREMENT_PROCESSING'; payload: number }
  | { type: 'REMOVE_SOURCE'; payload: number }
  | { type: 'RESET' }
