import { Button } from '@/components/common'
import type { ExportMermaidPanelProps } from '@/types'
import { publishHandoff } from '@/utils'

import { ExportSidePanel } from './ExportSidePanel'

export const ExportMermaidPanel = ({ onClose }: ExportMermaidPanelProps) => {
  const handleOpenInRenderer = (mermaid: string) => {
    if (!mermaid) return
    publishHandoff('mermaid-renderer', mermaid)
    window.open('/tools/mermaid-renderer', '_blank')
  }

  return (
    <ExportSidePanel
      action={(value) => (
        <Button
          block
          data-testid="open-mermaid-renderer-btn"
          disabled={!value}
          onClick={() => handleOpenInRenderer(value)}
          size="small"
          variant="primary"
        >
          Open in Mermaid Renderer
        </Button>
      )}
      copyLabel="Mermaid"
      derive={(ed) => ed.toMermaid()}
      emptyPlaceholder="%% Add tables and relationships to generate Mermaid ER syntax"
      onClose={onClose}
      testId="mermaid-panel"
      title="Mermaid Export"
    />
  )
}
