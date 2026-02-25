import { describe, expect, it } from 'vitest'

import type { DiagramSchema } from '@/types'

import { generateCreateTable, generateForeignKeys, generateSql, mapColumnType } from './db-diagram-sql'

const makeTable = (
  name: string,
  id: string,
  columns: DiagramSchema['tables'][0]['columns'],
): DiagramSchema['tables'][0] => ({
  columns,
  id,
  name,
  position: { x: 0, y: 0 },
})

const makeColumn = (
  name: string,
  id: string,
  type: DiagramSchema['tables'][0]['columns'][0]['type'],
  constraints: Partial<DiagramSchema['tables'][0]['columns'][0]['constraints']> = {},
): DiagramSchema['tables'][0]['columns'][0] => ({
  constraints: {
    isForeignKey: false,
    isNullable: true,
    isPrimaryKey: false,
    isUnique: false,
    ...constraints,
  },
  id,
  name,
  type,
})

describe('db-diagram-sql', () => {
  describe('mapColumnType', () => {
    it('should map INT correctly per dialect', () => {
      expect(mapColumnType('INT', 'postgresql')).toBe('INTEGER')
      expect(mapColumnType('INT', 'mysql')).toBe('INT')
      expect(mapColumnType('INT', 'sqlite')).toBe('INTEGER')
    })

    it('should map BIGINT correctly per dialect', () => {
      expect(mapColumnType('BIGINT', 'postgresql')).toBe('BIGINT')
      expect(mapColumnType('BIGINT', 'mysql')).toBe('BIGINT')
      expect(mapColumnType('BIGINT', 'sqlite')).toBe('INTEGER')
    })

    it('should map SERIAL correctly per dialect', () => {
      expect(mapColumnType('SERIAL', 'postgresql')).toBe('SERIAL')
      expect(mapColumnType('SERIAL', 'mysql')).toBe('INT')
      expect(mapColumnType('SERIAL', 'sqlite')).toBe('INTEGER')
    })

    it('should map VARCHAR correctly per dialect', () => {
      expect(mapColumnType('VARCHAR', 'postgresql')).toBe('VARCHAR(255)')
      expect(mapColumnType('VARCHAR', 'mysql')).toBe('VARCHAR(255)')
      expect(mapColumnType('VARCHAR', 'sqlite')).toBe('TEXT')
    })

    it('should map TEXT correctly per dialect', () => {
      expect(mapColumnType('TEXT', 'postgresql')).toBe('TEXT')
      expect(mapColumnType('TEXT', 'mysql')).toBe('TEXT')
      expect(mapColumnType('TEXT', 'sqlite')).toBe('TEXT')
    })

    it('should map BOOLEAN correctly per dialect', () => {
      expect(mapColumnType('BOOLEAN', 'postgresql')).toBe('BOOLEAN')
      expect(mapColumnType('BOOLEAN', 'mysql')).toBe('TINYINT(1)')
      expect(mapColumnType('BOOLEAN', 'sqlite')).toBe('INTEGER')
    })

    it('should map DATE correctly per dialect', () => {
      expect(mapColumnType('DATE', 'postgresql')).toBe('DATE')
      expect(mapColumnType('DATE', 'mysql')).toBe('DATE')
      expect(mapColumnType('DATE', 'sqlite')).toBe('TEXT')
    })

    it('should map TIMESTAMP correctly per dialect', () => {
      expect(mapColumnType('TIMESTAMP', 'postgresql')).toBe('TIMESTAMP')
      expect(mapColumnType('TIMESTAMP', 'mysql')).toBe('TIMESTAMP')
      expect(mapColumnType('TIMESTAMP', 'sqlite')).toBe('TEXT')
    })

    it('should map FLOAT correctly per dialect', () => {
      expect(mapColumnType('FLOAT', 'postgresql')).toBe('REAL')
      expect(mapColumnType('FLOAT', 'mysql')).toBe('FLOAT')
      expect(mapColumnType('FLOAT', 'sqlite')).toBe('REAL')
    })

    it('should map DECIMAL correctly per dialect', () => {
      expect(mapColumnType('DECIMAL', 'postgresql')).toBe('DECIMAL(10,2)')
      expect(mapColumnType('DECIMAL', 'mysql')).toBe('DECIMAL(10,2)')
      expect(mapColumnType('DECIMAL', 'sqlite')).toBe('REAL')
    })

    it('should map UUID correctly per dialect', () => {
      expect(mapColumnType('UUID', 'postgresql')).toBe('UUID')
      expect(mapColumnType('UUID', 'mysql')).toBe('CHAR(36)')
      expect(mapColumnType('UUID', 'sqlite')).toBe('TEXT')
    })

    it('should map JSON correctly per dialect', () => {
      expect(mapColumnType('JSON', 'postgresql')).toBe('JSONB')
      expect(mapColumnType('JSON', 'mysql')).toBe('JSON')
      expect(mapColumnType('JSON', 'sqlite')).toBe('TEXT')
    })

    it('should map BLOB correctly per dialect', () => {
      expect(mapColumnType('BLOB', 'postgresql')).toBe('BYTEA')
      expect(mapColumnType('BLOB', 'mysql')).toBe('BLOB')
      expect(mapColumnType('BLOB', 'sqlite')).toBe('BLOB')
    })
  })

  describe('generateCreateTable', () => {
    it('should generate PostgreSQL CREATE TABLE with PK', () => {
      const table = makeTable('users', 't1', [
        makeColumn('id', 'c1', 'SERIAL', { isPrimaryKey: true, isNullable: false, isUnique: true }),
        makeColumn('email', 'c2', 'VARCHAR', { isNullable: false, isUnique: true }),
      ])
      const sql = generateCreateTable(table, 'postgresql')
      expect(sql).toContain('CREATE TABLE users')
      expect(sql).toContain('id SERIAL PRIMARY KEY')
      expect(sql).toContain('email VARCHAR(255) NOT NULL UNIQUE')
      expect(sql).toContain(');')
    })

    it('should generate MySQL CREATE TABLE with AUTO_INCREMENT and ENGINE=InnoDB', () => {
      const table = makeTable('users', 't1', [
        makeColumn('id', 'c1', 'SERIAL', { isPrimaryKey: true, isNullable: false, isUnique: true }),
        makeColumn('name', 'c2', 'VARCHAR', { isNullable: false }),
      ])
      const sql = generateCreateTable(table, 'mysql')
      expect(sql).toContain('CREATE TABLE users')
      expect(sql).toContain('INT NOT NULL AUTO_INCREMENT')
      expect(sql).toContain('PRIMARY KEY (id)')
      expect(sql).toContain('ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;')
    })

    it('should generate SQLite CREATE TABLE with AUTOINCREMENT', () => {
      const table = makeTable('users', 't1', [
        makeColumn('id', 'c1', 'SERIAL', { isPrimaryKey: true, isNullable: false, isUnique: true }),
        makeColumn('name', 'c2', 'TEXT'),
      ])
      const sql = generateCreateTable(table, 'sqlite')
      expect(sql).toContain('CREATE TABLE users')
      expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT')
      expect(sql).toContain('name TEXT')
      expect(sql).toContain(');')
    })

    it('should handle table with no columns', () => {
      const table = makeTable('empty_table', 't1', [])
      const sql = generateCreateTable(table, 'postgresql')
      expect(sql).toContain('CREATE TABLE empty_table')
      expect(sql).toContain(');')
    })

    it('should generate SQLite table-level PRIMARY KEY for non-SERIAL PK', () => {
      const table = makeTable('users', 't1', [
        makeColumn('id', 'c1', 'INT', { isPrimaryKey: true, isNullable: false }),
        makeColumn('name', 'c2', 'TEXT'),
      ])
      const sql = generateCreateTable(table, 'sqlite')
      expect(sql).toContain('PRIMARY KEY (id)')
    })
  })

  describe('generateForeignKeys', () => {
    it('should generate FK constraints for PostgreSQL', () => {
      const relationships: DiagramSchema['relationships'] = [
        {
          id: 'r1',
          relationType: '1:N',
          sourceColumnId: 'c1',
          sourceTableId: 't1',
          targetColumnId: 'c2',
          targetTableId: 't2',
        },
      ]
      const tables: DiagramSchema['tables'] = [
        makeTable('users', 't1', [makeColumn('id', 'c1', 'INT', { isPrimaryKey: true })]),
        makeTable('posts', 't2', [
          makeColumn('id', 'c3', 'INT', { isPrimaryKey: true }),
          makeColumn('user_id', 'c2', 'INT', { isForeignKey: true }),
        ]),
      ]
      const sql = generateForeignKeys(relationships, tables, 'postgresql')
      expect(sql).toContain('ALTER TABLE posts')
      expect(sql).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
    })
  })

  describe('generateSql', () => {
    it('should generate tables in FK dependency order (topological sort)', () => {
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
          makeTable('posts', 't2', [
            makeColumn('id', 'c2', 'SERIAL', { isPrimaryKey: true, isNullable: false }),
            makeColumn('user_id', 'c3', 'INT', { isForeignKey: true }),
          ]),
          makeTable('users', 't1', [makeColumn('id', 'c1', 'SERIAL', { isPrimaryKey: true, isNullable: false })]),
        ],
      }
      const sql = generateSql(schema, 'postgresql')
      const usersIdx = sql.indexOf('CREATE TABLE users')
      const postsIdx = sql.indexOf('CREATE TABLE posts')
      expect(usersIdx).toBeLessThan(postsIdx)
    })

    it('should generate N:M junction table', () => {
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
          makeTable('students', 't1', [makeColumn('id', 'c1', 'SERIAL', { isPrimaryKey: true, isNullable: false })]),
          makeTable('courses', 't2', [makeColumn('id', 'c2', 'SERIAL', { isPrimaryKey: true, isNullable: false })]),
        ],
      }
      const sql = generateSql(schema, 'postgresql')
      expect(sql).toContain('CREATE TABLE students_courses')
      expect(sql).toContain('REFERENCES students(id)')
      expect(sql).toContain('REFERENCES courses(id)')
    })

    it('should produce valid complete SQL for PostgreSQL', () => {
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
          makeTable('users', 't1', [
            makeColumn('id', 'c1', 'SERIAL', { isPrimaryKey: true, isNullable: false }),
            makeColumn('email', 'c4', 'VARCHAR', { isNullable: false, isUnique: true }),
          ]),
          makeTable('posts', 't2', [
            makeColumn('id', 'c2', 'SERIAL', { isPrimaryKey: true, isNullable: false }),
            makeColumn('user_id', 'c3', 'INT', { isForeignKey: true, isNullable: false }),
            makeColumn('title', 'c5', 'VARCHAR', { isNullable: false }),
          ]),
        ],
      }
      const sql = generateSql(schema, 'postgresql')
      expect(sql).toContain('CREATE TABLE users')
      expect(sql).toContain('CREATE TABLE posts')
      expect(sql).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
    })

    it('should handle empty schema', () => {
      const schema: DiagramSchema = { relationships: [], tables: [] }
      const sql = generateSql(schema, 'postgresql')
      expect(sql).toBe('')
    })

    it('should generate SQLite inline FOREIGN KEY in CREATE TABLE', () => {
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
          makeTable('users', 't1', [makeColumn('id', 'c1', 'SERIAL', { isPrimaryKey: true, isNullable: false })]),
          makeTable('posts', 't2', [
            makeColumn('id', 'c2', 'SERIAL', { isPrimaryKey: true, isNullable: false }),
            makeColumn('user_id', 'c3', 'INT', { isForeignKey: true, isNullable: false }),
          ]),
        ],
      }
      const sql = generateSql(schema, 'sqlite')
      // SQLite FKs should be inline in CREATE TABLE, not ALTER TABLE
      expect(sql).not.toContain('ALTER TABLE')
      expect(sql).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
      // FK should be inside the posts CREATE TABLE block
      const postsBlock = sql.slice(sql.indexOf('CREATE TABLE posts'))
      expect(postsBlock).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
    })
  })
})
