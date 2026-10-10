import type { DiagramIndexEntry, DiagramSchema, DiagramStorageFailure, DiagramStore } from '@/types'

const STORAGE_KEY = 'csr-dev-tools-db-diagrams'
// An unreadable store is copied here once before the first write replaces it,
// so a corrupted blob is never silently destroyed.
const BACKUP_KEY = 'csr-dev-tools-db-diagrams-corrupt-backup'

export class DiagramStorageError extends Error {
  readonly reason: DiagramStorageFailure

  constructor(reason: DiagramStorageFailure, cause?: unknown) {
    super(reason === 'full' ? 'Browser storage is full' : 'Browser storage is unavailable', { cause })
    this.name = 'DiagramStorageError'
    this.reason = reason
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isQuotaError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22)

type ReadResult = { kind: 'ok'; store: DiagramStore } | { kind: 'corrupt'; raw: string }

// Throws DiagramStorageError('unavailable') when storage itself can't be read.
const readStore = (): ReadResult => {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch (error) {
    throw new DiagramStorageError('unavailable', error)
  }
  if (raw === null) return { kind: 'ok', store: { diagrams: {}, index: [] } }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isRecord(parsed) && Array.isArray(parsed.index) && isRecord(parsed.diagrams)) {
      return { kind: 'ok', store: parsed as DiagramStore }
    }
  } catch {
    // fall through to corrupt
  }
  return { kind: 'corrupt', raw }
}

const setItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    throw new DiagramStorageError(isQuotaError(error) ? 'full' : 'unavailable', error)
  }
}

// Reads never throw: blocked or unreadable storage looks empty to the UI.
const readStoreOrEmpty = (): DiagramStore => {
  try {
    const result = readStore()
    if (result.kind === 'ok') return result.store
  } catch {
    // unavailable
  }
  return { diagrams: {}, index: [] }
}

// The single read-modify-write path for every mutation. If the read fails the
// write is aborted (throws) — an unreadable-because-blocked store must never be
// overwritten with a near-empty one.
const updateStore = <R>(mutate: (store: DiagramStore) => R): R => {
  const result = readStore()
  let store: DiagramStore
  if (result.kind === 'ok') {
    store = result.store
  } else {
    let hasBackup: boolean
    try {
      hasBackup = localStorage.getItem(BACKUP_KEY) !== null
    } catch (error) {
      throw new DiagramStorageError('unavailable', error)
    }
    if (!hasBackup) setItem(BACKUP_KEY, result.raw)
    store = { diagrams: {}, index: [] }
  }
  const out = mutate(store)
  setItem(STORAGE_KEY, JSON.stringify(store))
  return out
}

export function generateDiagramId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadDiagramIndex(): Array<DiagramIndexEntry> {
  return readStoreOrEmpty().index
}

export function saveDiagramIndex(index: Array<DiagramIndexEntry>): void {
  updateStore((store) => {
    store.index = index
  })
}

export function loadDiagram(id: string): DiagramSchema | null {
  const { diagrams } = readStoreOrEmpty()
  return Object.hasOwn(diagrams, id) ? diagrams[id] : null
}

export function saveDiagram(id: string, schema: DiagramSchema): void {
  updateStore((store) => {
    store.diagrams[id] = schema
  })
}

export function saveDiagramWithIndex(
  id: string,
  schema: DiagramSchema,
  entry: (previous: DiagramIndexEntry | undefined) => DiagramIndexEntry,
): Array<DiagramIndexEntry> {
  return updateStore((store) => {
    store.diagrams[id] = schema
    const at = store.index.findIndex((e) => e.id === id)
    const next = entry(at >= 0 ? store.index[at] : undefined)
    if (at >= 0) store.index[at] = next
    else store.index.push(next)
    return store.index
  })
}

export function deleteDiagram(id: string): void {
  updateStore((store) => {
    delete store.diagrams[id]
    store.index = store.index.filter((entry) => entry.id !== id)
  })
}
