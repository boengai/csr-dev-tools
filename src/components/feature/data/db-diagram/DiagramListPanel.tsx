import { useEffect, useRef, useState } from 'react'

import { Button, TextInput } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { DiagramIndexEntry, DiagramListPanelProps } from '@/types'
import { formatRelativeTime, tv } from '@/utils'

import { CloseButton } from './CloseButton'

const diagramItemStyles = tv({
  base: 'flex items-center gap-2 border-b border-gray-800 px-3 py-2 transition-colors hover:bg-gray-900',
  variants: {
    active: {
      true: 'bg-gray-800',
      false: '',
    },
  },
})

export const DiagramListPanel = ({ onClose }: DiagramListPanelProps) => {
  const { document, editor } = useDiagram()
  const [diagramIndex, setDiagramIndex] = useState<Array<DiagramIndexEntry>>(() => editor.listDiagrams())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setDiagramIndex(editor.listDiagrams())
    return editor.subscribeToIndex(setDiagramIndex)
  }, [editor])

  const handleLoadDiagram = (id: string) => editor.loadDiagram(id)

  const handleNewDiagram = () => editor.newDiagram()

  const handleDeleteDiagram = (id: string) => {
    if (!window.confirm('Delete this diagram? This cannot be undone.')) return
    editor.deleteDiagram(id)
  }

  const handleStartRenaming = (id: string, name: string) => {
    setRenamingId(id)
    setRenameValue(name)
    requestAnimationFrame(() => renameInputRef.current?.focus())
  }

  const handleRenameDiagram = (id: string, newName: string) => {
    editor.renameDiagram(id, newName)
    setRenamingId(null)
  }

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="diagram-list-panel">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">Diagrams</span>
        <CloseButton onClick={onClose} />
      </div>

      <div className="border-b border-gray-800 px-3 py-2">
        <Button block data-testid="new-diagram-btn" onClick={handleNewDiagram} size="small" variant="primary">
          + New Diagram
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {diagramIndex.length === 0 ? (
          <div className="text-xs px-3 py-4 text-center text-gray-500">No saved diagrams</div>
        ) : (
          [...diagramIndex]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((entry) => (
              <div
                className={diagramItemStyles({ active: document.diagramId === entry.id })}
                data-testid={`diagram-item-${entry.id}`}
                key={entry.id}
              >
                <button
                  className="flex-1 cursor-pointer text-left"
                  onClick={() => handleLoadDiagram(entry.id)}
                  type="button"
                >
                  {renamingId === entry.id ? (
                    <TextInput
                      block={false}
                      onBlur={() => handleRenameDiagram(entry.id, renameValue)}
                      onChange={(value) => setRenameValue(value)}
                      onClick={(e) => e.stopPropagation()}
                      onEnter={() => handleRenameDiagram(entry.id, renameValue)}
                      onEscape={() => setRenamingId(null)}
                      name="diagram-name"
                      ref={renameInputRef}
                      size="compact"
                      type="text"
                      value={renameValue}
                    />
                  ) : (
                    <>
                      <div className="text-xs w-40 truncate font-medium text-white">{entry.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {formatRelativeTime(entry.updatedAt)} · {entry.tableCount} tables
                      </div>
                    </>
                  )}
                </button>

                <button
                  className="text-[10px] text-gray-500 hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartRenaming(entry.id, entry.name)
                  }}
                  title="Rename"
                  type="button"
                >
                  Rename
                </button>
                <button
                  className="text-[10px] text-gray-500 hover:text-error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteDiagram(entry.id)
                  }}
                  title="Delete"
                  type="button"
                >
                  Delete
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
