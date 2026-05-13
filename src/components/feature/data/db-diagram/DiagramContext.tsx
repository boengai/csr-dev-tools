import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import type { DiagramDocument } from '@/types'
import { DiagramEditor } from '@/diagram/editor'

type ContextValue = {
  editor: DiagramEditor
  document: DiagramDocument
}

const Ctx = createContext<ContextValue | null>(null)

export const DiagramProvider = ({ editor, children }: { editor: DiagramEditor; children: ReactNode }) => {
  const document = useSyncExternalStore(
    (listener) => editor.subscribe(listener),
    () => editor.getDocument(),
    () => editor.getDocument(),
  )
  return <Ctx.Provider value={{ editor, document }}>{children}</Ctx.Provider>
}

export const useDiagram = (): ContextValue => {
  const value = useContext(Ctx)
  if (!value) throw new Error('useDiagram must be used inside <DiagramProvider>')
  return value
}
