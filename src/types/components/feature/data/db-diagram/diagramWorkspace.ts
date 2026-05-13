import type { ChangeEvent, RefObject } from 'react'

import type { DiagramEditor } from '@/diagram/editor'
import type { SidePanel } from '@/types'

export type DiagramSidePanelProps = {
  onClose: () => void
  which: Exclude<SidePanel, null>
}

export type DiagramInnerProps = {
  activePanel: SidePanel
  editor: DiagramEditor
  fileInputRef: RefObject<HTMLInputElement | null>
  handleExportJson: () => void
  handleImportJson: (e: ChangeEvent<HTMLInputElement>) => void
  handleRearrange: () => void
  onSelectPanel: (panel: SidePanel) => void
}
