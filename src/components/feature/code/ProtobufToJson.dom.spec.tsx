/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProtobufMessageInfo, ProtobufParseResult } from '@/types'
import * as parsers from '@/wasm/parsers'

import { ProtobufToJson } from './ProtobufToJson'

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
  }
})

// Schema text is irrelevant to the mocked parser — it always returns one
// message `Person` (with an enum field) plus a top-level enum `Color`.
const parsed = (): ProtobufParseResult => {
  const person: ProtobufMessageInfo = {
    fields: [
      {
        description: null,
        id: 1,
        isMap: false,
        name: 'status',
        resolvedKind: 'enum',
        resolvedTypeName: '.Status',
        rule: undefined,
        type: 'Status',
      },
    ],
    fullName: '.Person',
    name: 'Person',
    nestedEnums: [],
    nestedMessages: [],
    oneofs: [],
  }
  return {
    schema: {
      enums: [
        { fullName: '.Color', name: 'Color', values: { RED: 0 } },
        { fullName: '.Status', name: 'Status', values: { ACTIVE: 1, UNKNOWN: 0 } },
      ],
      messages: [person],
      package: null,
      syntax: 'proto3',
    },
    success: true,
  }
}

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 4; i++) {
      await vi.runAllTimersAsync()
      await vi.dynamicImportSettled()
    }
  })
}

const writeText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('csr-dev-tools-protobuf-to-json-input', JSON.stringify('message Person {}'))
  vi.useFakeTimers()
  vi.mocked(parsers.parseProtobufSchema).mockImplementation(async () => parsed())
  vi.mocked(parsers.generateSampleJson).mockResolvedValue({ status: 'UNKNOWN' })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const openTool = async () => {
  render(<ProtobufToJson autoOpen />)
  await flush()
}

describe('ProtobufToJson', () => {
  it('keeps the selection (and its JSON) across a reparse', async () => {
    await openTool()
    fireEvent.click(screen.getByRole('button', { name: 'Person - Message type' }))
    await flush()
    await vi.waitFor(() => expect(screen.getByText(/"status": "UNKNOWN"/)).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Proto definition input'), { target: { value: 'message Person { }' } })
    await flush()

    expect(screen.getByRole('button', { name: 'Person - Message type' })).toHaveAttribute('aria-current', 'true')
    await vi.waitFor(() => expect(screen.getByText(/"status": "UNKNOWN"/)).toBeInTheDocument())
  })

  it('keeps the detail pane on the selected message while a reparse regenerates its sample', async () => {
    await openTool()
    fireEvent.click(screen.getByRole('button', { name: 'Person - Message type' }))
    await flush()
    await vi.waitFor(() => expect(screen.getByText(/"status": "UNKNOWN"/)).toBeInTheDocument())

    // The regenerated sample for the reparsed (new-identity) message is still pending.
    let resolveSample: (v: Record<string, unknown>) => void = () => {}
    vi.mocked(parsers.generateSampleJson).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSample = resolve
        }),
    )
    fireEvent.change(screen.getByLabelText('Proto definition input'), { target: { value: 'message Person { }' } })
    await flush()

    expect(screen.queryByText(/Select a message from the list/)).not.toBeInTheDocument()
    expect(screen.getByText(/"status": "UNKNOWN"/)).toBeInTheDocument()

    await act(async () => {
      resolveSample({ status: 'ACTIVE' })
    })
    await flush()
    expect(screen.getByText(/"status": "ACTIVE"/)).toBeInTheDocument()
  })

  it('annotates a pending-regeneration sample with the schema it came from when the message changes shape', async () => {
    await openTool()
    fireEvent.click(screen.getByRole('button', { name: 'Person - Message type' }))
    await flush()
    await vi.waitFor(() => expect(screen.getByText(/\/\/ ACTIVE \| UNKNOWN/)).toBeInTheDocument())

    // Reparse: Person gains a `color` enum field; its regenerated sample is pending.
    vi.mocked(parsers.parseProtobufSchema).mockImplementation(async () => {
      const result = parsed()
      if (!result.success) return result
      result.schema.messages[0].fields.push({
        description: null,
        id: 2,
        isMap: false,
        name: 'color',
        resolvedKind: 'enum',
        resolvedTypeName: '.Color',
        rule: undefined,
        type: 'Color',
      })
      return result
    })
    let resolveSample: (v: Record<string, unknown>) => void = () => {}
    vi.mocked(parsers.generateSampleJson).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSample = resolve
        }),
    )
    fireEvent.change(screen.getByLabelText('Proto definition input'), {
      target: { value: 'message Person { Color c = 2; }' },
    })
    await flush()

    expect(screen.getByText(/\/\/ ACTIVE \| UNKNOWN/)).toBeInTheDocument()
    expect(screen.queryByText(/\/\/ RED/)).not.toBeInTheDocument()

    await act(async () => {
      resolveSample({ color: 'RED', status: 'ACTIVE' })
    })
    await flush()
    expect(screen.getByText(/"color": "RED", \/\/ RED/)).toBeInTheDocument()
  })

  it('drops a late message sample when an enum was selected in the meantime', async () => {
    let resolveSample: (v: Record<string, unknown>) => void = () => {}
    vi.mocked(parsers.generateSampleJson).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSample = resolve
        }),
    )
    await openTool()

    fireEvent.click(screen.getByRole('button', { name: 'Person - Message type' }))
    await flush()
    fireEvent.click(screen.getByRole('button', { name: 'Color - Enum type' }))
    await flush()

    await act(async () => {
      resolveSample({ status: 'LATE' })
    })
    await flush()

    expect(screen.queryByText(/LATE/)).not.toBeInTheDocument()
    expect(screen.getByText(/"name": "Color"/)).toBeInTheDocument()
  })

  it('annotates enum fields in the view but copies plain, valid JSON', async () => {
    await openTool()
    fireEvent.click(screen.getByRole('button', { name: 'Person - Message type' }))
    await flush()
    await vi.waitFor(() => expect(screen.getByText(/\/\/ ACTIVE \| UNKNOWN/)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Copy Copy JSON to clipboard' }))
    await flush()

    expect(writeText).toHaveBeenCalledOnce()
    const copied = writeText.mock.calls[0][0] as string
    expect(JSON.parse(copied)).toEqual({ status: 'UNKNOWN' })
  })
})
