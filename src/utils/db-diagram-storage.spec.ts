import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DiagramIndexEntry, DiagramSchema, DiagramStore } from '@/types'

import {
  deleteDiagram,
  generateDiagramId,
  loadDiagram,
  loadDiagramIndex,
  saveDiagram,
  saveDiagramIndex,
} from './db-diagram-storage'

const STORAGE_KEY = 'csr-dev-tools-db-diagrams'

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
})
