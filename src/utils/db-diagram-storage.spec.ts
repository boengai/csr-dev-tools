import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DiagramIndexEntry, DiagramSchema } from '@/types'

import {
  deleteDiagram,
  generateDiagramId,
  loadDiagram,
  loadDiagramIndex,
  saveDiagram,
  saveDiagramIndex,
} from './db-diagram-storage'

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
    it('should return empty array when no index exists', () => {
      expect(loadDiagramIndex()).toEqual([])
    })

    it('should return parsed index from localStorage', () => {
      const index = makeSampleIndex()
      mockStorage.set('csr-dev-tools-db-diagram-index', JSON.stringify(index))
      expect(loadDiagramIndex()).toEqual(index)
    })

    it('should return empty array on invalid JSON', () => {
      mockStorage.set('csr-dev-tools-db-diagram-index', 'invalid-json')
      expect(loadDiagramIndex()).toEqual([])
    })
  })

  describe('saveDiagramIndex', () => {
    it('should save index to localStorage', () => {
      const index = makeSampleIndex()
      saveDiagramIndex(index)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('csr-dev-tools-db-diagram-index', JSON.stringify(index))
    })
  })

  describe('loadDiagram', () => {
    it('should return null when diagram does not exist', () => {
      expect(loadDiagram('nonexistent')).toBeNull()
    })

    it('should return parsed diagram from localStorage', () => {
      const schema = makeSampleSchema()
      mockStorage.set('csr-dev-tools-db-diagram-diagram-1', JSON.stringify(schema))
      expect(loadDiagram('diagram-1')).toEqual(schema)
    })
  })

  describe('saveDiagram', () => {
    it('should save diagram to localStorage with correct key', () => {
      const schema = makeSampleSchema()
      saveDiagram('diagram-1', schema)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'csr-dev-tools-db-diagram-diagram-1',
        JSON.stringify(schema),
      )
    })
  })

  describe('deleteDiagram', () => {
    it('should remove diagram data and update index', () => {
      const index = makeSampleIndex()
      mockStorage.set('csr-dev-tools-db-diagram-index', JSON.stringify(index))
      mockStorage.set('csr-dev-tools-db-diagram-diagram-1', '{}')

      deleteDiagram('diagram-1')

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('csr-dev-tools-db-diagram-diagram-1')
      // Index should be updated without the deleted entry
      const updatedIndex = JSON.parse(mockStorage.get('csr-dev-tools-db-diagram-index') ?? '[]')
      expect(updatedIndex).toEqual([])
    })

    it('should handle deletion when diagram is not in index', () => {
      mockStorage.set('csr-dev-tools-db-diagram-index', JSON.stringify([]))
      deleteDiagram('nonexistent')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('csr-dev-tools-db-diagram-nonexistent')
    })
  })
})
