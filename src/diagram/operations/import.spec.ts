import { describe, expect, it } from 'vitest'
import { importFromJsonSchema, importFromSql } from './import'
import { createInitialDocument } from '../state'

const SQL_FIXTURE = `
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE
);
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id)
);
`

const JSON_SCHEMA_FIXTURE = JSON.stringify({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
      },
      required: ['id'],
    },
  },
})

describe('importFromSql', () => {
  it('replaces structural state with parsed tables', () => {
    const { document, result } = importFromSql(createInitialDocument(), SQL_FIXTURE, 'postgresql')
    expect(result.tableCount).toBeGreaterThan(0)
    expect(Object.keys(document.tables)).toHaveLength(result.tableCount)
  })

  it('returns errors and leaves document unchanged on parse failure', () => {
    const initial = createInitialDocument()
    const { document, result } = importFromSql(initial, 'not sql', 'postgresql')
    expect(result.tableCount).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(document).toBe(initial)
  })
})

describe('importFromJsonSchema', () => {
  it('replaces structural state with parsed tables', () => {
    const { document, result } = importFromJsonSchema(createInitialDocument(), JSON_SCHEMA_FIXTURE)
    expect(result.tableCount).toBeGreaterThan(0)
    expect(Object.keys(document.tables)).toHaveLength(result.tableCount)
  })

  it('returns errors and leaves document unchanged on parse failure', () => {
    const initial = createInitialDocument()
    const { document, result } = importFromJsonSchema(initial, '{ not valid json')
    expect(result.tableCount).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(document).toBe(initial)
  })
})
