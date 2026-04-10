import type { RefObject } from 'react'

import type { DiagramIndexEntry } from '@/types'

export type DiagramListPanelProps = {
  activeDiagramId: string | null
  diagramIndex: Array<DiagramIndexEntry>
  onClose: () => void
  onDeleteDiagram: (id: string) => void
  onLoadDiagram: (id: string) => void
  onNewDiagram: () => void
  onRenameDiagram: (id: string, newName: string) => void
  onStartRenaming: (id: string, name: string) => void
  renameInputRef: RefObject<HTMLInputElement | null>
  renameValue: string
  renamingId: string | null
  setRenameValue: (value: string) => void
  setRenamingId: (id: string | null) => void
}
