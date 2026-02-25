import { describe, expect, it } from 'vitest'

import { parseJsonSchema } from './db-diagram-json-schema'

describe('db-diagram-json-schema', () => {
  describe('parseJsonSchema', () => {
    it('parses definitions/properties into tables/columns', () => {
      const schema = {
        definitions: {
          User: {
            properties: {
              email: { type: 'string' },
              id: { type: 'integer' },
              name: { type: 'string' },
            },
            type: 'object',
          },
        },
      }
      const result = parseJsonSchema(schema)
      expect(result.tables).toHaveLength(1)
      expect(result.tables[0].name).toBe('User')
      expect(result.tables[0].columns).toHaveLength(3)
    })

    it('supports $defs as alternative to definitions', () => {
      const schema = {
        $defs: {
          Post: {
            properties: {
              id: { type: 'integer' },
              title: { type: 'string' },
            },
            type: 'object',
          },
        },
      }
      const result = parseJsonSchema(schema)
      expect(result.tables).toHaveLength(1)
      expect(result.tables[0].name).toBe('Post')
    })

    it('maps JSON Schema types to ColumnType', () => {
      const schema = {
        definitions: {
          Test: {
            properties: {
              active: { type: 'boolean' },
              count: { type: 'integer' },
              data: { type: 'object' },
              name: { type: 'string' },
              score: { type: 'number' },
              tags: { type: 'array' },
            },
            type: 'object',
          },
        },
      }
      const result = parseJsonSchema(schema)
      const cols = result.tables[0].columns

      expect(cols.find((c) => c.name === 'name')?.type).toBe('VARCHAR')
      expect(cols.find((c) => c.name === 'count')?.type).toBe('INT')
      expect(cols.find((c) => c.name === 'score')?.type).toBe('FLOAT')
      expect(cols.find((c) => c.name === 'active')?.type).toBe('BOOLEAN')
      expect(cols.find((c) => c.name === 'tags')?.type).toBe('JSON')
      expect(cols.find((c) => c.name === 'data')?.type).toBe('JSON')
    })

    it('detects $ref as FK relationship', () => {
      const schema = {
        definitions: {
          Post: {
            properties: {
              author: { $ref: '#/definitions/User' },
              id: { type: 'integer' },
              title: { type: 'string' },
            },
            type: 'object',
          },
          User: {
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
            type: 'object',
          },
        },
      }
      const result = parseJsonSchema(schema)
      expect(result.relationships).toHaveLength(1)

      const rel = result.relationships[0]
      const userTable = result.tables.find((t) => t.name === 'User')
      const postTable = result.tables.find((t) => t.name === 'Post')
      expect(rel.sourceTableId).toBe(userTable?.id)
      expect(rel.targetTableId).toBe(postTable?.id)

      // The author column should be marked as FK
      const authorCol = postTable?.columns.find((c) => c.name === 'author')
      expect(authorCol?.constraints.isForeignKey).toBe(true)
      expect(authorCol?.type).toBe('INT')
    })

    it('handles required array as NOT NULL', () => {
      const schema = {
        definitions: {
          User: {
            properties: {
              email: { type: 'string' },
              id: { type: 'integer' },
              bio: { type: 'string' },
            },
            required: ['id', 'email'],
            type: 'object',
          },
        },
      }
      const result = parseJsonSchema(schema)
      const cols = result.tables[0].columns

      expect(cols.find((c) => c.name === 'id')?.constraints.isNullable).toBe(false)
      expect(cols.find((c) => c.name === 'email')?.constraints.isNullable).toBe(false)
      expect(cols.find((c) => c.name === 'bio')?.constraints.isNullable).toBe(true)
    })

    it('handles missing or empty schema gracefully', () => {
      expect(parseJsonSchema({}).tables).toHaveLength(0)
      expect(parseJsonSchema({ definitions: {} }).tables).toHaveLength(0)
      expect(parseJsonSchema({ $defs: {} }).tables).toHaveLength(0)
    })

    it('marks "id" properties as primary key', () => {
      const schema = {
        definitions: {
          User: {
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
            type: 'object',
          },
        },
      }
      const result = parseJsonSchema(schema)
      const idCol = result.tables[0].columns.find((c) => c.name === 'id')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
    })

    it('handles multiple definitions', () => {
      const schema = {
        definitions: {
          Comment: {
            properties: { id: { type: 'integer' } },
            type: 'object',
          },
          Post: {
            properties: { id: { type: 'integer' } },
            type: 'object',
          },
          User: {
            properties: { id: { type: 'integer' } },
            type: 'object',
          },
        },
      }
      const result = parseJsonSchema(schema)
      expect(result.tables).toHaveLength(3)
    })

    it('assigns grid positions to tables', () => {
      const schema = {
        definitions: {
          A: { properties: { id: { type: 'integer' } } },
          B: { properties: { id: { type: 'integer' } } },
          C: { properties: { id: { type: 'integer' } } },
          D: { properties: { id: { type: 'integer' } } },
        },
      }
      const result = parseJsonSchema(schema)
      for (const table of result.tables) {
        expect(table.position).toBeDefined()
        expect(typeof table.position.x).toBe('number')
        expect(typeof table.position.y).toBe('number')
      }
    })
  })
})
