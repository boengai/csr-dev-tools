export const xmlToJson = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const { XMLParser } = await import('fast-xml-parser')
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const parsed = parser.parse(input)
  return JSON.stringify(parsed, null, 2)
}

export const jsonToXml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const { XMLBuilder } = await import('fast-xml-parser')
  const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true })
  const obj = JSON.parse(input)
  return builder.build(obj) as string
}

export const getXmlParseError = (input: string): string | null => {
  if (input.trim().length === 0) return 'Empty input'
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input, 'application/xml')
    const errorNode = doc.querySelector('parsererror')
    if (errorNode) return errorNode.textContent ?? 'Invalid XML'
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid XML'
  }
}
