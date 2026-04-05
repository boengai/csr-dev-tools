import type { MermaidFixSuggestion } from '@/utils'

export type State = {
  dialogOpen: boolean
  error: string | null
  exportingPng: boolean
  fixSuggestion: MermaidFixSuggestion | null
  referenceOpen: boolean
  svg: string
}

export type Action =
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EXPORTING_PNG'; payload: boolean }
  | { type: 'SET_FIX_SUGGESTION'; payload: MermaidFixSuggestion | null }
  | { type: 'SET_REFERENCE_OPEN'; payload: boolean }
  | { type: 'SET_SVG'; payload: string }
  | { type: 'RENDER_SUCCESS'; payload: string }
  | { type: 'RENDER_ERROR'; payload: { error: string; fixSuggestion: MermaidFixSuggestion | null } }
  | { type: 'RESET' }
