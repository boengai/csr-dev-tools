const NAMED_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '¢': '&cent;',
  '§': '&sect;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;',
  '…': '&hellip;',
  '—': '&mdash;',
  '–': '&ndash;',
  '\u00A0': '&nbsp;',
}

const REVERSE_NAMED: Record<string, string> = {}
for (const [char, entity] of Object.entries(NAMED_ENTITIES)) {
  REVERSE_NAMED[entity] = char
}

type EncodeMode = 'named' | 'numeric'

export const encodeHtmlEntities = (input: string, mode: EncodeMode = 'named'): string => {
  if (input.length === 0) throw new Error('Empty input')
  let result = ''
  for (const char of input) {
    if (mode === 'named' && NAMED_ENTITIES[char]) {
      result += NAMED_ENTITIES[char]
    } else if (char.charCodeAt(0) > 127 || '<>&"\''.includes(char)) {
      if (mode === 'named' && NAMED_ENTITIES[char]) {
        result += NAMED_ENTITIES[char]
      } else {
        result += `&#${char.charCodeAt(0)};`
      }
    } else {
      result += char
    }
  }
  return result
}

export const decodeHtmlEntities = (input: string): string => {
  if (input.length === 0) throw new Error('Empty input')
  let result = input
  for (const [entity, char] of Object.entries(REVERSE_NAMED)) {
    result = result.replaceAll(entity, char)
  }
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
  return result
}
