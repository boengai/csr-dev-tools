import { useCallback } from 'react'

import { Button, CodeInput, CopyButton } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import { useDebounceCallback } from '@/hooks'
import type { DbmlEditorPanelProps } from '@/types'

import { CloseButton } from './CloseButton'

export const DbmlEditorPanel = ({ onClose }: DbmlEditorPanelProps) => {
  const { document, editor } = useDiagram()

  const applyNow = useCallback(() => editor.applyDbmlNow(), [editor])
  const debouncedApply = useDebounceCallback(applyNow, 500)

  const handleChange = (text: string) => {
    editor.setDbmlText(text)
    debouncedApply()
  }

  const handleSyncFromDiagram = () => {
    editor.syncDbmlFromDiagram()
  }

  return (
    <div className="flex w-96 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="dbml-panel">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">DBML Editor</span>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-3">
        <CodeInput
          height="100%"
          name="dbml-editor"
          onChange={handleChange}
          placeholder={'// Define your schema in DBML\n\nTable users {\n  id serial [pk]\n  name varchar [not null]\n}'}
          size="compact"
          value={document.dbmlText}
        />

        {document.dbmlErrors.length > 0 && (
          <div className="mt-2 max-h-24 space-y-1 overflow-auto" data-testid="dbml-errors">
            {document.dbmlErrors.map((err) => (
              <p className="text-[10px] text-error" key={`${err.line}-${err.message}`}>
                Line {err.line}: {err.message}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-gray-800 px-3 py-2">
        <CopyButton label="DBML" value={document.dbmlText} />
        <div className="grow">
          <Button block data-testid="dbml-sync-btn" onClick={handleSyncFromDiagram} size="small" variant="primary">
            Sync from Diagram
          </Button>
        </div>
      </div>
    </div>
  )
}
