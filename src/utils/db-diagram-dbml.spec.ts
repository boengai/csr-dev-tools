import { describe, expect, it } from 'vitest'

import type { DiagramSchema } from '@/types'

import { generateDbml, parseDbml } from './db-diagram-dbml'

describe('generateDbml', () => {
  it('returns empty string for empty schema', () => {
    expect(generateDbml({ relationships: [], tables: [] })).toBe('')
  })

  it('generates a single table', () => {
    const schema: DiagramSchema = {
      relationships: [],
      tables: [
        {
          columns: [
            { constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true }, id: 'c1', name: 'id', type: 'SERIAL' },
            { constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false }, id: 'c2', name: 'name', type: 'VARCHAR' },
          ],
          id: 't1',
          name: 'users',
          position: { x: 0, y: 0 },
        },
      ],
    }

    const result = generateDbml(schema)
    expect(result).toContain('Table users {')
    expect(result).toContain('  id serial [pk]')
    expect(result).toContain('  name varchar [not null]')
    expect(result).toContain('}')
  })

  it('generates nullable and unique constraints', () => {
    const schema: DiagramSchema = {
      relationships: [],
      tables: [
        {
          columns: [
            { constraints: { isForeignKey: false, isNullable: true, isPrimaryKey: false, isUnique: false }, id: 'c1', name: 'bio', type: 'TEXT' },
            { constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: true }, id: 'c2', name: 'email', type: 'VARCHAR' },
          ],
          id: 't1',
          name: 'profiles',
          position: { x: 0, y: 0 },
        },
      ],
    }

    const result = generateDbml(schema)
    expect(result).toContain('  bio text [null]')
    expect(result).toContain('  email varchar [unique, not null]')
  })

  it('generates relationships', () => {
    const schema: DiagramSchema = {
      relationships: [
        { id: 'r1', relationType: '1:N', sourceColumnId: 'c1', sourceTableId: 't1', targetColumnId: 'c3', targetTableId: 't2' },
        { id: 'r2', relationType: '1:1', sourceColumnId: 'c1', sourceTableId: 't1', targetColumnId: 'c4', targetTableId: 't2' },
      ],
      tables: [
        {
          columns: [{ constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true }, id: 'c1', name: 'id', type: 'SERIAL' }],
          id: 't1',
          name: 'users',
          position: { x: 0, y: 0 },
        },
        {
          columns: [
            { constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true }, id: 'c2', name: 'id', type: 'SERIAL' },
            { constraints: { isForeignKey: true, isNullable: false, isPrimaryKey: false, isUnique: false }, id: 'c3', name: 'user_id', type: 'INT' },
            { constraints: { isForeignKey: true, isNullable: false, isPrimaryKey: false, isUnique: true }, id: 'c4', name: 'profile_id', type: 'INT' },
          ],
          id: 't2',
          name: 'posts',
          position: { x: 300, y: 0 },
        },
      ],
    }

    const result = generateDbml(schema)
    expect(result).toContain('Ref: users.id < posts.user_id')
    expect(result).toContain('Ref: users.id - posts.profile_id')
  })

  it('generates N:M relationship', () => {
    const schema: DiagramSchema = {
      relationships: [
        { id: 'r1', relationType: 'N:M', sourceColumnId: 'c1', sourceTableId: 't1', targetColumnId: 'c2', targetTableId: 't2' },
      ],
      tables: [
        {
          columns: [{ constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true }, id: 'c1', name: 'id', type: 'INT' }],
          id: 't1',
          name: 'tags',
          position: { x: 0, y: 0 },
        },
        {
          columns: [{ constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true }, id: 'c2', name: 'id', type: 'INT' }],
          id: 't2',
          name: 'posts',
          position: { x: 300, y: 0 },
        },
      ],
    }

    const result = generateDbml(schema)
    expect(result).toContain('Ref: tags.id <> posts.id')
  })
})

