import type { ExportTypescriptPanelProps } from '@/types'

import { ExportSidePanel } from './ExportSidePanel'

export const ExportTypescriptPanel = ({ onClose }: ExportTypescriptPanelProps) => (
  <ExportSidePanel
    copyLabel="TypeScript"
    derive={(ed) => ed.toTypeScript()}
    emptyPlaceholder="// Add tables to generate TypeScript types"
    onClose={onClose}
    testId="typescript-panel"
    title="TypeScript Export"
  />
)
