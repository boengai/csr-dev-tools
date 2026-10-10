import { ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { DiagramEditor } from '@/diagram/editor'
import { gridLayoutPositions } from '@/diagram/layout'
import { documentToSchema } from '@/diagram/operations/export'
import { useDownload, useMediaQuery } from '@/hooks'
import { useToast } from '@/hooks/state'
import type { DiagramInnerProps, DiagramPanelSwitchProps, SidePanel, ToolComponentProps } from '@/types'

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
const Panel = ({ which, onClose }: DiagramPanelSwitchProps) => {
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

          {activePanel !== null && <Panel which={activePanel} onClose={handleClosePanel} />}
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
  const { showError } = useToast()
  const { downloadBlob } = useDownload()

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
    downloadBlob(new Blob([jsonStr], { type: 'application/json' }), `${safeName}.json`)
  }, [downloadBlob, editor])

  const handleImportJson = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return

      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        const name = file.name.replace(/\.json$/i, '')
        const loaded = editor.loadFromExportedJson(parsed, name)
        if (!loaded) {
          showError('Invalid diagram file. Expected a CSR Dev Tools diagram JSON.')
        }
      } catch {
        showError('Invalid diagram file. Expected a CSR Dev Tools diagram JSON.')
      }
    },
    [editor, showError],
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
  const handleSelectPanel = useCallback((panel: SidePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }, [])

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

const MobileBlocker = () => (
  <div className="flex grow flex-col items-center justify-center gap-3 p-8 text-center">
    <p className="text-body-sm text-gray-200">DB Diagram needs a larger screen.</p>
    <p className="text-body-xs text-gray-500">
      The canvas, toolbar, and side panels are designed for tablet-and-up viewports. Please open this tool on a tablet
      or desktop browser.
    </p>
  </div>
)

// ---------------------------------------------------------------------------
// DbDiagram — public export, owns the Dialog shell
// ---------------------------------------------------------------------------
export const DbDiagram = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  // Match Tailwind's `tablet:` breakpoint (48rem) so the JS gate aligns with the
  // CSS utility prefix used elsewhere in the codebase. `ssrDefault: true` keeps
  // the prerender output rendering the workspace (desktop assumption) — same as
  // the pre-extraction `useIsTabletOrLarger` did.
  const isTabletOrLarger = useMediaQuery('(min-width: 48rem)', true)

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div className="flex grow flex-col items-center justify-center gap-2">
        <Button block onClick={() => setDialogOpen(true)} variant="primary">
          Open DB Diagram
        </Button>
      </div>

      <ToolDialogShell
        onAfterClose={onAfterClose}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        size="screen"
        title="DB Diagram"
      >
        {isTabletOrLarger ? <DiagramWorkspace /> : <MobileBlocker />}
      </ToolDialogShell>
    </div>
  )
}
