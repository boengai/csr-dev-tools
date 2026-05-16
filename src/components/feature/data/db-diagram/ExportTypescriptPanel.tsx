import { useMemo } from 'react'

import { CopyButton } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { ExportTypescriptPanelProps } from '@/types'

import { DiagramSidePanel } from './DiagramSidePanel'

export const ExportTypescriptPanel = ({ onClose }: ExportTypescriptPanelProps) => {
  const { document, editor } = useDiagram()

  // document is an intentional reactive dep: re-runs when the diagram changes (editor state is external)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatedTypescript = useMemo(() => editor.toTypeScript(), [document, editor])

  return (
    <DiagramSidePanel
      footer={
        <div className="flex gap-2">
          <CopyButton label="TypeScript" value={generatedTypescript} />
        </div>
      }
      onClose={onClose}
      testId="typescript-panel"
      title="TypeScript Export"
    >
      <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid="typescript-output">
        {generatedTypescript || '// Add tables to generate TypeScript types'}
      </pre>
    </DiagramSidePanel>
  )
}
