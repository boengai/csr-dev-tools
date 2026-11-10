import type { TimezoneEntry } from '@/types/utils/timezone-converter'

/** `source` is the date and time, `YYYY-MM-DD HH:mm`, read in `sourceTz`. */
export type TimezoneConverterInput = {
  source: string
  sourceTz: string
  targetTzIds: Array<string>
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
