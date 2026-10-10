import {
  deleteDiagram,
  generateDiagramId,
  loadDiagram,
  loadDiagramIndex,
  saveDiagram,
  saveDiagramIndex,
  saveDiagramWithIndex,
} from '@/diagram/codecs/storage'
import type { DiagramIndexEntry, DiagramSchema, DiagramStorage } from '@/types'

export const localStorageDiagramStorage: DiagramStorage = {
  loadIndex: loadDiagramIndex,
  saveIndex: saveDiagramIndex,
  loadDiagram,
  saveDiagram,
  saveDiagramWithIndex,
  deleteDiagram,
  generateId: generateDiagramId,
}

export const createInMemoryDiagramStorage = (
  options: { idGenerator?: () => string } = {},
): DiagramStorage & { saves: number; deletes: number; reset(): void } => {
  let diagrams: Record<string, DiagramSchema> = {}
  let index: Array<DiagramIndexEntry> = []
  let saves = 0
  let deletes = 0
  let seq = 0
  const idGenerator = options.idGenerator ?? (() => `id-${++seq}`)

  return {
    loadIndex: () => [...index],
    saveIndex: (next) => {
      index = [...next]
    },
    loadDiagram: (id) => (diagrams[id] ? structuredClone(diagrams[id]) : null),
    saveDiagram: (id, schema) => {
      diagrams[id] = structuredClone(schema)
      saves++
    },
    saveDiagramWithIndex: (id, schema, entry) => {
      diagrams[id] = structuredClone(schema)
      const at = index.findIndex((e) => e.id === id)
      const next = entry(at >= 0 ? index[at] : undefined)
      index = at >= 0 ? index.map((e, i) => (i === at ? next : e)) : [...index, next]
      saves++
      return [...index]
    },
    deleteDiagram: (id) => {
      delete diagrams[id]
      index = index.filter((entry) => entry.id !== id)
      deletes++
    },
    generateId: () => idGenerator(),
    get saves() {
      return saves
    },
    get deletes() {
      return deletes
    },
    reset() {
      diagrams = {}
      index = []
      saves = 0
      deletes = 0
      seq = 0
    },
  }
}
