import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DiagramIndexEntry, DiagramSchema, DiagramStore } from '@/types'

import {
  deleteDiagram,
  DiagramStorageError,
  generateDiagramId,
  loadDiagram,
  loadDiagramIndex,
  saveDiagram,
  saveDiagramIndex,
  saveDiagramWithIndex,
} from './storage'

const STORAGE_KEY = 'csr-dev-tools-db-diagrams'
const BACKUP_KEY = 'csr-dev-tools-db-diagrams-corrupt-backup'

const mockStorage = new Map<string, string>()

const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  removeItem: vi.fn((key: string) => mockStorage.delete(key)),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
}

const makeSampleSchema = (): DiagramSchema => ({
  relationships: [],
  tables: [
    {
      columns: [
        {
          constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
          id: 'c1',
          name: 'id',
          type: 'SERIAL',
        },
      ],
      id: 't1',
      name: 'users',
      position: { x: 0, y: 0 },
    },
  ],
})

const makeSampleIndex = (): Array<DiagramIndexEntry> => [
  {
    createdAt: '2026-02-25T00:00:00.000Z',
    id: 'diagram-1',
    name: 'My Diagram',
    tableCount: 2,
    updatedAt: '2026-02-25T01:00:00.000Z',
  },
]

const setStore = (store: DiagramStore) => {
  mockStorage.set(STORAGE_KEY, JSON.stringify(store))
}

