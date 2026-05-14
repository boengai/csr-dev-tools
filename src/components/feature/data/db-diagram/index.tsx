import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'

import { Button } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { DiagramEditor } from '@/diagram/editor'
import { documentToSchema } from '@/diagram/operations/export'
import { useToast } from '@/hooks/state'
import type { DiagramInnerProps, DiagramSidePanelProps, SidePanel, ToolComponentProps } from '@/types'
import { gridLayoutPositions } from '@/utils/db-diagram'
import { downloadTextFile } from '@/utils/file'

import { DbmlEditorPanel } from './DbmlEditorPanel'
import { DiagramCanvas } from './DiagramCanvas'
import { DiagramProvider } from './DiagramContext'
import { DiagramListPanel } from './DiagramListPanel'
import { DiagramToolbar } from './DiagramToolbar'
import { ExportMermaidPanel } from './ExportMermaidPanel'
import { ExportSqlPanel } from './ExportSqlPanel'
import { ExportTypescriptPanel } from './ExportTypescriptPanel'
import { ImportJsonSchemaPanel } from './ImportJsonSchemaPanel'
import { ImportSqlPanel } from './ImportSqlPanel'

import '@xyflow/react/dist/style.css'

const toolEntry = TOOL_REGISTRY_MAP['db-diagram']

// ---------------------------------------------------------------------------
// Panel switcher
// ---------------------------------------------------------------------------
const Panel = ({ which, onClose }: DiagramSidePanelProps) => {
  switch (which) {
    case 'dbml':
      return <DbmlEditorPanel onClose={onClose} />
    case 'diagram-list':
      return <DiagramListPanel onClose={onClose} />
    case 'import-sql':
      return <ImportSqlPanel onClose={onClose} />
    case 'import-json-schema':
      return <ImportJsonSchemaPanel onClose={onClose} />
    case 'export-sql':
      return <ExportSqlPanel onClose={onClose} />
    case 'export-mermaid':
      return <ExportMermaidPanel onClose={onClose} />
    case 'export-typescript':
      return <ExportTypescriptPanel onClose={onClose} />
  }
}

// ---------------------------------------------------------------------------
// DiagramInner — must be a child of ReactFlowProvider to call useReactFlow()
// ---------------------------------------------------------------------------
const DiagramInner = ({
  editor,
  activePanel,
  onSelectPanel,
  fileInputRef,
  handleExportJson,
  handleImportJson,
  handleRearrange,
}: DiagramInnerProps) => {
  const { fitView } = useReactFlow()

  const handleClosePanel = useCallback(() => onSelectPanel(null), [onSelectPanel])

  return (
    <DiagramProvider editor={editor}>
      <div className="flex h-full flex-col">
        <DiagramToolbar
          activePanel={activePanel}
          fileInputRef={fileInputRef}
          fitView={fitView}
          handleExportJson={handleExportJson}
          handleImportJson={handleImportJson}
          handleRearrange={handleRearrange}
          onSelectPanel={onSelectPanel}
        />

        <div className="flex flex-1 overflow-hidden">
          <DiagramCanvas />

          {activePanel !== null && (
            <Panel which={activePanel} onClose={handleClosePanel} />
          )}
        </div>
      </div>
    </DiagramProvider>
  )
}

// ---------------------------------------------------------------------------
// DiagramWorkspace — owns editor + UI state. Persistence lives in the editor.
// ---------------------------------------------------------------------------
const DiagramWorkspace = () => {
  const editor = useMemo(() => new DiagramEditor(), [])
  const [activePanel, setActivePanel] = useState<SidePanel>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    editor.bootstrap()
    return () => {
      editor.flush()
      editor.dispose()
    }
  }, [editor])

  const handleExportJson = useCallback(() => {
    const doc = editor.getDocument()
    if (doc.tableOrder.length === 0) return
    const schema = documentToSchema(doc)
    const jsonStr = JSON.stringify(schema, null, 2)
    const safeName = doc.diagramName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    downloadTextFile(jsonStr, `${safeName}.json`, 'application/json')
  }, [editor])

  const handleImportJson = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string)
          const name = file.name.replace(/\.json$/i, '')
          const loaded = editor.loadFromExportedJson(parsed, name)
          if (!loaded) {
            toast({
              action: 'add',
              item: { label: 'Invalid diagram file. Expected a CSR Dev Tools diagram JSON.', type: 'error' },
            })
          }
        } catch {
          toast({
            action: 'add',
            item: { label: 'Invalid diagram file. Expected a CSR Dev Tools diagram JSON.', type: 'error' },
          })
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [editor, toast],
  )

  // -------------------------------------------------------------------------
  // Rearrange: grid-layout all tables, then persist positions
  // -------------------------------------------------------------------------
  const handleRearrange = useCallback(() => {
    const doc = editor.getDocument()
    const positions = gridLayoutPositions(doc.tableOrder.length)
    for (let i = 0; i < doc.tableOrder.length; i++) {
      editor.moveTable(doc.tableOrder[i], positions[i])
    }
  }, [editor])

  // -------------------------------------------------------------------------
  // Panel toggle: same toggle-or-open logic as the old togglePanel
  // -------------------------------------------------------------------------
  const handleSelectPanel = useCallback(
    (panel: SidePanel) => {
      setActivePanel((prev) => (prev === panel ? null : panel))
    },
    [],
  )

  return (
    <ReactFlowProvider>
      <DiagramInner
        activePanel={activePanel}
        editor={editor}
        fileInputRef={fileInputRef}
        handleExportJson={handleExportJson}
        handleImportJson={handleImportJson}
        handleRearrange={handleRearrange}
        onSelectPanel={handleSelectPanel}
      />
    </ReactFlowProvider>
  )
}

// ---------------------------------------------------------------------------
// DbDiagram — public export, owns the Dialog shell
// ---------------------------------------------------------------------------
export const DbDiagram = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div className="flex grow flex-col items-center justify-center gap-2">
        <Button block onClick={() => setDialogOpen(true)} variant="primary">
          Open DB Diagram
        </Button>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        size="screen"
        title="DB Diagram"
      >
        <DiagramWorkspace />
      </ToolDialogShell>
    </div>
  )
}
