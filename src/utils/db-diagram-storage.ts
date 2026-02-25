import type { DiagramIndexEntry, DiagramSchema } from '@/types'

const INDEX_KEY = 'csr-dev-tools-db-diagram-index'
const DIAGRAM_KEY_PREFIX = 'csr-dev-tools-db-diagram-'

export function generateDiagramId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadDiagramIndex(): Array<DiagramIndexEntry> {
  const raw = localStorage.getItem(INDEX_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDiagramIndex(index: Array<DiagramIndexEntry>): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index))
}

export function loadDiagram(id: string): DiagramSchema | null {
  const raw = localStorage.getItem(`${DIAGRAM_KEY_PREFIX}${id}`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveDiagram(id: string, schema: DiagramSchema): void {
  localStorage.setItem(`${DIAGRAM_KEY_PREFIX}${id}`, JSON.stringify(schema))
}

export function deleteDiagram(id: string): void {
  localStorage.removeItem(`${DIAGRAM_KEY_PREFIX}${id}`)
  const index = loadDiagramIndex().filter((entry) => entry.id !== id)
  saveDiagramIndex(index)
}
