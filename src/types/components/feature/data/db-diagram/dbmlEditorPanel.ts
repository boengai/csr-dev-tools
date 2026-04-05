export type DbmlEditorPanelProps = {
  dbmlErrors: Array<{ line: number; message: string }>
  dbmlText: string
  onClose: () => void
  onDbmlChange: (text: string) => void
  onSyncFromDiagram: () => void
}
