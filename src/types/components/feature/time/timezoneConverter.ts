import type { ConversionResult } from '@/utils'

export type TargetResult = {
  result: ConversionResult
  timezoneId: string
}

export type ConverterState = {
  dateInput: string
  error: string
  favorites: Array<string>
  results: Array<TargetResult>
  showAddPicker: boolean
  sourceTz: string
  targetTzIds: Array<string>
  timeInput: string
}

export type ConverterAction =
  | { type: 'SET_SOURCE_TZ'; payload: string }
  | { type: 'SET_DATE_INPUT'; payload: string }
  | { type: 'SET_TIME_INPUT'; payload: string }
  | { type: 'SET_DATE_AND_TIME'; payload: { dateInput: string; timeInput: string } }
  | { type: 'SET_TARGET_TZ_IDS'; payload: Array<string> }
  | { type: 'ADD_TARGET_TZ'; payload: string }
  | { type: 'REMOVE_TARGET_TZ'; payload: string }
  | { type: 'SET_FAVORITES'; payload: Array<string> }
  | { type: 'SET_RESULTS'; payload: Array<TargetResult> }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SHOW_ADD_PICKER'; payload: boolean }
  | { type: 'SET_CONVERSION_RESULT'; payload: { error: string; results: Array<TargetResult> } }
