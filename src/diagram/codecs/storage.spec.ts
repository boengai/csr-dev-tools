import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { nth } from '@/test/nth'
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
      expect(nth(index, 0).createdAt).toBe('2026-01-01T00:00:00.000Z')
      expect(nth(index, 0).updatedAt).toBe('2026-02-02T00:00:00.000Z')
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
        () => saveDiagramWithIndex('diagram-1', makeSampleSchema(), () => nth(makeSampleIndex(), 0)),
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

  describe('partly damaged store', () => {
    const DAMAGED = {
      diagrams: {
        a: {
          relationships: [{ id: 'r', sourceTableId: 't2', targetTableId: 'gone' }],
          tables: [{ columns: [{ name: 'a', type: 'CHAR' }, 7], name: 'users' }, { columns: 'x', id: 't2' }, null],
        },
        b: null,
        c: {},
      },
      index: 7,
    }
    const column = (id: string, name: string) => ({ ...nth(nth(makeSampleSchema().tables, 0).columns, 0), id, name })
    const table = (id: string, columns: Array<unknown>) => ({ columns, id, name: id, position: { x: 1, y: 2 } })
    const seed = (store: unknown) => mockStorage.set(STORAGE_KEY, JSON.stringify(store))
    const loadSeeded = (schema: unknown): DiagramSchema => {
      seed({ diagrams: { a: schema }, index: [] })
      const loaded = loadDiagram('a')
      if (!loaded) throw new Error('Expected the seeded diagram to load')
      return loaded
    }

    it('keeps the readable tables and columns and fills in the rest', () => {
      seed(DAMAGED)
      expect(loadDiagram('a')).toEqual({
        relationships: [],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false },
                id: 'c_0',
                name: 'a',
                type: 'CHAR',
              },
            ],
            id: 't_0',
            name: 'users',
            position: { x: 0, y: 0 },
          },
          { columns: [], id: 't2', name: 'table', position: { x: 0, y: 0 } },
        ],
      })
    })

    it.each([[null], [42], ['text'], [true], [[]], [[{}]]])('does not open %j stored as a diagram', (diagram) => {
      seed({ diagrams: { b: diagram }, index: [] })
      expect(loadDiagram('b')).toBeNull()
    })

    it('opens a diagram without lists as an empty one', () => {
      seed(DAMAGED)
      expect(loadDiagram('c')).toEqual({ relationships: [], tables: [] })
    })

    it('lists again the readable diagrams whose index entries were lost', () => {
      seed(DAMAGED)
      expect(loadDiagramIndex().map(({ id }) => id)).toEqual(['a', 'c'])
    })

    it('keeps the good index entries beside damaged ones', () => {
      const good = nth(makeSampleIndex(), 0)
      seed({ diagrams: { 'diagram-1': {}, lost: {} }, index: [null, { name: 'no id' }, good, { id: 'bare', name: 7 }] })
      expect(loadDiagramIndex()).toEqual([
        good,
        expect.objectContaining({ id: 'bare', name: 'Untitled Diagram' }),
        expect.objectContaining({ id: 'lost', name: 'Untitled Diagram' }),
      ])
    })

    it('lists a lost diagram as older than the known ones', () => {
      const good = nth(makeSampleIndex(), 0)
      seed({ diagrams: { 'diagram-1': {}, lost: {} }, index: [good] })
      expect(nth(loadDiagramIndex(), 1).updatedAt < good.updatedAt).toBe(true)
    })

    it("still lists a diagram whose entry was relabelled with another diagram's id", () => {
      seed({
        diagrams: { a: {}, b: {} },
        index: [
          { id: 'b', name: 'A' },
          { id: 'b', name: 'B' },
        ],
      })
      expect(loadDiagramIndex().map(({ id, name }) => [id, name])).toEqual([
        ['b', 'A'],
        ['b', 'B'],
        ['a', 'Untitled Diagram'],
      ])
    })

    it('never writes while reading', () => {
      seed(DAMAGED)
      localStorageMock.setItem.mockClear()
      loadDiagramIndex()
      for (const id of ['a', 'b', 'c']) loadDiagram(id)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
      expect(mockStorage.get(STORAGE_KEY)).toBe(JSON.stringify(DAMAGED))
    })

    it('leaves the damaged diagrams as stored when another one is saved', () => {
      seed(DAMAGED)
      saveDiagram('c', makeSampleSchema())

      const stored: DiagramStore = JSON.parse(mockStorage.get(STORAGE_KEY)!)
      expect(stored.diagrams).toEqual({ ...DAMAGED.diagrams, c: makeSampleSchema() })
      expect(mockStorage.has(BACKUP_KEY)).toBe(false)
    })

    it('keeps store fields it does not know when a diagram is saved', () => {
      seed({ diagrams: {}, index: [], later: 1 })
      saveDiagram('c', makeSampleSchema())
      expect(JSON.parse(mockStorage.get(STORAGE_KEY)!).later).toBe(1)
    })

    it('reads a constraint that is not stored as not set', () => {
      const schema = loadSeeded({
        tables: [table('t1', [{ ...column('c1', 'id'), constraints: { isPrimaryKey: true } }])],
      })
      expect(nth(nth(schema.tables, 0).columns, 0).constraints).toEqual({
        isForeignKey: false,
        isNullable: false,
        isPrimaryKey: true,
        isUnique: false,
      })
    })

    it('never gives an item without an id the id of another item', () => {
      const schema = loadSeeded({
        relationships: [
          { sourceColumnId: 'c_0', sourceTableId: 't_0', targetColumnId: 'c_1', targetTableId: 't_0' },
          { id: 'r_0', sourceColumnId: 'c_0', sourceTableId: 't_0', targetColumnId: 'c_1', targetTableId: 't_0' },
        ],
        tables: [
          { name: 'users' },
          table('t_0', [
            { name: 'email' },
            column('c_0', 'id'),
            column('c_1', 'age'),
            column('c_0_', 'x'),
            { name: 'phone' },
          ]),
        ],
      })

      const [users, orders] = schema.tables
      expect(users).toMatchObject({ name: 'users' })
      expect(orders).toMatchObject({ id: 't_0', name: 't_0' })
      expect(users?.id).not.toBe('t_0')
      expect(new Set(orders?.columns.map(({ id }) => id)).size).toBe(5)
      expect(new Set(schema.relationships.map(({ id }) => id)).size).toBe(2)
    })

    it('keeps a relationship to a table and column whose stored id is blank', () => {
      const link = {
        id: 'r',
        relationType: '1:N',
        sourceColumnId: '',
        sourceTableId: '',
        targetColumnId: 'c2',
        targetTableId: 't2',
      }
      const schema = loadSeeded({
        relationships: [link],
        tables: [table('', [column('', 'id')]), table('t2', [column('c2', 'user_id')])],
      })
      expect(schema.relationships).toEqual([link])
    })

    it('keeps a relationship whose column is gone and drops one whose table is gone', () => {
      const link = {
        id: 'good',
        relationType: '1:N',
        sourceColumnId: 'c1',
        sourceTableId: 't1',
        targetColumnId: 'c2',
        targetTableId: 't2',
      }
      const schema = loadSeeded({
        relationships: [
          { ...link, id: 'no-column', sourceColumnId: '' },
          { ...link, id: 'no-source', sourceTableId: 'gone' },
          link,
          { ...link, id: 'no-target', targetTableId: 7 },
        ],
        tables: [table('t1', [column('c1', 'id')]), table('t2', [column('c2', 'user_id')])],
      })
      expect(schema.relationships).toEqual([{ ...link, id: 'no-column', sourceColumnId: '' }, link])
    })

    it('places a table with an unusable coordinate at zero', () => {
      const schema = loadSeeded({ tables: [{ ...table('t1', []), position: { x: 'left', y: 5 } }] })
      expect(nth(schema.tables, 0).position).toEqual({ x: 0, y: 5 })
    })
  })
})
