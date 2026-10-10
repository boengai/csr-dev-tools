/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProtobufParseResult } from '@/types'
import * as parsers from '@/wasm/parsers'

import { ProtobufCodec } from './ProtobufCodec'

vi.mock('@/wasm/parsers', () => ({
  decodeProtobuf: vi.fn(),
  detectProtobufFormat: vi.fn(),
  encodeProtobuf: vi.fn(),
  generateSampleJson: vi.fn(),
  getTomlParseError: vi.fn(),
  getXmlParseError: vi.fn(),
  getYamlParseError: vi.fn(),
  parseProtobufSchema: vi.fn(),
}))

// CodeMirror and Radix Select don't drive well in jsdom — swap them for
// native elements that honour the same value/onChange contract.
vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>()
  return {
    ...actual,
    CodeInput: ({
      'aria-label': ariaLabel,
      onChange,
      value,
    }: {
      'aria-label'?: string
      onChange: (v: string) => void
      value: string
    }) => <textarea aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)} value={value} />,
    SelectInput: ({
      name,
      onChange,
      options,
      value,
    }: {
      name: string
      onChange: (v: string) => void
      options: Array<{ label: string; value: string }>
      value: string
    }) => (
      <select aria-label={name} onChange={(e) => onChange(e.target.value)} value={value}>
        <option value="">none</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  }
})

const SCHEMA_AB = 'message A { string x = 1; }\nmessage B { string y = 1; }'
const SCHEMA_ABC = `${SCHEMA_AB}\nmessage C { string z = 1; }`

const flush = async () => {
  await act(async () => {
    // Each pipeline hop awaits a dynamic import, so alternate timers and
    // import settling until the chain quiesces.
    for (let i = 0; i < 4; i++) {
      await vi.runAllTimersAsync()
      await vi.dynamicImportSettled()
    }
  })
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.mocked(parsers.parseProtobufSchema).mockImplementation(async (schema: string): Promise<ProtobufParseResult> => ({
    schema: {
      enums: [],
      package: '',
      syntax: 'proto3',
      messages: [...schema.matchAll(/message (\w+)/g)].map(([, name = '']) => ({
        fields: [],
        fullName: name,
        name,
        nestedEnums: [],
        nestedMessages: [],
        oneofs: [],
      })),
    },
    success: true,
  }))
  vi.mocked(parsers.encodeProtobuf).mockImplementation(async (_schema, msgType) => ({
    output: `encoded:${msgType}`,
    success: true,
  }))
  localStorage.setItem(
    'csr-dev-tools-protobuf-codec-input',
    JSON.stringify({
      decodeFormat: 'base64',
      decodeSource: '',
      encodeFormat: 'base64',
      encodeSource: '{"y":"hi"}',
      schema: SCHEMA_AB,
    }),
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('ProtobufCodec — schema edits', () => {
  it('clears the stale output when the schema stops yielding message types', async () => {
    render(<ProtobufCodec />)
    await flush()
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }))
    await flush()
    await vi.waitFor(() => expect(screen.getAllByText('encoded:A').length).toBeGreaterThan(0))

    fireEvent.change(screen.getByLabelText('Proto schema input'), { target: { value: 'syntax = "proto3";' } })
    await flush()

    await vi.waitFor(() => expect(screen.queryAllByText('encoded:A')).toHaveLength(0))
  })

  it('keeps the selected message type and re-encodes with the new schema', async () => {
    render(<ProtobufCodec />)
    await flush()
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }))
    await flush()

    fireEvent.change(screen.getByLabelText('message-type-select'), { target: { value: 'B' } })
    await flush()
    await vi.waitFor(() =>
      expect(vi.mocked(parsers.encodeProtobuf)).toHaveBeenLastCalledWith(SCHEMA_AB, 'B', '{"y":"hi"}', 'base64'),
    )

    fireEvent.change(screen.getByLabelText('Proto schema input'), { target: { value: SCHEMA_ABC } })
    await flush()

    expect(screen.getByLabelText('message-type-select')).toHaveValue('B')
    await vi.waitFor(() =>
      expect(vi.mocked(parsers.encodeProtobuf)).toHaveBeenLastCalledWith(SCHEMA_ABC, 'B', '{"y":"hi"}', 'base64'),
    )
  })

  it('falls back to the first message type when the selected one disappears', async () => {
    render(<ProtobufCodec />)
    await flush()
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }))
    await flush()

    fireEvent.change(screen.getByLabelText('message-type-select'), { target: { value: 'B' } })
    await flush()

    const schemaA = 'message A { string x = 1; }'
    fireEvent.change(screen.getByLabelText('Proto schema input'), { target: { value: schemaA } })
    await flush()

    expect(screen.getByLabelText('message-type-select')).toHaveValue('A')
    await vi.waitFor(() =>
      expect(vi.mocked(parsers.encodeProtobuf)).toHaveBeenLastCalledWith(schemaA, 'A', '{"y":"hi"}', 'base64'),
    )
  })
})
