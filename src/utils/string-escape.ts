export type EscapeMode = 'html' | 'javascript' | 'json' | 'url' | 'xml'

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const HTML_UNESCAPE_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&apos;': "'",
}

const XML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

const XML_UNESCAPE_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
}

export const escapeHtml = (input: string): string => {
  return input.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch)
}

export const unescapeHtml = (input: string): string => {
  return input.replace(/&(?:amp|lt|gt|quot|#39|#x27|apos);/g, (entity) => HTML_UNESCAPE_MAP[entity] ?? entity)
}

export const escapeJavaScript = (input: string): string => {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\0/g, '\\0')
}

export const unescapeJavaScript = (input: string): string => {
  // Process character by character to handle escape sequences correctly
  let result = ''
  let i = 0
  while (i < input.length) {
    if (input[i] === '\\' && i + 1 < input.length) {
      const next = input[i + 1]
      switch (next) {
        case '\\':
          result += '\\'
          break
        case 'n':
          result += '\n'
          break
        case 'r':
          result += '\r'
          break
        case 't':
          result += '\t'
          break
        case '0':
          result += '\0'
          break
        case '"':
          result += '"'
          break
        case "'":
          result += "'"
          break
        default:
          result += next
          break
      }
      i += 2
    } else {
      result += input[i]
      i++
    }
  }
  return result
}

export const escapeJson = (input: string): string => {
  return JSON.stringify(input).slice(1, -1)
}

export const unescapeJson = (input: string): string => {
  try {
    return JSON.parse(`"${input}"`) as string
  } catch {
    throw new Error('Invalid JSON string escape sequence')
  }
}

export const escapeUrlString = (input: string): string => {
  return encodeURIComponent(input)
}

export const unescapeUrlString = (input: string): string => {
  return decodeURIComponent(input)
}

export const escapeXml = (input: string): string => {
  return input.replace(/[&<>"']/g, (ch) => XML_ESCAPE_MAP[ch] ?? ch)
}

export const unescapeXml = (input: string): string => {
  return input.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => XML_UNESCAPE_MAP[entity] ?? entity)
}

export const escapeString = (input: string, mode: EscapeMode): string => {
  switch (mode) {
    case 'html':
      return escapeHtml(input)
    case 'javascript':
      return escapeJavaScript(input)
    case 'json':
      return escapeJson(input)
    case 'url':
      return escapeUrlString(input)
    case 'xml':
      return escapeXml(input)
  }
}

export const unescapeString = (input: string, mode: EscapeMode): string => {
  switch (mode) {
    case 'html':
      return unescapeHtml(input)
    case 'javascript':
      return unescapeJavaScript(input)
    case 'json':
      return unescapeJson(input)
    case 'url':
      return unescapeUrlString(input)
    case 'xml':
      return unescapeXml(input)
  }
}
