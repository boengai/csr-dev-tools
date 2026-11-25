import { render, screen } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { JsonSchemaValidator } from './JsonSchemaValidator'

const STORAGE_KEY = 'csr-dev-tools-json-schema-validator'

const SCHEMA = '{"type": "object", "required": ["name"]}'

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')

beforeAll(() => {
  // CodeMirror measures text ranges; jsdom has no layout.
  Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
})

beforeEach(() => {
  localStorage.clear()
})

describe('JsonSchemaValidator — saved input', () => {
  it('moves a bag saved before the shell to the current fields and validates it', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: '{"name":"Ada"}', jsonSchema: SCHEMA }))
    render(<JsonSchemaValidator autoOpen />)

    expect((await screen.findByRole('status')).textContent).toMatch(/^Valid/)
    expect(saved()).toEqual({ schema: SCHEMA, source: '{"name":"Ada"}' })
  })

  it.each([
    ['a schema without data', { jsonData: '', jsonSchema: SCHEMA }, { schema: SCHEMA, source: '' }],
    ['data without a schema', { jsonData: '{}', jsonSchema: '' }, { schema: '', source: '{}' }],
    [
      'old fields beside current ones, which win',
      { jsonData: 'old', jsonSchema: 'old', schema: SCHEMA, source: '{}' },
      { schema: SCHEMA, source: '{}' },
    ],
  ])('moves %s', (_case, stored, expected) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    render(<JsonSchemaValidator autoOpen />)

    expect(saved()).toEqual(expected)
  })

  it('keeps a schema saved without any data, and opening it writes nothing', () => {
    const stored = JSON.stringify({ schema: SCHEMA })
    localStorage.setItem(STORAGE_KEY, stored)
    // Unmounting flushes a pending write.
    render(<JsonSchemaValidator autoOpen />).unmount()

    expect(localStorage.getItem(STORAGE_KEY)).toBe(stored)
  })

  it('writes nothing when nothing is saved', () => {
    render(<JsonSchemaValidator autoOpen />).unmount()

    expect(localStorage.length).toBe(0)
  })
})