describe('parseDbml', () => {
  it('returns empty result for empty input', () => {
    const result = parseDbml('')
    expect(result.tables).toHaveLength(0)
    expect(result.relationships).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('parses a single table with columns', () => {
    const dbml = `Table users {
  id serial [pk]
  name varchar [not null]
  bio text [null]
}`
    const result = parseDbml(dbml)
    expect(result.errors).toHaveLength(0)
    expect(result.tables).toHaveLength(1)
    expect(result.tables[0].name).toBe('users')
    expect(result.tables[0].columns).toHaveLength(3)
    expect(result.tables[0].columns[0].name).toBe('id')
    expect(result.tables[0].columns[0].type).toBe('SERIAL')
    expect(result.tables[0].columns[0].constraints.isPrimaryKey).toBe(true)
    expect(result.tables[0].columns[1].name).toBe('name')
    expect(result.tables[0].columns[1].constraints.isNullable).toBe(false)
    expect(result.tables[0].columns[2].name).toBe('bio')
    expect(result.tables[0].columns[2].constraints.isNullable).toBe(true)
  })

  it('parses unique constraint', () => {
    const dbml = `Table users {
  email varchar [unique]
}`
    const result = parseDbml(dbml)
    expect(result.tables[0].columns[0].constraints.isUnique).toBe(true)
  })

  it('parses standalone Ref lines', () => {
    const dbml = `Table users {
  id int [pk]
}

Table posts {
  id int [pk]
  user_id int [not null]
}

Ref: users.id < posts.user_id`

    const result = parseDbml(dbml)
    expect(result.errors).toHaveLength(0)
    expect(result.relationships).toHaveLength(1)
    expect(result.relationships[0].relationType).toBe('1:N')
  })

  it('parses 1:1 relationship', () => {
    const dbml = `Table users {
  id int [pk]
}

Table profiles {
  user_id int [pk]
}

Ref: users.id - profiles.user_id`

    const result = parseDbml(dbml)
    expect(result.relationships).toHaveLength(1)
    expect(result.relationships[0].relationType).toBe('1:1')
  })

  it('parses N:M relationship', () => {
    const dbml = `Table tags {
  id int [pk]
}

Table posts {
  id int [pk]
}

Ref: tags.id <> posts.id`

    const result = parseDbml(dbml)
    expect(result.relationships).toHaveLength(1)
    expect(result.relationships[0].relationType).toBe('N:M')
  })

  it('parses reversed > ref direction', () => {
    const dbml = `Table users {
  id int [pk]
}

Table posts {
  user_id int [not null]
}

Ref: posts.user_id > users.id`

    const result = parseDbml(dbml)
    expect(result.relationships).toHaveLength(1)
    expect(result.relationships[0].relationType).toBe('1:N')
    // Source should be users (the "one" side)
    const sourceTable = result.tables.find((t) => t.id === result.relationships[0].sourceTableId)
    expect(sourceTable?.name).toBe('users')
  })

  it('reports error for unclosed table block', () => {
    const dbml = `Table users {
  id int [pk]
  name varchar`

    const result = parseDbml(dbml)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.message.includes('Unclosed'))).toBe(true)
    // Should still parse the table
    expect(result.tables).toHaveLength(1)
  })

  it('reports error for unknown column type', () => {
    const dbml = `Table users {
  id serial [pk]
  data unknowntype
}`
    const result = parseDbml(dbml)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.message.includes('Unknown type'))).toBe(true)
  })

  it('reports error for invalid Ref syntax', () => {
    const dbml = `Ref: broken syntax`
    const result = parseDbml(dbml)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.message.includes('Invalid Ref'))).toBe(true)
  })

  it('skips comments', () => {
    const dbml = `// This is a comment
Table users {
  id int [pk]
  // Another comment
  name varchar
}`
    const result = parseDbml(dbml)
    expect(result.errors).toHaveLength(0)
    expect(result.tables).toHaveLength(1)
    expect(result.tables[0].columns).toHaveLength(2)
  })

  it('parses multiple tables', () => {
    const dbml = `Table users {
  id int [pk]
}

Table posts {
  id int [pk]
  user_id int [not null]
}`

    const result = parseDbml(dbml)
    expect(result.tables).toHaveLength(2)
    expect(result.tables[0].name).toBe('users')
    expect(result.tables[1].name).toBe('posts')
  })

  it('assigns grid layout positions to tables', () => {
    const dbml = `Table a {
  id int [pk]
}

Table b {
  id int [pk]
}

Table c {
  id int [pk]
}

Table d {
  id int [pk]
}`

    const result = parseDbml(dbml)
    // All tables should have distinct positions
    const positions = result.tables.map((t) => `${t.position.x},${t.position.y}`)
    const uniquePositions = new Set(positions)
    expect(uniquePositions.size).toBe(4)
  })

  it('parses inline ref constraint', () => {
    const dbml = `Table users {
  id int [pk]
}

Table posts {
  id int [pk]
  user_id int [ref: > users.id]
}`

    const result = parseDbml(dbml)
    expect(result.relationships).toHaveLength(1)
    expect(result.relationships[0].relationType).toBe('1:N')
  })
})

describe('round-trip', () => {
  it('generate → parse produces equivalent schema', () => {
    const original: DiagramSchema = {
      relationships: [
        { id: 'r1', relationType: '1:N', sourceColumnId: 'c1', sourceTableId: 't1', targetColumnId: 'c3', targetTableId: 't2' },
      ],
      tables: [
        {
          columns: [
            { constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true }, id: 'c1', name: 'id', type: 'SERIAL' },
            { constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false }, id: 'c2', name: 'name', type: 'VARCHAR' },
          ],
          id: 't1',
          name: 'users',
          position: { x: 0, y: 0 },
        },
        {
          columns: [
            { constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true }, id: 'c2b', name: 'id', type: 'SERIAL' },
            { constraints: { isForeignKey: true, isNullable: false, isPrimaryKey: false, isUnique: false }, id: 'c3', name: 'user_id', type: 'INT' },
          ],
          id: 't2',
          name: 'posts',
          position: { x: 300, y: 0 },
        },
      ],
    }

    const dbml = generateDbml(original)
    const parsed = parseDbml(dbml)

    expect(parsed.errors).toHaveLength(0)
    expect(parsed.tables).toHaveLength(2)
    expect(parsed.tables[0].name).toBe('users')
    expect(parsed.tables[1].name).toBe('posts')
    expect(parsed.tables[0].columns).toHaveLength(2)
    expect(parsed.tables[1].columns).toHaveLength(2)
    expect(parsed.relationships).toHaveLength(1)
    expect(parsed.relationships[0].relationType).toBe('1:N')

    // Re-generate from parsed result
    const regenerated = generateDbml(parsed)
    expect(regenerated).toContain('Table users {')
    expect(regenerated).toContain('Table posts {')
    expect(regenerated).toContain('Ref:')
  })
})
