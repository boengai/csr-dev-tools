import type { ConversionResult, TimezoneEntry } from '@/types/utils/timezone-converter'

export type TargetResult = {
  result: ConversionResult
  timezoneId: string
}

export type TimezoneConverterInput = {
  dateInput: string
  sourceTz: string
  targetTzIds: Array<string>
  timeInput: string
}

export type TimezoneConverterOutput = {
  error: string
  results: Array<TargetResult>
}

export type TimezoneSearchPickerProps = {
  /** Accessible name when no visible `<label htmlFor={id}>` names the input. */
  'aria-label'?: string
  favorites: Array<string>
  id?: string
  index: Array<TimezoneEntry>
  onSelect: (id: string) => void
  placeholder: string
}
