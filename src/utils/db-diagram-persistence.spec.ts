import { describe, expect, it } from 'vitest'

import type { DiagramSchema } from '@/types'

import { deserializeDiagram, serializeDiagram, validateDiagramSchema } from './db-diagram-persistence'

const makeSampleSchema = (): DiagramSchema => ({
  relationships: [
    {
      id: 'r1',
      relationType: '1:N',
      sourceColumnId: 'c1',
      sourceTableId: 't1',
      targetColumnId: 'c3',
      targetTableId: 't2',
    },
  ],
  tables: [
    {
      columns: [
        {
          constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
          id: 'c1',
          name: 'id',
          type: 'SERIAL',
        },
        {
          constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: true },
          id: 'c2',
          name: 'email',
          type: 'VARCHAR',
        },
      ],
      id: 't1',
      name: 'users',
      position: { x: 100, y: 200 },
    },
    {
      columns: [
        {
          constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
          id: 'c4',
          name: 'id',
          type: 'SERIAL',
        },
        {
          constraints: { isForeignKey: true, isNullable: false, isPrimaryKey: false, isUnique: false },
          id: 'c3',
          name: 'user_id',
          type: 'INT',
        },
      ],
      id: 't2',
      name: 'posts',
      position: { x: 400, y: 200 },
    },
  ],
})

