import { describe, expect, it } from 'vitest'

import type { ColumnType } from '@/types'

import { parseSqlDdl } from './db-diagram-import'

describe('db-diagram-import', () => {
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
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables).toHaveLength(1)
      expect(result.tables[0].name).toBe('users')
      expect(result.tables[0].columns).toHaveLength(4)
      expect(result.errors).toHaveLength(0)

      const idCol = result.tables[0].columns.find((c) => c.name === 'id')
      expect(idCol?.type).toBe('INT')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
      expect(idCol?.constraints.isNullable).toBe(false)

      const nameCol = result.tables[0].columns.find((c) => c.name === 'name')
      expect(nameCol?.type).toBe('VARCHAR')
      expect(nameCol?.constraints.isNullable).toBe(true)

      const emailCol = result.tables[0].columns.find((c) => c.name === 'email')
      expect(emailCol?.type).toBe('TEXT')
      expect(emailCol?.constraints.isNullable).toBe(false)

      const activeCol = result.tables[0].columns.find((c) => c.name === 'active')
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
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables).toHaveLength(3)
      expect(result.tables.map((t) => t.name)).toEqual(['users', 'posts', 'comments'])
    })

    it('extracts PRIMARY KEY inline constraint', () => {
      const sql = `CREATE TABLE t (id INT PRIMARY KEY, name TEXT);`
      const result = parseSqlDdl(sql, 'postgresql')
      const idCol = result.tables[0].columns.find((c) => c.name === 'id')
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
      const result = parseSqlDdl(sql, 'postgresql')
      const idCol = result.tables[0].columns.find((c) => c.name === 'id')
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
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.relationships).toHaveLength(1)
      const rel = result.relationships[0]
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
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].relationType).toBe('1:1')
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
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].relationType).toBe('1:1')
    })

    it('handles MySQL AUTO_INCREMENT syntax', () => {
      const sql = `
        CREATE TABLE users (
          id INT NOT NULL AUTO_INCREMENT,
          name VARCHAR(255),
          PRIMARY KEY (id)
        ) ENGINE=InnoDB;
      `
      const result = parseSqlDdl(sql, 'mysql')
      expect(result.tables).toHaveLength(1)
      const idCol = result.tables[0].columns.find((c) => c.name === 'id')
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
      const result = parseSqlDdl(sql, 'postgresql')
      const idCol = result.tables[0].columns.find((c) => c.name === 'id')
      expect(idCol?.type).toBe('SERIAL')
      expect(idCol?.constraints.isPrimaryKey).toBe(true)
    })

    it('handles PostgreSQL BIGSERIAL syntax', () => {
      const sql = `
        CREATE TABLE events (
          id BIGSERIAL PRIMARY KEY
        );
      `
      const result = parseSqlDdl(sql, 'postgresql')
      const idCol = result.tables[0].columns.find((c) => c.name === 'id')
      expect(idCol?.type).toBe('BIGINT')
    })

    it('handles SQLite AUTOINCREMENT syntax', () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT
        );
      `
      const result = parseSqlDdl(sql, 'sqlite')
      const idCol = result.tables[0].columns.find((c) => c.name === 'id')
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
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables).toHaveLength(1)
      expect(result.tables[0].columns).toHaveLength(2)
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
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables).toHaveLength(1)
      expect(result.tables[0].columns).toHaveLength(2)
    })

    it('handles IF NOT EXISTS', () => {
      const sql = `CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY);`
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables).toHaveLength(1)
      expect(result.tables[0].name).toBe('users')
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
      const result = parseSqlDdl(sql, 'postgresql')
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
        const result = parseSqlDdl(sql, 'postgresql')
        expect(result.tables[0].columns[0].type).toBe(expected)
      }
    })

    it('handles TINYINT(1) as BOOLEAN in MySQL', () => {
      const sql = `CREATE TABLE t (active TINYINT(1));`
      const result = parseSqlDdl(sql, 'mysql')
      expect(result.tables[0].columns[0].type).toBe('BOOLEAN')
    })

    it('handles UNIQUE constraint on columns', () => {
      const sql = `CREATE TABLE t (email VARCHAR(255) UNIQUE);`
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables[0].columns[0].constraints.isUnique).toBe(true)
    })

    it('handles inline REFERENCES syntax', () => {
      const sql = `
        CREATE TABLE users (id INT PRIMARY KEY);
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT REFERENCES users(id)
        );
      `
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].relationType).toBe('1:N')
    })

    it('handles DEFAULT clause (strips it)', () => {
      const sql = `
        CREATE TABLE t (
          status VARCHAR(20) DEFAULT 'active',
          count INT DEFAULT 0
        );
      `
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables[0].columns).toHaveLength(2)
      expect(result.tables[0].columns[0].name).toBe('status')
      expect(result.tables[0].columns[1].name).toBe('count')
    })

    it('handles quoted table and column names', () => {
      const sql = `CREATE TABLE "my_table" ("my_col" INT PRIMARY KEY);`
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables[0].name).toBe('my_table')
      expect(result.tables[0].columns[0].name).toBe('my_col')
    })

    it('handles backtick-quoted names (MySQL)', () => {
      const sql = 'CREATE TABLE `users` (`id` INT PRIMARY KEY);'
      const result = parseSqlDdl(sql, 'mysql')
      expect(result.tables[0].name).toBe('users')
      expect(result.tables[0].columns[0].name).toBe('id')
    })

    it('auto-layouts tables in a grid pattern', () => {
      const sql = `
        CREATE TABLE a (id INT PRIMARY KEY);
        CREATE TABLE b (id INT PRIMARY KEY);
        CREATE TABLE c (id INT PRIMARY KEY);
        CREATE TABLE d (id INT PRIMARY KEY);
      `
      const result = parseSqlDdl(sql, 'postgresql')
      // 3 columns wide, each table should have a position
      for (const table of result.tables) {
        expect(table.position).toBeDefined()
        expect(typeof table.position.x).toBe('number')
        expect(typeof table.position.y).toBe('number')
      }
      // First 3 tables should be on row 0, 4th on row 1
      expect(result.tables[0].position.y).toBe(0)
      expect(result.tables[3].position.y).toBe(250)
    })

    it('returns empty result for empty input', () => {
      const result = parseSqlDdl('', 'postgresql')
      expect(result.tables).toHaveLength(0)
      expect(result.relationships).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('returns empty result for input with only comments', () => {
      const sql = `
        -- Just a comment
        /* Another comment */
      `
      const result = parseSqlDdl(sql, 'postgresql')
      expect(result.tables).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('handles CHAR(36) as UUID', () => {
      const sql = `CREATE TABLE t (guid CHAR(36));`
      const result = parseSqlDdl(sql, 'mysql')
      expect(result.tables[0].columns[0].type).toBe('UUID')
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
      const result = parseSqlDdl(sql, 'postgresql')
      const postsTable = result.tables.find((t) => t.name === 'posts')
      const fkCol = postsTable?.columns.find((c) => c.name === 'user_id')
      expect(fkCol?.constraints.isForeignKey).toBe(true)
    })
  })
})
