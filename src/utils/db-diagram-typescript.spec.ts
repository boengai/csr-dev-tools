import { describe, expect, it } from 'vitest'

import type { DiagramSchema } from '@/types'

import { generateTypeScript } from './db-diagram-typescript'

describe('db-diagram-typescript', () => {
  describe('generateTypeScript', () => {
    it('generates valid TypeScript type definitions', () => {
      const schema: DiagramSchema = {
        relationships: [],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
                id: 'c1',
                name: 'id',
                type: 'INT',
              },
              {
                constraints: { isForeignKey: false, isNullable: true, isPrimaryKey: false, isUnique: false },
                id: 'c2',
                name: 'email',
                type: 'VARCHAR',
              },
            ],
            id: 't1',
            name: 'users',
            position: { x: 0, y: 0 },
          },
        ],
      }
      const result = generateTypeScript(schema)
      expect(result).toContain('export type Users = {')
      expect(result).toContain('id: number')
      expect(result).toContain('email: string | null')
    })

    it('maps SQL types to TS types correctly', () => {
      const columns = [
        { expected: 'number', type: 'INT' as const },
        { expected: 'number', type: 'BIGINT' as const },
        { expected: 'number', type: 'SERIAL' as const },
        { expected: 'number', type: 'FLOAT' as const },
        { expected: 'number', type: 'DECIMAL' as const },
        { expected: 'string', type: 'VARCHAR' as const },
        { expected: 'string', type: 'TEXT' as const },
        { expected: 'string', type: 'UUID' as const },
        { expected: 'boolean', type: 'BOOLEAN' as const },
        { expected: 'Date', type: 'DATE' as const },
        { expected: 'Date', type: 'TIMESTAMP' as const },
        { expected: 'Record<string, unknown>', type: 'JSON' as const },
        { expected: 'Uint8Array', type: 'BLOB' as const },
      ]

      for (const { expected, type } of columns) {
        const schema: DiagramSchema = {
          relationships: [],
          tables: [
            {
              columns: [
                {
                  constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false },
                  id: 'c1',
                  name: 'col',
                  type,
                },
              ],
              id: 't1',
              name: 'test_table',
              position: { x: 0, y: 0 },
            },
          ],
        }
        const result = generateTypeScript(schema)
        expect(result).toContain(`col: ${expected}`)
      }
    })

    it('converts snake_case to camelCase', () => {
      const schema: DiagramSchema = {
        relationships: [],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false },
                id: 'c1',
                name: 'created_at',
                type: 'TIMESTAMP',
              },
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false },
                id: 'c2',
                name: 'user_profile_id',
                type: 'INT',
              },
            ],
            id: 't1',
            name: 'posts',
            position: { x: 0, y: 0 },
          },
        ],
      }
      const result = generateTypeScript(schema)
      expect(result).toContain('createdAt: Date')
      expect(result).toContain('userProfileId: number')
    })

    it('nullable columns produce | null union', () => {
      const schema: DiagramSchema = {
        relationships: [],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: true, isPrimaryKey: false, isUnique: false },
                id: 'c1',
                name: 'bio',
                type: 'TEXT',
              },
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false },
                id: 'c2',
                name: 'name',
                type: 'VARCHAR',
              },
            ],
            id: 't1',
            name: 'profiles',
            position: { x: 0, y: 0 },
          },
        ],
      }
      const result = generateTypeScript(schema)
      expect(result).toContain('bio: string | null')
      expect(result).toContain('name: string')
      expect(result).not.toContain('name: string | null')
    })

    it('handles tables with no columns (empty type)', () => {
      const schema: DiagramSchema = {
        relationships: [],
        tables: [
          {
            columns: [],
            id: 't1',
            name: 'empty_table',
            position: { x: 0, y: 0 },
          },
        ],
      }
      const result = generateTypeScript(schema)
      expect(result).toContain('export type EmptyTable = {')
      expect(result).toContain('}')
    })

    it('converts table name to PascalCase', () => {
      const schema: DiagramSchema = {
        relationships: [],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
                id: 'c1',
                name: 'id',
                type: 'INT',
              },
            ],
            id: 't1',
            name: 'user_profiles',
            position: { x: 0, y: 0 },
          },
        ],
      }
      const result = generateTypeScript(schema)
      expect(result).toContain('export type UserProfiles = {')
    })

    it('returns empty string for empty schema', () => {
      const schema: DiagramSchema = { relationships: [], tables: [] }
      expect(generateTypeScript(schema)).toBe('')
    })

    it('generates multiple types separated by blank lines', () => {
      const schema: DiagramSchema = {
        relationships: [],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
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
                constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
                id: 'c2',
                name: 'id',
                type: 'INT',
              },
            ],
            id: 't2',
            name: 'posts',
            position: { x: 300, y: 0 },
          },
        ],
      }
      const result = generateTypeScript(schema)
      expect(result).toContain('export type Users = {')
      expect(result).toContain('export type Posts = {')
      // Should have a blank line between types
      expect(result).toContain('}\n\nexport type')
    })
  })
})
