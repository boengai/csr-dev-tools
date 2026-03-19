import type { RefObject } from 'react'

import { Button, ChevronIcon, DropdownMenu, ListIcon, TextInput } from '@/components/common'
import type { SidePanel } from '@/types'

type DiagramToolbarProps = {
  activePanel: SidePanel
  diagramName: string
  editNameValue: string
  editingName: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  fitView: (options?: { padding?: number }) => void
  handleAddTable: () => void
  handleDiagramNameCommit: () => void
  handleExportJson: () => void
  handleImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRearrange: () => void
  nameInputRef: RefObject<HTMLInputElement | null>
  setEditNameValue: (value: string) => void
  setEditingName: (currentName: string) => void
  stopEditingName: () => void
  togglePanel: (panel: SidePanel) => void
}

export const DiagramToolbar = ({
  activePanel,
  diagramName,
  editNameValue,
  editingName,
  fileInputRef,
  fitView,
  handleAddTable,
  handleDiagramNameCommit,
  handleExportJson,
  handleImportJson,
  handleRearrange,
  nameInputRef,
  setEditNameValue,
  setEditingName,
  stopEditingName,
  togglePanel,
}: DiagramToolbarProps) => {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-3 py-2">
      <Button
        data-testid="diagrams-btn"
        icon={<ListIcon size={16} />}
        onClick={() => togglePanel('diagram-list')}
        size="small"
        variant={activePanel === 'diagram-list' ? 'primary' : 'default'}
      />

      {/* Diagram name */}
      {editingName ? (
        <TextInput
          block={false}
          name="diagram-name"
          onBlur={handleDiagramNameCommit}
          onChange={(value) => setEditNameValue(value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleDiagramNameCommit()
            if (e.key === 'Escape') stopEditingName()
          }}
          ref={nameInputRef}
          size="compact"
          type="text"
          value={editNameValue}
        />
      ) : (
        <button
          className="text-xs max-w-[200px] truncate font-bold text-white hover:text-primary"
          data-testid="diagram-name"
          onClick={() => setEditingName(diagramName)}
          type="button"
        >
          {diagramName}
        </button>
      )}

      <div className="mx-1 h-4 w-px bg-gray-700" />

      <Button data-testid="add-table-btn" onClick={handleAddTable} size="small" variant="primary">
        + Add Table
      </Button>
      <Button data-testid="rearrange-btn" onClick={handleRearrange} size="small" variant="default">
        Rearrange
      </Button>
      <Button data-testid="fit-view-btn" onClick={() => fitView({ padding: 0.2 })} size="small" variant="default">
        Fit View
      </Button>

      <div className="mx-1 h-4 w-px bg-gray-700" />

      {/* Import dropdown */}
      <DropdownMenu
        items={[
          {
            active: activePanel === 'import-sql',
            'data-testid': 'import-sql-btn',
            label: 'Import SQL',
            onSelect: () => togglePanel('import-sql'),
          },
          {
            active: activePanel === 'import-json-schema',
            'data-testid': 'import-json-schema-btn',
            label: 'Import Schema',
            onSelect: () => togglePanel('import-json-schema'),
          },
          {
            'data-testid': 'import-json-btn',
            label: 'Import JSON',
            onSelect: () => fileInputRef.current?.click(),
          },
        ]}
        trigger={
          <Button data-testid="import-dropdown-btn" size="small" variant="default">
            <span className="inline-flex items-center gap-1">
              Import <ChevronIcon size={12} />
            </span>
          </Button>
        }
      />
      <input
        accept=".json"
        className="hidden"
        data-testid="import-json-input"
        onChange={handleImportJson}
        ref={fileInputRef}
        type="file"
      />

      {/* Export dropdown */}
      <DropdownMenu
        items={[
          {
            active: activePanel === 'export-sql',
            'data-testid': 'export-sql-btn',
            label: 'Export SQL',
            onSelect: () => togglePanel('export-sql'),
          },
          {
            active: activePanel === 'export-mermaid',
            'data-testid': 'export-mermaid-btn',
            label: 'Export Mermaid',
            onSelect: () => togglePanel('export-mermaid'),
          },
          {
            active: activePanel === 'export-typescript',
            'data-testid': 'export-typescript-btn',
            label: 'Export TS',
            onSelect: () => togglePanel('export-typescript'),
          },
          {
            'data-testid': 'export-json-btn',
            label: 'Export JSON',
            onSelect: handleExportJson,
          },
        ]}
        trigger={
          <Button data-testid="export-dropdown-btn" size="small" variant="default">
            <span className="inline-flex items-center gap-1">
              Export <ChevronIcon size={12} />
            </span>
          </Button>
        }
      />

      <Button
        data-testid="dbml-btn"
        onClick={() => togglePanel('dbml')}
        size="small"
        variant={activePanel === 'dbml' ? 'primary' : 'default'}
      >
        DBML
      </Button>
    </div>
  )
}
