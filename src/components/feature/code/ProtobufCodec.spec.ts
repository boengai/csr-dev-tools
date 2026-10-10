import { beforeEach, describe, expect, it, vi } from 'vitest'

import { nth } from '@/test/nth'
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

import { DIRECTION_PROFILES } from './ProtobufCodec'

// Mock the wasm parsers module. Each function is a spy so we can assert
// which one was invoked per direction.
vi.mock('@/wasm/parsers', () => ({
  encodeProtobuf: vi.fn(),
  decodeProtobuf: vi.fn(),
  detectProtobufFormat: vi.fn(),
  parseProtobufSchema: vi.fn(),
  generateSampleJson: vi.fn(),
  // Imported by parse-error-narrators (transitively via the @/utils barrel).
  // ProtobufCodec doesn't call them, but the mock must define them so the
  // narrator registry can read the references at module-load.
  getTomlParseError: vi.fn(),
  getXmlParseError: vi.fn(),
  getYamlParseError: vi.fn(),
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
  })

  describe('upload handler', () => {
    const makeCtx = () => ({
      onFormatChange: vi.fn(),
      onSourceChange: vi.fn(),
      schema: 'syntax = "proto3"; message Foo { string bar = 1; }',
      selectedMessageType: 'Foo',
      format: 'base64' as const,
      setInputImmediate: vi.fn(),
      showError: vi.fn(),
      showSuccess: vi.fn(),
    })

    it('encode upload reads file text and calls onSourceChange', async () => {
      const content = '{"bar":"hello"}'
      const file = new File([content], 'input.json', { type: 'application/json' })
      const ctx = makeCtx()

      await DIRECTION_PROFILES.encode.upload.handle(file, ctx)

      expect(ctx.onSourceChange).toHaveBeenCalledOnce()
      expect(ctx.onSourceChange).toHaveBeenCalledWith(content)
      expect(ctx.setInputImmediate).toHaveBeenCalledOnce()
      expect(ctx.setInputImmediate).toHaveBeenCalledWith(expect.objectContaining({ source: content }))
    })

    it('decode upload calls onFormatChange, onSourceChange, and showSuccess with detected format', async () => {
      const mockDetect = vi.mocked(parsers.detectProtobufFormat)
      mockDetect.mockResolvedValueOnce('hex')

      const bytes = new Uint8Array([0x0a, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f])
      const file = new File([bytes], 'payload.pb')
      const ctx = makeCtx()

      await DIRECTION_PROFILES.decode.upload.handle(file, ctx)

      expect(ctx.onFormatChange).toHaveBeenCalledOnce()
      expect(ctx.onFormatChange).toHaveBeenCalledWith('hex')
      expect(ctx.onSourceChange).toHaveBeenCalledOnce()
      expect(ctx.showSuccess).toHaveBeenCalledOnce()
      expect(ctx.showSuccess).toHaveBeenCalledWith(expect.stringMatching(/Auto-detected format/))
    })

    it('decode upload: binary detection sets source to latin1-encoded raw bytes', async () => {
      const mockDetect = vi.mocked(parsers.detectProtobufFormat)
      mockDetect.mockResolvedValueOnce('binary')

      const bytes = new Uint8Array([0x0a, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f])
      const file = new File([bytes], 'payload.pb')
      const ctx = makeCtx()

      await DIRECTION_PROFILES.decode.upload.handle(file, ctx)

      expect(ctx.onFormatChange).toHaveBeenCalledWith('binary')
      // source should be the latin1 string, not the UTF-8 decoded text
      const calledSource = nth(nth(ctx.onSourceChange.mock.calls, 0), 0) as string
      expect(calledSource).toHaveLength(bytes.length)
      for (let i = 0; i < bytes.length; i++) {
        expect(calledSource.charCodeAt(i)).toBe(bytes[i])
      }
    })
  })
})
