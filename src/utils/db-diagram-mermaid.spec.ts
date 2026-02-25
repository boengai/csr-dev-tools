import { describe, expect, it } from 'vitest'

import type { DiagramSchema } from '@/types'

import { generateMermaidER } from './db-diagram-mermaid'

describe('db-diagram-mermaid', () => {
  describe('generateMermaidER', () => {
    it('generates valid Mermaid ER syntax for a single table', () => {
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
      const result = generateMermaidER(schema)
      expect(result).toContain('erDiagram')
      expect(result).toContain('USERS {')
      expect(result).toContain('int id PK')
      expect(result).toContain('varchar email')
    })

    it('maps relationship types to correct Mermaid notation', () => {
      const schema: DiagramSchema = {
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
              {
                constraints: { isForeignKey: true, isNullable: false, isPrimaryKey: false, isUnique: false },
                id: 'c3',
                name: 'user_id',
                type: 'INT',
              },
            ],
            id: 't2',
            name: 'posts',
            position: { x: 300, y: 0 },
          },
        ],
      }
      const result = generateMermaidER(schema)
      expect(result).toContain('USERS ||--o{ POSTS : "has"')
    })

    it('maps 1:1 relationships correctly', () => {
      const schema: DiagramSchema = {
        relationships: [
          {
            id: 'r1',
            relationType: '1:1',
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
                constraints: { isForeignKey: true, isNullable: false, isPrimaryKey: false, isUnique: true },
                id: 'c3',
                name: 'user_id',
                type: 'INT',
              },
            ],
            id: 't2',
            name: 'profiles',
            position: { x: 300, y: 0 },
          },
        ],
      }
      const result = generateMermaidER(schema)
      expect(result).toContain('USERS ||--|| PROFILES : "has"')
    })

    it('maps N:M relationships correctly', () => {
      const schema: DiagramSchema = {
        relationships: [
          {
            id: 'r1',
            relationType: 'N:M',
            sourceColumnId: 'c1',
            sourceTableId: 't1',
            targetColumnId: 'c2',
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
                type: 'INT',
              },
            ],
            id: 't1',
            name: 'students',
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
            name: 'courses',
            position: { x: 300, y: 0 },
          },
        ],
      }
      const result = generateMermaidER(schema)
      expect(result).toContain('STUDENTS }o--o{ COURSES : "has"')
    })

    it('handles tables with no relationships', () => {
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
            name: 'standalone',
            position: { x: 0, y: 0 },
          },
        ],
      }
      const result = generateMermaidER(schema)
      expect(result).toContain('erDiagram')
      expect(result).toContain('STANDALONE {')
      expect(result).not.toContain('||')
    })

    it('marks FK columns with FK marker', () => {
      const schema: DiagramSchema = {
        relationships: [],
        tables: [
          {
            columns: [
              {
                constraints: { isForeignKey: true, isNullable: false, isPrimaryKey: false, isUnique: false },
                id: 'c1',
                name: 'user_id',
                type: 'INT',
              },
            ],
            id: 't1',
            name: 'posts',
            position: { x: 0, y: 0 },
          },
        ],
      }
      const result = generateMermaidER(schema)
      expect(result).toContain('int user_id FK')
    })

    it('returns empty string for empty schema', () => {
      const schema: DiagramSchema = { relationships: [], tables: [] }
      expect(generateMermaidER(schema)).toBe('')
    })
  })
})
