import { describe, expect, it } from 'vitest'

import type { ProtobufEnumInfo, ProtobufFieldInfo, ProtobufMessageInfo, ProtobufSchemaInfo } from '@/types'

import { annotateJsonWithEnums, buildBrowsableEntries, collectAllEnumsFlat } from './protobuf-to-json'

const field = (overrides: Partial<ProtobufFieldInfo> & Pick<ProtobufFieldInfo, 'name'>): ProtobufFieldInfo => ({
  description: null,
  id: 1,
  isMap: false,
  resolvedKind: 'scalar',
  resolvedTypeName: null,
  rule: undefined,
  type: 'string',
  ...overrides,
})

const message = (
  overrides: Partial<ProtobufMessageInfo> & Pick<ProtobufMessageInfo, 'fullName' | 'name'>,
): ProtobufMessageInfo => ({
  fields: [],
  nestedEnums: [],
  nestedMessages: [],
  oneofs: [],
  ...overrides,
})

const statusEnum: ProtobufEnumInfo = {
  fullName: '.ex.Person.Status',
  name: 'Status',
  values: { ACTIVE: 1, UNKNOWN: 0 },
}
const colorEnum: ProtobufEnumInfo = {
  fullName: '.ex.Color',
  name: 'Color',
  values: { RED: 1, UNKNOWN: 0 },
}

const address = message({
  fields: [field({ name: 'country' }), field({ name: 'color', resolvedKind: 'enum', resolvedTypeName: '.ex.Color' })],
  fullName: '.ex.Address',
  name: 'Address',
})

const person = message({
  fields: [
    field({ name: 'name' }),
    field({ name: 'status', resolvedKind: 'enum', resolvedTypeName: '.ex.Person.Status' }),
    field({ name: 'code' }),
    field({ name: 'favorites', resolvedKind: 'enum', resolvedTypeName: '.ex.Color', rule: 'repeated' }),
    field({ name: 'address', resolvedKind: 'message', resolvedTypeName: '.ex.Address' }),
    field({ isMap: true, name: 'metadata' }),
  ],
  fullName: '.ex.Person',
  name: 'Person',
  nestedEnums: [statusEnum],
})

const schema: ProtobufSchemaInfo = {
  enums: [colorEnum],
  messages: [person, address],
  package: 'ex',
  syntax: 'proto3',
}

describe('buildBrowsableEntries', () => {
  it('lists messages and enums (including nested), sorted by name', () => {
    expect(buildBrowsableEntries(schema).map((e) => `${e.kind}:${e.name}`)).toEqual([
      'message:Address',
      'enum:Color',
      'message:Person',
      'enum:Status',
    ])
  })
})

describe('collectAllEnumsFlat', () => {
  it('includes top-level and nested enums', () => {
    expect(collectAllEnumsFlat(schema).map((e) => e.fullName)).toEqual(['.ex.Color', '.ex.Person.Status'])
  })
})

describe('annotateJsonWithEnums', () => {
  const sample = {
    address: { color: 'UNKNOWN', country: '' },
    code: 'USD',
    favorites: ['UNKNOWN'],
    metadata: {},
    name: '',
    status: 'UNKNOWN',
  }

  const lines = annotateJsonWithEnums(sample, person, schema).split('\n')

  it('annotates by field type, not by value name, when enums share a value', () => {
    expect(lines).toContain('  "status": "UNKNOWN" // ACTIVE | UNKNOWN')
    expect(lines).toContain('    "color": "UNKNOWN", // RED | UNKNOWN')
  })

  it('annotates every element of a repeated enum field', () => {
    expect(lines).toContain('    "UNKNOWN" // RED | UNKNOWN')
  })

  it('leaves uppercase strings in non-enum fields alone', () => {
    expect(lines).toContain('  "code": "USD",')
  })

  it('matches JSON.stringify output once the hints are stripped', () => {
    const stripped = lines.map((l) => l.replace(/ \/\/ .*$/, '')).join('\n')
    expect(stripped).toBe(JSON.stringify(sample, null, 2))
  })
})
