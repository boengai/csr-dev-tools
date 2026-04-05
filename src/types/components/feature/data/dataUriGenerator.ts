import type { DataUriDecodeResult, DataUriEncodeResult } from '@/utils'

export type State = {
  decodeInput: string
  decodeOpen: boolean
  decodeResult: DataUriDecodeResult | null
  encodeOpen: boolean
  encodeResult: DataUriEncodeResult | null
}

export type Action =
  | { type: 'SET_DECODE_INPUT'; payload: string }
  | { type: 'SET_DECODE_OPEN'; payload: boolean }
  | { type: 'SET_DECODE_RESULT'; payload: DataUriDecodeResult | null }
  | { type: 'SET_ENCODE_OPEN'; payload: boolean }
  | { type: 'SET_ENCODE_RESULT'; payload: DataUriEncodeResult | null }
  | { type: 'RESET_ENCODE' }
  | { type: 'RESET_DECODE' }
