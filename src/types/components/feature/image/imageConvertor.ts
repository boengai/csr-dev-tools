import type { ImageFormat } from '@/types'

export type State = {
  previews: Array<{ height: number; url: string; width: number }>
  processing: number
  sources: Array<File>
  tabValue: string
  target: { format: ImageFormat; quality: string }
}

export type Action =
  | { type: 'SET_TAB_VALUE'; payload: string }
  | { type: 'SET_SOURCES'; payload: Array<File> }
  | { type: 'SET_TARGET'; payload: { format: ImageFormat; quality: string } }
  | { type: 'SET_PROCESSING'; payload: number }
  | { type: 'SET_PREVIEWS'; payload: Array<{ height: number; url: string; width: number }> }
  | { type: 'INCREMENT_PROCESSING'; payload: number }
  | { type: 'REMOVE_SOURCE'; payload: number }
  | { type: 'RESET' }
