import type { ColumnAlignment } from '@/utils'

export type State = {
  alignments: Array<ColumnAlignment>
  cols: number
  data: Array<Array<string>>
  dialogOpen: boolean
  rows: number
}

export type Action =
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_ROWS'; payload: number }
  | { type: 'SET_COLS'; payload: number }
  | { type: 'SET_DATA'; payload: Array<Array<string>> }
  | { type: 'SET_ALIGNMENTS'; payload: Array<ColumnAlignment> }
  | { type: 'UPDATE_CELL'; payload: { r: number; c: number; val: string } }
  | { type: 'CHANGE_ROWS'; payload: number }
  | { type: 'CHANGE_COLS'; payload: number }
  | { type: 'TOGGLE_ALIGN'; payload: number }
  | { type: 'RESET' }