describe('db-diagram-persistence', () => {
  describe('serializeDiagram', () => {
    it('should serialize nodes and edges to DiagramSchema', () => {
      const nodes = [
        {
          data: {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
                id: 'c1',
                name: 'id',
                type: 'SERIAL' as const,
              },
            ],
            onAddColumn: () => {},
            onColumnChange: () => {},
            onDeleteColumn: () => {},
            onDeleteTable: () => {},
            onTableNameChange: () => {},
            tableName: 'users',
          },
          id: 't1',
          position: { x: 100, y: 200 },
          type: 'tableNode',
        },
      ]
      const edges = [
        {
          data: {
            relationType: '1:N' as const,
            sourceColumnId: 't1-c1-source',
            targetColumnId: 't2-c2-target',
          },
          id: 'e1',
          source: 't1',
          sourceHandle: 't1-c1-source',
          target: 't2',
          targetHandle: 't2-c2-target',
          type: 'relationship',
        },
      ]

      const schema = serializeDiagram(nodes, edges)
      expect(schema.tables).toHaveLength(1)
      expect(schema.tables[0].name).toBe('users')
      expect(schema.tables[0].position).toEqual({ x: 100, y: 200 })
      expect(schema.tables[0].columns).toHaveLength(1)
      // Callbacks should not be in serialized output
      expect(schema.tables[0]).not.toHaveProperty('onAddColumn')
    })

    it('should strip callback functions from serialized output', () => {
      const nodes = [
        {
          data: {
            columns: [],
            onAddColumn: () => {},
            onColumnChange: () => {},
            onDeleteColumn: () => {},
            onDeleteTable: () => {},
            onTableNameChange: () => {},
            tableName: 'test',
          },
          id: 't1',
          position: { x: 0, y: 0 },
          type: 'tableNode',
        },
      ]
      const schema = serializeDiagram(nodes, [])
      const json = JSON.stringify(schema)
      expect(json).not.toContain('function')
    })
  })

  describe('deserializeDiagram', () => {
    it('should reconstruct nodes and edges from DiagramSchema', () => {
      const schema = makeSampleSchema()
      const { edges, nodes } = deserializeDiagram(schema)

      expect(nodes).toHaveLength(2)
      expect(nodes[0].id).toBe('t1')
      expect(nodes[0].data.tableName).toBe('users')
      expect(nodes[0].position).toEqual({ x: 100, y: 200 })
      expect(nodes[0].type).toBe('tableNode')

      expect(edges).toHaveLength(1)
      expect(edges[0].source).toBe('t1')
      expect(edges[0].target).toBe('t2')
      expect(edges[0].type).toBe('relationship')
    })

    it('should re-create handle IDs on deserialized edges', () => {
      const schema = makeSampleSchema()
      const { edges } = deserializeDiagram(schema)

      expect(edges[0].sourceHandle).toBe('t1-c1-source')
      expect(edges[0].targetHandle).toBe('t2-c3-target')
    })
  })

  describe('round-trip: serialize → deserialize', () => {
    it('should produce equivalent state after round-trip', () => {
      const originalNodes = [
        {
          data: {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
                id: 'c1',
                name: 'id',
                type: 'SERIAL' as const,
              },
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: true },
                id: 'c2',
                name: 'email',
                type: 'VARCHAR' as const,
              },
            ],
            onAddColumn: () => {},
            onColumnChange: () => {},
            onDeleteColumn: () => {},
            onDeleteTable: () => {},
            onTableNameChange: () => {},
            tableName: 'users',
          },
          id: 't1',
          position: { x: 150, y: 300 },
          type: 'tableNode',
        },
      ]

      const schema = serializeDiagram(originalNodes, [])
      const { nodes: restoredNodes } = deserializeDiagram(schema)

      expect(restoredNodes[0].id).toBe(originalNodes[0].id)
      expect(restoredNodes[0].data.tableName).toBe(originalNodes[0].data.tableName)
      expect(restoredNodes[0].position).toEqual(originalNodes[0].position)
      expect(restoredNodes[0].data.columns).toHaveLength(2)
      expect(restoredNodes[0].data.columns[0].name).toBe('id')
      expect(restoredNodes[0].data.columns[1].name).toBe('email')
    })
  })

  describe('validateDiagramSchema', () => {
    it('should return true for a valid schema', () => {
      const schema = makeSampleSchema()
      expect(validateDiagramSchema(schema)).toBe(true)
    })

    it('should reject null', () => {
      expect(validateDiagramSchema(null)).toBe(false)
    })

    it('should reject non-object', () => {
      expect(validateDiagramSchema('string')).toBe(false)
    })

    it('should reject schema with missing tables', () => {
      expect(validateDiagramSchema({ relationships: [] })).toBe(false)
    })

    it('should reject schema with missing relationships', () => {
      expect(validateDiagramSchema({ tables: [] })).toBe(false)
    })

    it('should reject table with missing id', () => {
      const schema = {
        relationships: [],
        tables: [{ columns: [], name: 'test', position: { x: 0, y: 0 } }],
      }
      expect(validateDiagramSchema(schema)).toBe(false)
    })

    it('should reject schema with invalid FK references (table not found)', () => {
      const schema = {
        relationships: [
          {
            id: 'r1',
            relationType: '1:N',
            sourceColumnId: 'c1',
            sourceTableId: 'nonexistent',
            targetColumnId: 'c2',
            targetTableId: 't1',
          },
        ],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: false },
                id: 'c2',
                name: 'id',
                type: 'INT',
              },
            ],
            id: 't1',
            name: 'test',
            position: { x: 0, y: 0 },
          },
        ],
      }
      expect(validateDiagramSchema(schema)).toBe(false)
    })

    it('should reject schema with invalid FK references (column not found)', () => {
      const schema = {
        relationships: [
          {
            id: 'r1',
            relationType: '1:N',
            sourceColumnId: 'nonexistent_col',
            sourceTableId: 't1',
            targetColumnId: 'c2',
            targetTableId: 't2',
          },
        ],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: false },
                id: 'c1',
                name: 'id',
                type: 'INT',
              },
            ],
            id: 't1',
            name: 'users',
            position: { x: 0, y: 0 },
          },
          {
            columns: [
              {
                constraints: { isForeignKey: true, isNullable: false, isPrimaryKey: false, isUnique: false },
                id: 'c2',
                name: 'user_id',
                type: 'INT',
              },
            ],
            id: 't2',
            name: 'posts',
            position: { x: 0, y: 0 },
          },
        ],
      }
      expect(validateDiagramSchema(schema)).toBe(false)
    })
  })
})
