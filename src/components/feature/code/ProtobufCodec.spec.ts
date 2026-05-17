/**
 * Cross-direction isolation invariant spec for ProtobufCodec.
 *
 * Verifies that `direction="encode"` calls encodeProtobuf (never decodeProtobuf)
 * and that `direction="decode"` calls decodeProtobuf (never encodeProtobuf).
 *
 * Uses vi.mock on '@/wasm/parsers' so no real WASM binary is needed.
 * vi.mock is hoisted by Vitest at the module boundary regardless of source order,
 * so these imports are safe at the top.
 */
import * as parsers from '@/wasm/parsers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DIRECTION_PROFILES } from './ProtobufCodec'

// Mock the wasm parsers module. Each function is a spy so we can assert
// which one was invoked per direction.
vi.mock('@/wasm/parsers', () => ({
  encodeProtobuf: vi.fn(),
  decodeProtobuf: vi.fn(),
  detectProtobufFormat: vi.fn(),
  parseProtobufSchema: vi.fn(),
  generateSampleJson: vi.fn(),
}))

const DUMMY_INPUT = {
  schema: 'syntax = "proto3"; message Foo { string bar = 1; }',
  msgType: 'Foo',
  source: '{"bar":"hello"}',
  format: 'base64' as const,
}

describe('ProtobufCodec direction-profile isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('encode profile', () => {
    it('calls encodeProtobuf when computeFn is invoked', async () => {
      const mockEncode = vi.mocked(parsers.encodeProtobuf)
      mockEncode.mockResolvedValueOnce({ success: true, output: 'dGVzdA==' })

      await DIRECTION_PROFILES.encode.computeFn(DUMMY_INPUT)

      expect(mockEncode).toHaveBeenCalledOnce()
      expect(mockEncode).toHaveBeenCalledWith(
        DUMMY_INPUT.schema,
        DUMMY_INPUT.msgType,
        DUMMY_INPUT.source,
        DUMMY_INPUT.format,
      )
    })

    it('never calls decodeProtobuf when encoding', async () => {
      const mockEncode = vi.mocked(parsers.encodeProtobuf)
      const mockDecode = vi.mocked(parsers.decodeProtobuf)
      mockEncode.mockResolvedValueOnce({ success: true, output: 'dGVzdA==' })

      await DIRECTION_PROFILES.encode.computeFn(DUMMY_INPUT)

      expect(mockDecode).not.toHaveBeenCalled()
    })

    it('throws when encodeProtobuf returns success: false', async () => {
      vi.mocked(parsers.encodeProtobuf).mockResolvedValueOnce({
        success: false,
        error: 'schema error',
      })

      await expect(DIRECTION_PROFILES.encode.computeFn(DUMMY_INPUT)).rejects.toThrow('schema error')
    })

    it('has the correct defaultErrorMsg', () => {
      expect(DIRECTION_PROFILES.encode.defaultErrorMsg).toBe('Failed to encode protobuf')
    })
  })

  describe('decode profile', () => {
    it('calls decodeProtobuf when computeFn is invoked', async () => {
      const mockDecode = vi.mocked(parsers.decodeProtobuf)
      mockDecode.mockResolvedValueOnce({ success: true, output: '{"bar":"hello"}' })

      await DIRECTION_PROFILES.decode.computeFn(DUMMY_INPUT)

      expect(mockDecode).toHaveBeenCalledOnce()
      expect(mockDecode).toHaveBeenCalledWith(
        DUMMY_INPUT.schema,
        DUMMY_INPUT.msgType,
        DUMMY_INPUT.source,
        DUMMY_INPUT.format,
      )
    })

    it('never calls encodeProtobuf when decoding', async () => {
      const mockEncode = vi.mocked(parsers.encodeProtobuf)
      const mockDecode = vi.mocked(parsers.decodeProtobuf)
      mockDecode.mockResolvedValueOnce({ success: true, output: '{"bar":"hello"}' })

      await DIRECTION_PROFILES.decode.computeFn(DUMMY_INPUT)

      expect(mockEncode).not.toHaveBeenCalled()
    })

    it('throws when decodeProtobuf returns success: false', async () => {
      vi.mocked(parsers.decodeProtobuf).mockResolvedValueOnce({
        success: false,
        error: 'decode error',
      })

      await expect(DIRECTION_PROFILES.decode.computeFn(DUMMY_INPUT)).rejects.toThrow('decode error')
    })

    it('has the correct defaultErrorMsg', () => {
      expect(DIRECTION_PROFILES.decode.defaultErrorMsg).toBe('Failed to decode protobuf')
    })
  })

  describe('upload profile', () => {
    it('encode upload accepts JSON files', () => {
      expect(DIRECTION_PROFILES.encode.upload.accept).toBe('.json,application/json')
      expect(DIRECTION_PROFILES.encode.upload.buttonLabel).toBe('Upload JSON')
    })

    it('decode upload accepts binary protobuf files', () => {
      expect(DIRECTION_PROFILES.decode.upload.accept).toBe('.pb,.bin,.txt,.protobuf')
      expect(DIRECTION_PROFILES.decode.upload.buttonLabel).toBe('Upload .pb')
    })
  })

  describe('source input profile', () => {
    it('encode uses CodeInput (kind: code)', () => {
      expect(DIRECTION_PROFILES.encode.sourceInput.kind).toBe('code')
    })

    it('decode uses FieldForm textarea (kind: textarea)', () => {
      expect(DIRECTION_PROFILES.decode.sourceInput.kind).toBe('textarea')
    })
  })

  describe('format radio placement', () => {
    it('encode places format radio below the divider', () => {
      expect(DIRECTION_PROFILES.encode.formatRadio.placement).toBe('belowDivider')
    })

    it('decode places format radio in the toolbar', () => {
      expect(DIRECTION_PROFILES.decode.formatRadio.placement).toBe('toolbar')
    })
  })

  describe('download profile', () => {
    it('encode download: binary format emits .pb with octet-stream', () => {
      const result = 'binarydata'
      const { filename, blob } = DIRECTION_PROFILES.encode.download.build(result, 'MyMessage', 'binary')
      expect(filename).toMatch(/^encoded_MyMessage_\d+\.pb$/)
      expect(blob.type).toBe('application/octet-stream')
    })

    it('encode download: non-binary format emits .pb.txt with text/plain', () => {
      const result = 'dGVzdA=='
      const { filename, blob } = DIRECTION_PROFILES.encode.download.build(result, 'MyMessage', 'base64')
      expect(filename).toMatch(/^encoded_MyMessage_\d+\.pb\.txt$/)
      expect(blob.type).toBe('text/plain')
    })

    it('decode download: always emits .json with application/json', () => {
      const result = '{"bar":"hello"}'
      const { filename, blob } = DIRECTION_PROFILES.decode.download.build(result, 'MyMessage', 'base64')
      expect(filename).toMatch(/^decoded_MyMessage_\d+\.json$/)
      expect(blob.type).toBe('application/json')
    })

    it('encode download has correct ariaLabel', () => {
      expect(DIRECTION_PROFILES.encode.download.ariaLabel).toBe('Download encoded result')
    })

    it('decode download has correct ariaLabel', () => {
      expect(DIRECTION_PROFILES.decode.download.ariaLabel).toBe('Download decoded JSON')
    })
  })

  describe('SelectInput size', () => {
    it('encode has no selectSize override (default)', () => {
      expect(DIRECTION_PROFILES.encode.selectSize).toBeUndefined()
    })

    it('decode uses compact selectSize', () => {
      expect(DIRECTION_PROFILES.decode.selectSize).toBe('compact')
    })
  })
})
