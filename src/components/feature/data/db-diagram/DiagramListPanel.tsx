import type { RefObject } from 'react'

import type { DiagramIndexEntry } from '@/types'

import { Button, TextInput } from '@/components/common'
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

type DiagramListPanelProps = {
  activeDiagramId: string | null
  diagramIndex: Array<DiagramIndexEntry>
  onClose: () => void
  onDeleteDiagram: (id: string) => void
  onLoadDiagram: (id: string) => void
  onNewDiagram: () => void
  onRenameDiagram: (id: string, newName: string) => void
  onStartRenaming: (id: string, name: string) => void
  renameInputRef: RefObject<HTMLInputElement | null>
  renameValue: string
  renamingId: string | null
  setRenameValue: (value: string) => void
  setRenamingId: (id: string | null) => void
}

export const DiagramListPanel = ({
  activeDiagramId,
  diagramIndex,
  onClose,
  onDeleteDiagram,
  onLoadDiagram,
  onNewDiagram,
  onRenameDiagram,
  onStartRenaming,
  renameInputRef,
  renameValue,
  renamingId,
  setRenameValue,
  setRenamingId,
}: DiagramListPanelProps) => {
  return (
    <div
      className="flex w-72 shrink-0 flex-col border-l border-gray-800 bg-gray-950"
      data-testid="diagram-list-panel"
    >
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">Diagrams</span>
        <CloseButton onClick={onClose} />
      </div>

      <div className="border-b border-gray-800 px-3 py-2">
        <Button block data-testid="new-diagram-btn" onClick={onNewDiagram} size="small" variant="primary">
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
                className={diagramItemStyles({ active: activeDiagramId === entry.id })}
                data-testid={`diagram-item-${entry.id}`}
                key={entry.id}
              >
                <button
                  className="flex-1 cursor-pointer text-left"
                  onClick={() => onLoadDiagram(entry.id)}
                  type="button"
                >
                  {renamingId === entry.id ? (
                    <TextInput
                      block={false}
                      onBlur={() => onRenameDiagram(entry.id, renameValue)}
                      onChange={(value) => setRenameValue(value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onRenameDiagram(entry.id, renameValue)
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
                    onStartRenaming(entry.id, entry.name)
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
                    onDeleteDiagram(entry.id)
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
