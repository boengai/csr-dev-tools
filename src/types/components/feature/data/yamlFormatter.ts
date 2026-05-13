export type YamlFormatterState = {
  dialogOpen: boolean
  indent: number
  sortKeys: boolean
  source: string
}

export type YamlFormatterAction =
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_INDENT'; payload: number }
  | { type: 'SET_SORT_KEYS'; payload: boolean }
  | { type: 'SET_SOURCE'; payload: string }
  | { type: 'RESET' }

export type YamlInput = { indent: number; sortKeys: boolean; source: string }
