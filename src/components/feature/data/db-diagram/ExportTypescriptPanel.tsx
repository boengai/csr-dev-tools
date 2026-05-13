import { useMemo } from 'react'

import { CopyButton } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { ExportTypescriptPanelProps } from '@/types/components/feature/data/db-diagram/exportTypescriptPanel'

import { CloseButton } from './CloseButton'

export const ExportTypescriptPanel = ({ onClose }: ExportTypescriptPanelProps) => {
  const { document, editor } = useDiagram()

  // document is an intentional reactive dep: re-runs when the diagram changes (editor state is external)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatedTypescript = useMemo(() => editor.toTypeScript(), [document, editor])

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="typescript-panel">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">TypeScript Export</span>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex-1 overflow-auto p-3">
        <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid="typescript-output">
          {generatedTypescript || '// Add tables to generate TypeScript types'}
        </pre>
      </div>

      <div className="flex gap-2 border-t border-gray-800 px-3 py-2">
        <CopyButton label="TypeScript" value={generatedTypescript} />
      </div>
    </div>
  )
}