describe('db-diagram-storage', () => {
  beforeEach(() => {
    mockStorage.clear()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateDiagramId', () => {
    it('should return unique IDs', () => {
      const id1 = generateDiagramId()
      const id2 = generateDiagramId()
      expect(id1).not.toBe(id2)
    })

    it('should return a non-empty string', () => {
      expect(generateDiagramId().length).toBeGreaterThan(0)
    })
  })

  describe('loadDiagramIndex', () => {
    it('should return empty array when no store exists', () => {
      expect(loadDiagramIndex()).toEqual([])
    })

    it('should return parsed index from store', () => {
      const index = makeSampleIndex()
      setStore({ diagrams: {}, index })
      expect(loadDiagramIndex()).toEqual(index)
    })

    it('should return empty array on invalid JSON', () => {
      mockStorage.set(STORAGE_KEY, 'invalid-json')
      expect(loadDiagramIndex()).toEqual([])
    })
  })

  describe('saveDiagramIndex', () => {
    it('should save index within the store', () => {
      const schema = makeSampleSchema()
      setStore({ diagrams: { 'diagram-1': schema }, index: [] })

      const index = makeSampleIndex()
      saveDiagramIndex(index)

      const stored: DiagramStore = JSON.parse(mockStorage.get(STORAGE_KEY)!)
      expect(stored.index).toEqual(index)
      // diagrams should be preserved
      expect(stored.diagrams['diagram-1']).toEqual(schema)
    })
  })

  describe('loadDiagram', () => {
    it('should return null when diagram does not exist', () => {
      expect(loadDiagram('nonexistent')).toBeNull()
    })

    it('should return parsed diagram from store', () => {
      const schema = makeSampleSchema()
      setStore({ diagrams: { 'diagram-1': schema }, index: [] })
      expect(loadDiagram('diagram-1')).toEqual(schema)
    })
  })

  describe('saveDiagram', () => {
    it('should save diagram within the store', () => {
      const schema = makeSampleSchema()
      saveDiagram('diagram-1', schema)

      const stored: DiagramStore = JSON.parse(mockStorage.get(STORAGE_KEY)!)
      expect(stored.diagrams['diagram-1']).toEqual(schema)
    })

    it('should preserve existing diagrams when saving a new one', () => {
      const schema1 = makeSampleSchema()
      const schema2 = makeSampleSchema()
      setStore({ diagrams: { 'diagram-1': schema1 }, index: [] })

      saveDiagram('diagram-2', schema2)

      const stored: DiagramStore = JSON.parse(mockStorage.get(STORAGE_KEY)!)
      expect(stored.diagrams['diagram-1']).toEqual(schema1)
      expect(stored.diagrams['diagram-2']).toEqual(schema2)
    })
  })

  describe('deleteDiagram', () => {
    it('should remove diagram data and update index', () => {
      const index = makeSampleIndex()
      setStore({ diagrams: { 'diagram-1': makeSampleSchema() }, index })

      deleteDiagram('diagram-1')

      const stored: DiagramStore = JSON.parse(mockStorage.get(STORAGE_KEY)!)
      expect(stored.diagrams['diagram-1']).toBeUndefined()
      expect(stored.index).toEqual([])
    })

    it('should handle deletion when diagram is not in store', () => {
      setStore({ diagrams: {}, index: [] })
      deleteDiagram('nonexistent')

      const stored: DiagramStore = JSON.parse(mockStorage.get(STORAGE_KEY)!)
      expect(stored.diagrams).toEqual({})
      expect(stored.index).toEqual([])
    })
  })

  describe('saveDiagramWithIndex', () => {
    const entryFor =
      (now: string) =>
      (previous: DiagramIndexEntry | undefined): DiagramIndexEntry => ({
        createdAt: previous?.createdAt ?? now,
        id: 'diagram-1',
        name: 'My Diagram',
        tableCount: 1,
        updatedAt: now,
      })

    it('stores the schema and upserts the index entry in one read and one write', () => {
      setStore({ diagrams: {}, index: [] })
      localStorageMock.getItem.mockClear()
      localStorageMock.setItem.mockClear()

      const index = saveDiagramWithIndex('diagram-1', makeSampleSchema(), entryFor('2026-01-01T00:00:00.000Z'))

      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
      const stored: DiagramStore = JSON.parse(mockStorage.get(STORAGE_KEY)!)
      expect(stored.diagrams['diagram-1']).toEqual(makeSampleSchema())
      expect(stored.index).toEqual(index)
      expect(index).toEqual([entryFor('2026-01-01T00:00:00.000Z')(undefined)])
    })

    it('passes the previous entry so createdAt is preserved', () => {
      setStore({ diagrams: {}, index: [entryFor('2026-01-01T00:00:00.000Z')(undefined)] })
      const index = saveDiagramWithIndex('diagram-1', makeSampleSchema(), entryFor('2026-02-02T00:00:00.000Z'))
      expect(index).toHaveLength(1)
      expect(index[0].createdAt).toBe('2026-01-01T00:00:00.000Z')
      expect(index[0].updatedAt).toBe('2026-02-02T00:00:00.000Z')
    })

    it('throws a "full" DiagramStorageError and leaves the stored data untouched on quota errors', () => {
      setStore({ diagrams: {}, index: makeSampleIndex() })
      const before = mockStorage.get(STORAGE_KEY)
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new DOMException('quota', 'QuotaExceededError')
      })

      let error: unknown
      try {
        saveDiagramWithIndex('diagram-2', makeSampleSchema(), entryFor('2026-01-01T00:00:00.000Z'))
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(DiagramStorageError)
      expect((error as DiagramStorageError).reason).toBe('full')
      expect(mockStorage.get(STORAGE_KEY)).toBe(before)
    })
  })

  describe('blocked storage', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError')
      })
    })

    afterEach(() => {
      localStorageMock.getItem.mockImplementation((key: string) => mockStorage.get(key) ?? null)
    })

    it('reads fall back to empty instead of throwing', () => {
      expect(loadDiagramIndex()).toEqual([])
      expect(loadDiagram('diagram-1')).toBeNull()
    })

    it('writes throw "unavailable" without writing (never clobber unread data)', () => {
      localStorageMock.setItem.mockClear()
      const writes = [
        () => saveDiagram('diagram-1', makeSampleSchema()),
        () => saveDiagramIndex([]),
        () => deleteDiagram('diagram-1'),
        () => saveDiagramWithIndex('diagram-1', makeSampleSchema(), () => makeSampleIndex()[0]),
      ]
      for (const write of writes) {
        expect(write).toThrow(expect.objectContaining({ name: 'DiagramStorageError', reason: 'unavailable' }))
      }
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('malformed store', () => {
    it('treats a store without a diagrams object as unreadable instead of throwing TypeError', () => {
      mockStorage.set(STORAGE_KEY, JSON.stringify({ index: makeSampleIndex() }))
      expect(loadDiagram('diagram-1')).toBeNull()
      expect(loadDiagramIndex()).toEqual([])
    })

    it('rejects a diagrams array', () => {
      mockStorage.set(STORAGE_KEY, JSON.stringify({ diagrams: [], index: [] }))
      expect(loadDiagram('0')).toBeNull()
    })

    it('backs up an unreadable store before the first write replaces it', () => {
      mockStorage.set(STORAGE_KEY, 'not-json')
      saveDiagram('diagram-1', makeSampleSchema())
      expect(mockStorage.get(BACKUP_KEY)).toBe('not-json')
      const stored: DiagramStore = JSON.parse(mockStorage.get(STORAGE_KEY)!)
      expect(stored.diagrams['diagram-1']).toEqual(makeSampleSchema())
    })
  })
})
