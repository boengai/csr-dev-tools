import type { RefObject } from 'react'

import type { SidePanel } from '@/types'

export type DiagramToolbarProps = {
  activePanel: SidePanel
  diagramName: string
  editNameValue: string
  editingName: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  fitView: (options?: { padding?: number }) => void
  handleAddTable: () => void
  handleDiagramNameCommit: () => void
  handleExportJson: () => void
  handleImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRearrange: () => void
  nameInputRef: RefObject<HTMLInputElement | null>
  setEditNameValue: (value: string) => void
  setEditingName: (currentName: string) => void
  stopEditingName: () => void
  togglePanel: (panel: SidePanel) => void
}
