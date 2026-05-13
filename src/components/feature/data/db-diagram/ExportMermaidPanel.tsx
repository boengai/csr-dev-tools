import { useMemo } from 'react'

import { Button, CopyButton } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { ExportMermaidPanelProps } from '@/types'

import { CloseButton } from './CloseButton'

const MERMAID_PREFILL_KEY = 'csr-dev-tools-mermaid-renderer-prefill'

export const ExportMermaidPanel = ({ onClose }: ExportMermaidPanelProps) => {
  const { document, editor } = useDiagram()

  // document is an intentional reactive dep: re-runs when the diagram changes (editor state is external)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatedMermaid = useMemo(() => editor.toMermaid(), [document, editor])

  const handleOpenInRenderer = () => {
    if (!generatedMermaid) return
    localStorage.setItem(MERMAID_PREFILL_KEY, generatedMermaid)
    window.open('/tools/mermaid-renderer', '_blank')
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="mermaid-panel">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">Mermaid Export</span>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex-1 overflow-auto p-3">
        <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid="mermaid-output">
          {generatedMermaid || '%% Add tables and relationships to generate Mermaid ER syntax'}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-800 px-3 py-2">
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
    </div>
  )
}
