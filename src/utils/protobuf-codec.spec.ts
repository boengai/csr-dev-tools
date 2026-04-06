import { describe, expect, it } from 'vitest'

import { detectProtobufFormat, decodeProtobuf, encodeProtobuf } from './protobuf-codec'

const SIMPLE_PROTO = `
syntax = "proto3";

message SimpleMessage {
  string name = 1;
  int32 age = 2;
  bool active = 3;
}
`

const NESTED_PROTO = `
syntax = "proto3";

message Outer {
  string label = 1;
  Inner inner = 2;
}

message Inner {
  int32 value = 1;
  string text = 2;
}
`

const ENUM_PROTO = `
syntax = "proto3";

message WithEnum {
  string name = 1;
  Status status = 2;
}

enum Status {
  UNKNOWN = 0;
  ACTIVE = 1;
  INACTIVE = 2;
}
`

describe('protobuf-codec', () => {
  describe('encodeProtobuf', () => {
    it('encodes simple message to base64', async () => {
      const json = { name: 'Alice', age: 30, active: true }
      const result = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', JSON.stringify(json), 'base64')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBeTruthy()
        expect(typeof result.output).toBe('string')
      }
    })

    it('encodes simple message to hex', async () => {
      const json = { name: 'Alice', age: 30, active: true }
      const result = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', JSON.stringify(json), 'hex')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toMatch(/^[0-9a-f]+$/)
      }
    })

    it('encodes simple message to raw binary', async () => {
      const json = { name: 'Alice', age: 30, active: true }
      const result = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', JSON.stringify(json), 'raw')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toContain('Alice')
        expect(result.output.length).toBeGreaterThan(0)
      }
    })

    it('encodes nested message', async () => {
      const json = { label: 'test', inner: { value: 42, text: 'hello' } }
      const result = await encodeProtobuf(NESTED_PROTO, 'Outer', JSON.stringify(json), 'base64')

      expect(result.success).toBe(true)
    })

    it('encodes message with enum', async () => {
      const json = { name: 'Bob', status: 1 }
      const result = await encodeProtobuf(ENUM_PROTO, 'WithEnum', JSON.stringify(json), 'base64')

      expect(result.success).toBe(true)
    })
  })

  describe('decodeProtobuf', () => {
    it('decodes base64 to JSON for simple message', async () => {
      const json = { name: 'Alice', age: 30, active: true }
      const encoded = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', JSON.stringify(json), 'base64')
      expect(encoded.success).toBe(true)
      if (!encoded.success) return

      const decoded = await decodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', encoded.output, 'base64')
      expect(decoded.success).toBe(true)
      if (decoded.success) {
        const parsed = JSON.parse(decoded.output)
        expect(parsed.name).toBe('Alice')
        expect(parsed.age).toBe(30)
        expect(parsed.active).toBe(true)
      }
    })

    it('decodes hex to JSON for simple message', async () => {
      const json = { name: 'Alice', age: 30, active: true }
      const encoded = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', JSON.stringify(json), 'hex')
      expect(encoded.success).toBe(true)
      if (!encoded.success) return

      const decoded = await decodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', encoded.output, 'hex')
      expect(decoded.success).toBe(true)
      if (decoded.success) {
        const parsed = JSON.parse(decoded.output)
        expect(parsed.name).toBe('Alice')
      }
    })

    it('decodes text to JSON for simple message', async () => {
      const json = { name: 'Alice', age: 30, active: true }
      const encoded = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', JSON.stringify(json), 'raw')
      expect(encoded.success).toBe(true)
      if (!encoded.success) return

      const decoded = await decodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', encoded.output, 'raw')
      expect(decoded.success).toBe(true)
      if (decoded.success) {
        const parsed = JSON.parse(decoded.output)
        expect(parsed.name).toBe('Alice')
      }
    })

    it('decodes nested message', async () => {
      const json = { label: 'test', inner: { value: 42, text: 'hello' } }
      const encoded = await encodeProtobuf(NESTED_PROTO, 'Outer', JSON.stringify(json), 'base64')
      expect(encoded.success).toBe(true)
      if (!encoded.success) return

      const decoded = await decodeProtobuf(NESTED_PROTO, 'Outer', encoded.output, 'base64')
      expect(decoded.success).toBe(true)
      if (decoded.success) {
        const parsed = JSON.parse(decoded.output)
        expect(parsed.label).toBe('test')
        expect(parsed.inner.value).toBe(42)
        expect(parsed.inner.text).toBe('hello')
      }
    })
  })

  describe('round-trip', () => {
    it('encode then decode produces original JSON (simple)', async () => {
      const json = { name: 'Charlie', age: 25, active: false }

      for (const format of ['base64', 'hex', 'raw'] as const) {
        const encoded = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', JSON.stringify(json), format)
        expect(encoded.success).toBe(true)
        if (!encoded.success) continue

        const decoded = await decodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', encoded.output, format)
        expect(decoded.success).toBe(true)
        if (!decoded.success) continue

        const parsed = JSON.parse(decoded.output)
        expect(parsed.name).toBe('Charlie')
        expect(parsed.age).toBe(25)
        expect(parsed.active).toBe(false)
      }
    })

    it('encode then decode produces original JSON (nested)', async () => {
      const json = { label: 'round-trip', inner: { value: 99, text: 'data' } }

      const encoded = await encodeProtobuf(NESTED_PROTO, 'Outer', JSON.stringify(json), 'base64')
      expect(encoded.success).toBe(true)
      if (!encoded.success) return

      const decoded = await decodeProtobuf(NESTED_PROTO, 'Outer', encoded.output, 'base64')
      expect(decoded.success).toBe(true)
      if (!decoded.success) return

      const parsed = JSON.parse(decoded.output)
      expect(parsed).toEqual(json)
    })
  })

  describe('detectProtobufFormat', () => {
    it('detects valid base64 string', async () => {
      const input = btoa('hello world')
      const result = await detectProtobufFormat(input)
      expect(result).toBe('base64')
    })

    it('detects valid hex string', async () => {
      const result = await detectProtobufFormat('0a05416c69636510011801')
      expect(result).toBe('hex')
    })

    it('detects raw binary (non-text bytes)', async () => {
      const raw = String.fromCharCode(0x0a, 0x05, 0x41, 0x6c, 0x69, 0x63, 0x65, 0x10, 0x1e, 0x18, 0x01)
      const result = await detectProtobufFormat(raw)
      expect(result).toBe('raw')
    })

    it('detects base64 with padding', async () => {
      const result = await detectProtobufFormat('SGVsbG8gV29ybGQ=')
      expect(result).toBe('base64')
    })

    it('detects base64 without padding', async () => {
      const result = await detectProtobufFormat('SGVsbG8gV29ybGQ')
      expect(result).toBe('base64')
    })

    it('returns raw for empty string', async () => {
      const result = await detectProtobufFormat('')
      expect(result).toBe('raw')
    })
  })

  describe('error cases', () => {
    it('returns error for invalid schema', async () => {
      const result = await encodeProtobuf('not valid proto', 'Foo', '{}', 'base64')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('returns error for non-existent message type', async () => {
      const result = await encodeProtobuf(SIMPLE_PROTO, 'NonExistent', '{}', 'base64')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('NonExistent')
      }
    })

    it('returns error for invalid JSON in encode', async () => {
      const result = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', 'not json', 'base64')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('handles JSON/schema mismatch without crashing', async () => {
      const result = await encodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', JSON.stringify({ name: 123 }), 'base64')
      // protobufjs coerces number→string for string fields, so this succeeds
      // Verify it produces a result either way (coerced success or validation error)
      if (result.success) {
        expect(result.output).toBeTruthy()
      } else {
        expect(result.error).toBeTruthy()
      }
    })

    it('returns error for malformed base64 in decode', async () => {
      const result = await decodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', '!!!not-base64!!!', 'base64')
      expect(result.success).toBe(false)
    })

    it('returns error for malformed hex in decode', async () => {
      const result = await decodeProtobuf(SIMPLE_PROTO, 'SimpleMessage', 'ZZZZ', 'hex')
      expect(result.success).toBe(false)
    })

    it('returns error for empty schema', async () => {
      const result = await encodeProtobuf('', 'Foo', '{}', 'base64')
      expect(result.success).toBe(false)
    })
  })
})
