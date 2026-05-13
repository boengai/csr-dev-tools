import type { DataUriDecodeResult, DataUriEncodeResult } from '@/utils'

export type DataUriState = {
  decodeInput: string
  decodeOpen: boolean
  decodeResult: DataUriDecodeResult | null
  encodeOpen: boolean
  encodeResult: DataUriEncodeResult | null
}

export type DataUriAction =
  | { type: 'SET_DECODE_INPUT'; payload: string }
  | { type: 'SET_DECODE_OPEN'; payload: boolean }
  | { type: 'SET_DECODE_RESULT'; payload: DataUriDecodeResult | null }
  | { type: 'SET_ENCODE_OPEN'; payload: boolean }
  | { type: 'SET_ENCODE_RESULT'; payload: DataUriEncodeResult | null }
  | { type: 'RESET_ENCODE' }
  | { type: 'RESET_DECODE' }
