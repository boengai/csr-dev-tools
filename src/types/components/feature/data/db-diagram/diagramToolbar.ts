import type { RefObject } from 'react'

import type { SidePanel } from '@/types'

export type DiagramToolbarProps = {
  activePanel: SidePanel
  fileInputRef: RefObject<HTMLInputElement | null>
  fitView: (options?: { padding?: number }) => void
  handleExportJson: () => void
  handleImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRearrange: () => void
  onSelectPanel: (panel: SidePanel) => void
}
