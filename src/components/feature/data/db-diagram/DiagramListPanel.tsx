import { useEffect, useRef, useState } from 'react'

import { Button, TextInput } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { DiagramIndexEntry } from '@/types'
import type { DiagramListPanelProps } from '@/types/components/feature/data/db-diagram/diagramListPanel'
import { schemaToDocument } from '@/diagram/operations/lifecycle'
import { createInitialDocument } from '@/diagram/state'
import { deleteDiagram, formatRelativeTime, loadDiagram, loadDiagramIndex, saveDiagramIndex, tv } from '@/utils'

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
  const [diagramIndex, setDiagramIndex] = useState<Array<DiagramIndexEntry>>(() => loadDiagramIndex())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement | null>(null)

  // Refresh the index whenever the panel mounts or document changes (saves may update it)
  useEffect(() => {
    setDiagramIndex(loadDiagramIndex())
  }, [document.diagramId, document.diagramName])

  const handleLoadDiagram = (id: string) => {
    const schema = loadDiagram(id)
    if (!schema) return
    const doc = schemaToDocument(schema, createInitialDocument())
    // preserve the diagramId and name from the index entry
    const entry = diagramIndex.find((e) => e.id === id)
    editor.replaceDocument({ ...doc, diagramId: id, diagramName: entry?.name ?? doc.diagramName })
  }

  const handleNewDiagram = () => {
    const idx = loadDiagramIndex()
    let num = 1
    const baseName = 'Untitled Diagram'
    const existingNames = new Set(idx.map((e) => e.name))
    let name = baseName
    while (existingNames.has(name)) {
      num++
      name = `${baseName} ${num}`
    }
    editor.replaceDocument({ ...createInitialDocument(), diagramName: name })
  }

  const handleDeleteDiagram = (id: string) => {
    if (!window.confirm('Delete this diagram? This cannot be undone.')) return
    deleteDiagram(id)
    setDiagramIndex(loadDiagramIndex())
    if (document.diagramId === id) {
      editor.replaceDocument(createInitialDocument())
    }
  }

  const handleStartRenaming = (id: string, name: string) => {
    setRenamingId(id)
    setRenameValue(name)
    requestAnimationFrame(() => renameInputRef.current?.focus())
  }

  const handleRenameDiagram = (id: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) {
      setRenamingId(null)
      return
    }
    const idx = loadDiagramIndex()
    const entry = idx.find((e) => e.id === id)
    if (entry) {
      entry.name = trimmed
      saveDiagramIndex(idx)
      setDiagramIndex([...idx])
      // If this is the active diagram, update its name in the editor too
      if (document.diagramId === id) {
        editor.setDiagramName(trimmed)
      }
    }
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameDiagram(entry.id, renameValue)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
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
