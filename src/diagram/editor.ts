import type { DiagramDocument } from '@/types'
import { cloneDocument, createInitialDocument } from './state'

type Listener = (document: DiagramDocument) => void

const isValidDocument = (value: unknown): value is DiagramDocument => {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.diagramName === 'string' &&
    typeof v.tables === 'object' &&
    typeof v.relations === 'object' &&
    Array.isArray(v.tableOrder) &&
    Array.isArray(v.relationOrder)
  )
}

export class DiagramEditor {
  private document: DiagramDocument
  private listeners: Set<Listener> = new Set()

  constructor(initial?: DiagramDocument) {
    this.document = initial ? cloneDocument(initial) : createInitialDocument()
  }

  getDocument(): DiagramDocument {
    return this.document
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  replaceDocument(next: DiagramDocument): void {
    if (!isValidDocument(next)) {
      this.document = createInitialDocument()
    } else {
      this.document = cloneDocument(next)
    }
    this.notify()
  }

  protected commit(next: DiagramDocument): void {
    this.document = next
    this.notify()
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.document)
  }
}
