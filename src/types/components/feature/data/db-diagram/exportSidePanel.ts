import type { ReactNode } from 'react'

import type { DiagramEditor } from '@/diagram/editor'

export type ExportSidePanelProps = {
  title: string
  derive: (editor: DiagramEditor) => string
  extraDeps?: ReadonlyArray<unknown>
  copyLabel: string
  emptyPlaceholder: string
  onClose: () => void
  testId: string
  controls?: ReactNode
  action?: (value: string) => ReactNode
}
