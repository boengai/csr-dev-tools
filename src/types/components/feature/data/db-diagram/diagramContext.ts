import type { DiagramEditor } from '@/diagram/editor'
import type { DiagramDocument } from '@/types'

export type DiagramContextValue = {
  document: DiagramDocument
  editor: DiagramEditor
}
