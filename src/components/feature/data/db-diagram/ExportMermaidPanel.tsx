import { useMemo } from 'react'

import { Button, CopyButton } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { ExportMermaidPanelProps } from '@/types'
import { publishHandoff } from '@/utils'

import { DiagramSidePanel } from './DiagramSidePanel'

export const ExportMermaidPanel = ({ onClose }: ExportMermaidPanelProps) => {
  const { document, editor } = useDiagram()

  // document is an intentional reactive dep: re-runs when the diagram changes (editor state is external)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatedMermaid = useMemo(() => editor.toMermaid(), [document, editor])

  const handleOpenInRenderer = () => {
    if (!generatedMermaid) return
    publishHandoff('mermaid-renderer', generatedMermaid)
    window.open('/tools/mermaid-renderer', '_blank')
  }

  return (
    <DiagramSidePanel
      footer={
        <div className="flex flex-wrap gap-2">
          <CopyButton label="Mermaid" value={generatedMermaid} />
          <div className="grow">
            <Button
              block
              data-testid="open-mermaid-renderer-btn"
              disabled={!generatedMermaid}
              onClick={handleOpenInRenderer}
              size="small"
              variant="primary"
            >
              Open in Mermaid Renderer
            </Button>
          </div>
        </div>
      }
      onClose={onClose}
      testId="mermaid-panel"
      title="Mermaid Export"
    >
      <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid="mermaid-output">
        {generatedMermaid || '%% Add tables and relationships to generate Mermaid ER syntax'}
      </pre>
    </DiagramSidePanel>
  )
}
