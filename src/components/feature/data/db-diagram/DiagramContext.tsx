import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'

import { DiagramEditor } from '@/diagram/editor'
import type { DiagramContextValue } from '@/types'

const Ctx = createContext<DiagramContextValue | null>(null)
// Editor-only channel: the editor instance never changes, so consumers that only
// dispatch commands (memoized TableNode) don't re-render on every document change.
const EditorCtx = createContext<DiagramEditor | null>(null)

export const DiagramProvider = ({ editor, children }: { editor: DiagramEditor; children: ReactNode }) => {
  const document = useSyncExternalStore(
    (listener) => editor.subscribe(listener),
    () => editor.getDocument(),
    () => editor.getDocument(),
  )
  return (
    <EditorCtx.Provider value={editor}>
      <Ctx.Provider value={{ editor, document }}>{children}</Ctx.Provider>
    </EditorCtx.Provider>
  )
}

export const useDiagram = (): DiagramContextValue => {
  const value = useContext(Ctx)
  if (!value) throw new Error('useDiagram must be used inside <DiagramProvider>')
  return value
}

export const useDiagramEditor = (): DiagramEditor => {
  const editor = useContext(EditorCtx)
  if (!editor) throw new Error('useDiagramEditor must be used inside <DiagramProvider>')
  return editor
}
