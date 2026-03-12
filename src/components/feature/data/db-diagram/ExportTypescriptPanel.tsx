import { CopyButton } from '@/components/common'

import { CloseButton } from './CloseButton'

type ExportTypescriptPanelProps = {
  generatedTypescript: string
  onClose: () => void
}

export const ExportTypescriptPanel = ({ generatedTypescript, onClose }: ExportTypescriptPanelProps) => {
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
