import * as protobuf from 'protobufjs'

export type OutputFormat = 'base64' | 'hex' | 'raw'

type CodecResult = { error: string; success: false } | { output: string; success: true }

function binaryToBase64(bytes: Uint8Array): string {
  return btoa(binaryToRaw(bytes))
}

function base64ToBinary(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function binaryToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBinary(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd length')
  }
  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error('Invalid hex string: non-hex characters')
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function binaryToRaw(bytes: Uint8Array): string {
  let result = ''
  for (const byte of bytes) {
    result += String.fromCharCode(byte)
  }
  return result
}

function rawToBinary(raw: string): Uint8Array {
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i) & 0xff
  }
  return bytes
}

function formatOutput(bytes: Uint8Array, format: OutputFormat): string {
  switch (format) {
    case 'base64':
      return binaryToBase64(bytes)
    case 'hex':
      return binaryToHex(bytes)
    case 'raw':
      return binaryToRaw(bytes)
  }
}

function parseInput(input: string, format: OutputFormat): Uint8Array {
  switch (format) {
    case 'base64':
      return base64ToBinary(input)
    case 'hex':
      return hexToBinary(input)
    case 'raw':
      return rawToBinary(input)
  }
}

function resolveMessageType(schema: string, messageTypeName: string): protobuf.Type {
  const parsed = protobuf.parse(schema)
  const root = parsed.root
  root.resolveAll()

  const messageType = root.lookupType(messageTypeName)
  if (!messageType) {
    throw new Error(`Message type "${messageTypeName}" not found in schema`)
  }
  return messageType
}

export function encodeProtobuf(
  schema: string,
  messageTypeName: string,
  jsonString: string,
  outputFormat: OutputFormat,
): CodecResult {
  try {
    if (!schema.trim()) {
      return { error: 'Empty schema', success: false }
    }

    const messageType = resolveMessageType(schema, messageTypeName)

    const jsonObj = JSON.parse(jsonString)
    const errMsg = messageType.verify(jsonObj)
    if (errMsg) {
      return { error: `Schema mismatch: ${errMsg}`, success: false }
    }

    const message = messageType.fromObject(jsonObj)
    const buffer = messageType.encode(message).finish()
    const output = formatOutput(buffer, outputFormat)

    return { output, success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: message, success: false }
  }
}

export function decodeProtobuf(
  schema: string,
  messageTypeName: string,
  input: string,
  inputFormat: OutputFormat,
): CodecResult {
  try {
    if (!schema.trim()) {
      return { error: 'Empty schema', success: false }
    }

    const messageType = resolveMessageType(schema, messageTypeName)
    const binary = parseInput(input, inputFormat)
    const decoded = messageType.decode(binary)
    const jsonObj = messageType.toObject(decoded, {
      longs: String,
      enums: String,
      defaults: true,
    })
    const output = JSON.stringify(jsonObj, null, 2)

    return { output, success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: message, success: false }
  }
}
