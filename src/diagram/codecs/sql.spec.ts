import { describe, expect, it } from 'vitest'

import { nth } from '@/test/nth'
import type { ColumnType, DiagramSchema } from '@/types'

import { createSequentialIdMinters } from '../id-minters'
import { generateCreateTable, generateForeignKeys, generateSql, mapColumnType, parseSqlDdl } from './sql'

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

  describe('parseSqlDdl', () => {
    it('parses a single CREATE TABLE with columns and types', () => {
      const sql = `
        CREATE TABLE users (
          id INT NOT NULL PRIMARY KEY,
          name VARCHAR(255),
          email TEXT NOT NULL,
          active BOOLEAN
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(1)
      expect(nth(result.tables, 0).name).toBe('users')
      expect(nth(result.tables, 0).id).toBe('t_1')
      expect(nth(result.tables, 0).columns).toHaveLength(4)
      expect(result.errors).toHaveLength(0)

      const idCol = nth(result.tables, 0).columns.find((c) => c.name === 'id')
      expect(idCol?.type).toBe('INT')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
      expect(idCol?.constraints.isNullable).toBe(false)

      const nameCol = nth(result.tables, 0).columns.find((c) => c.name === 'name')
      expect(nameCol?.type).toBe('VARCHAR')
      expect(nameCol?.constraints.isNullable).toBe(true)

      const emailCol = nth(result.tables, 0).columns.find((c) => c.name === 'email')
      expect(emailCol?.type).toBe('TEXT')
      expect(emailCol?.constraints.isNullable).toBe(false)

      const activeCol = nth(result.tables, 0).columns.find((c) => c.name === 'active')
      expect(activeCol?.type).toBe('BOOLEAN')
    })

    it('parses multiple CREATE TABLE statements', () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          title VARCHAR(255)
        );
        CREATE TABLE comments (
          id INT PRIMARY KEY,
          body TEXT
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(3)
      expect(result.tables.map((t) => t.name)).toEqual(['users', 'posts', 'comments'])
    })

    it('extracts PRIMARY KEY inline constraint', () => {
      const sql = `CREATE TABLE t (id INT PRIMARY KEY, name TEXT);`
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      const idCol = nth(result.tables, 0).columns.find((c) => c.name === 'id')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
      expect(idCol?.constraints.isNullable).toBe(false)
    })

    it('extracts PRIMARY KEY as table-level constraint', () => {
      const sql = `
        CREATE TABLE t (
          id INT NOT NULL,
          name TEXT,
          PRIMARY KEY (id)
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      const idCol = nth(result.tables, 0).columns.find((c) => c.name === 'id')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
    })

    it('extracts FOREIGN KEY constraints and creates relationships', () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.relationships).toHaveLength(1)
      const rel = nth(result.relationships, 0)
      expect(rel.relationType).toBe('1:N')

      const usersTable = result.tables.find((t) => t.name === 'users')
      const postsTable = result.tables.find((t) => t.name === 'posts')
      expect(rel.sourceTableId).toBe(usersTable?.id)
      expect(rel.targetTableId).toBe(postsTable?.id)
    })

    it('detects 1:1 from FK + UNIQUE combination', () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
        CREATE TABLE profiles (
          id INT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.relationships).toHaveLength(1)
      expect(nth(result.relationships, 0).relationType).toBe('1:1')
    })

    it('detects 1:1 from table-level UNIQUE constraint on FK column', () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
        CREATE TABLE profiles (
          id INT PRIMARY KEY,
          user_id INT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id),
          UNIQUE (user_id)
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.relationships).toHaveLength(1)
      expect(nth(result.relationships, 0).relationType).toBe('1:1')
    })

    it('handles MySQL AUTO_INCREMENT syntax', () => {
      const sql = `
        CREATE TABLE users (
          id INT NOT NULL AUTO_INCREMENT,
          name VARCHAR(255),
          PRIMARY KEY (id)
        ) ENGINE=InnoDB;
      `
      const result = parseSqlDdl(sql, 'mysql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(1)
      const idCol = nth(result.tables, 0).columns.find((c) => c.name === 'id')
      expect(idCol?.type).toBe('INT')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
    })

    it('handles PostgreSQL SERIAL syntax', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      const idCol = nth(result.tables, 0).columns.find((c) => c.name === 'id')
      expect(idCol?.type).toBe('SERIAL')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
    })

    it('handles PostgreSQL BIGSERIAL syntax', () => {
      const sql = `
        CREATE TABLE events (
          id BIGSERIAL PRIMARY KEY
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      const idCol = nth(result.tables, 0).columns.find((c) => c.name === 'id')
      expect(idCol?.type).toBe('BIGINT')
    })

    it('handles SQLite AUTOINCREMENT syntax', () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT
        );
      `
      const result = parseSqlDdl(sql, 'sqlite', createSequentialIdMinters())
      const idCol = nth(result.tables, 0).columns.find((c) => c.name === 'id')
      expect(idCol?.type).toBe('INT')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
    })

    it('strips line comments (--)', () => {
      const sql = `
        -- This is a comment
        CREATE TABLE users (
          id INT PRIMARY KEY, -- inline comment
          name TEXT
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(1)
      expect(nth(result.tables, 0).columns).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
    })

    it('strips block comments (/* */)', () => {
      const sql = `
        /* Multi-line
           block comment */
        CREATE TABLE users (
          id INT PRIMARY KEY,
          name TEXT /* inline block comment */
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(1)
      expect(nth(result.tables, 0).columns).toHaveLength(2)
    })

    it('handles IF NOT EXISTS', () => {
      const sql = `CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY);`
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(1)
      expect(nth(result.tables, 0).name).toBe('users')
    })

    it('returns errors for malformed SQL with partial success', () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
        THIS IS NOT VALID SQL;
        CREATE TABLE posts (
          id INT PRIMARY KEY
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(2)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('reverse-maps SQL types to ColumnType correctly', () => {
      const typeTests: Array<{ expected: ColumnType; sqlType: string }> = [
        { expected: 'INT', sqlType: 'INT' },
        { expected: 'INT', sqlType: 'INTEGER' },
        { expected: 'BIGINT', sqlType: 'BIGINT' },
        { expected: 'VARCHAR', sqlType: 'VARCHAR(255)' },
        { expected: 'VARCHAR', sqlType: 'CHAR(50)' },
        { expected: 'TEXT', sqlType: 'TEXT' },
        { expected: 'TEXT', sqlType: 'MEDIUMTEXT' },
        { expected: 'TEXT', sqlType: 'LONGTEXT' },
        { expected: 'BOOLEAN', sqlType: 'BOOLEAN' },
        { expected: 'BOOLEAN', sqlType: 'BOOL' },
        { expected: 'DATE', sqlType: 'DATE' },
        { expected: 'TIMESTAMP', sqlType: 'TIMESTAMP' },
        { expected: 'TIMESTAMP', sqlType: 'DATETIME' },
        { expected: 'FLOAT', sqlType: 'FLOAT' },
        { expected: 'FLOAT', sqlType: 'REAL' },
        { expected: 'FLOAT', sqlType: 'DOUBLE' },
        { expected: 'DECIMAL', sqlType: 'DECIMAL(10,2)' },
        { expected: 'DECIMAL', sqlType: 'NUMERIC(8,3)' },
        { expected: 'UUID', sqlType: 'UUID' },
        { expected: 'JSON', sqlType: 'JSON' },
        { expected: 'JSON', sqlType: 'JSONB' },
        { expected: 'BLOB', sqlType: 'BLOB' },
        { expected: 'BLOB', sqlType: 'BYTEA' },
        { expected: 'BLOB', sqlType: 'BINARY' },
        { expected: 'BLOB', sqlType: 'VARBINARY' },
      ]

      for (const { expected, sqlType } of typeTests) {
        const sql = `CREATE TABLE t (col ${sqlType});`
        const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
        expect(nth(nth(result.tables, 0).columns, 0).type).toBe(expected)
      }
    })

    it('handles TINYINT(1) as BOOLEAN in MySQL', () => {
      const sql = `CREATE TABLE t (active TINYINT(1));`
      const result = parseSqlDdl(sql, 'mysql', createSequentialIdMinters())
      expect(nth(nth(result.tables, 0).columns, 0).type).toBe('BOOLEAN')
    })

    it('handles UNIQUE constraint on columns', () => {
      const sql = `CREATE TABLE t (email VARCHAR(255) UNIQUE);`
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(nth(nth(result.tables, 0).columns, 0).constraints.isUnique).toBe(true)
    })

    it('handles inline REFERENCES syntax', () => {
      const sql = `
        CREATE TABLE users (id INT PRIMARY KEY);
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT REFERENCES users(id)
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.relationships).toHaveLength(1)
      expect(nth(result.relationships, 0).relationType).toBe('1:N')
    })

    it('handles DEFAULT clause (strips it)', () => {
      const sql = `
        CREATE TABLE t (
          status VARCHAR(20) DEFAULT 'active',
          count INT DEFAULT 0
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(nth(result.tables, 0).columns).toHaveLength(2)
      expect(nth(nth(result.tables, 0).columns, 0).name).toBe('status')
      expect(nth(nth(result.tables, 0).columns, 1).name).toBe('count')
    })

    it('handles quoted table and column names', () => {
      const sql = `CREATE TABLE "my_table" ("my_col" INT PRIMARY KEY);`
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(nth(result.tables, 0).name).toBe('my_table')
      expect(nth(nth(result.tables, 0).columns, 0).name).toBe('my_col')
    })

    it('handles backtick-quoted names (MySQL)', () => {
      const sql = 'CREATE TABLE `users` (`id` INT PRIMARY KEY);'
      const result = parseSqlDdl(sql, 'mysql', createSequentialIdMinters())
      expect(nth(result.tables, 0).name).toBe('users')
      expect(nth(nth(result.tables, 0).columns, 0).name).toBe('id')
    })

    it('auto-layouts tables in a grid pattern', () => {
      const sql = `
        CREATE TABLE a (id INT PRIMARY KEY);
        CREATE TABLE b (id INT PRIMARY KEY);
        CREATE TABLE c (id INT PRIMARY KEY);
        CREATE TABLE d (id INT PRIMARY KEY);
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      for (const table of result.tables) {
        expect(table.position).toBeDefined()
        expect(typeof table.position.x).toBe('number')
        expect(typeof table.position.y).toBe('number')
      }
      expect(nth(result.tables, 0).position.y).toBe(0)
      expect(nth(result.tables, 3).position.y).toBe(550)
    })

    it('returns empty result for empty input', () => {
      const result = parseSqlDdl('', 'postgresql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(0)
      expect(result.relationships).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('returns empty result for input with only comments', () => {
      const sql = `
        -- Just a comment
        /* Another comment */
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      expect(result.tables).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('handles CHAR(36) as UUID', () => {
      const sql = `CREATE TABLE t (guid CHAR(36));`
      const result = parseSqlDdl(sql, 'mysql', createSequentialIdMinters())
      expect(nth(nth(result.tables, 0).columns, 0).type).toBe('UUID')
    })

    it('sets FK column constraints.isForeignKey to true', () => {
      const sql = `
        CREATE TABLE users (id INT PRIMARY KEY);
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `
      const result = parseSqlDdl(sql, 'postgresql', createSequentialIdMinters())
      const postsTable = result.tables.find((t) => t.name === 'posts')
      const fkCol = postsTable?.columns.find((c) => c.name === 'user_id')
      expect(fkCol?.constraints.isForeignKey).toBe(true)
    })
  })
})
