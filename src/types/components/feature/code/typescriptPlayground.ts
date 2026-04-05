import type { OnMount, OnValidate } from '@monaco-editor/react'

export type EditorInstance = Parameters<OnMount>[0]

export type MarkerData = Parameters<OnValidate>[0][0]

export type DiagnosticError = {
  column: number
  line: number
  message: string
  severity: 'error' | 'warning'
}
