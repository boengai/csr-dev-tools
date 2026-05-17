import type { DiagramIndexEntry, DiagramSchema, DiagramStore } from '@/types'

const STORAGE_KEY = 'csr-dev-tools-db-diagrams'

function loadStore(): DiagramStore {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { diagrams: {}, index: [] }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.index)) return parsed
    return { diagrams: {}, index: [] }
  } catch {
    return { diagrams: {}, index: [] }
  }
}

function saveStore(store: DiagramStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function generateDiagramId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadDiagramIndex(): Array<DiagramIndexEntry> {
  return loadStore().index
}

export function saveDiagramIndex(index: Array<DiagramIndexEntry>): void {
  const store = loadStore()
  store.index = index
  saveStore(store)
}

export function loadDiagram(id: string): DiagramSchema | null {
  return loadStore().diagrams[id] ?? null
}

export function saveDiagram(id: string, schema: DiagramSchema): void {
  const store = loadStore()
  store.diagrams[id] = schema
  saveStore(store)
}

export function deleteDiagram(id: string): void {
  const store = loadStore()
  delete store.diagrams[id]
  store.index = store.index.filter((entry) => entry.id !== id)
  saveStore(store)
}
