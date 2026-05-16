import { useCallback } from 'react'

import { Button, CodeInput, CopyButton } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import { useDebounceCallback } from '@/hooks'
import type { DbmlEditorPanelProps } from '@/types'

import { DiagramSidePanel } from './DiagramSidePanel'

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
    <DiagramSidePanel
      footer={
        <div className="flex gap-2">
          <CopyButton label="DBML" value={document.dbmlText} />
          <div className="grow">
            <Button block data-testid="dbml-sync-btn" onClick={handleSyncFromDiagram} size="small" variant="primary">
              Sync from Diagram
            </Button>
          </div>
        </div>
      }
      onClose={onClose}
      size="wide"
      testId="dbml-panel"
      title="DBML Editor"
    >
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
    </DiagramSidePanel>
  )
}
