const splitWords = (input: string): Array<string> => {
  if (input.length === 0) return []

  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_\-./]+/)
    .filter((w) => w.length > 0)
}

export const toCamelCase = (input: string): string => {
  const words = splitWords(input)
  if (words.length === 0) return ''
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
}

export const toPascalCase = (input: string): string => {
  const words = splitWords(input)
  if (words.length === 0) return ''
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
}

export const toSnakeCase = (input: string): string => {
  return splitWords(input)
    .map((w) => w.toLowerCase())
    .join('_')
}

export const toKebabCase = (input: string): string => {
  return splitWords(input)
    .map((w) => w.toLowerCase())
    .join('-')
}

export const toConstantCase = (input: string): string => {
  return splitWords(input)
    .map((w) => w.toUpperCase())
    .join('_')
}

export const toTitleCase = (input: string): string => {
  return splitWords(input)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export const toUpperCase = (input: string): string => {
  return input.toUpperCase()
}

export const toLowerCase = (input: string): string => {
  return input.toLowerCase()
}

export const toSentenceCase = (input: string): string => {
  const words = splitWords(input)
  if (words.length === 0) return ''
  return words
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ')
}

export const toDotCase = (input: string): string => {
  return splitWords(input)
    .map((w) => w.toLowerCase())
    .join('.')
}

export const toPathCase = (input: string): string => {
  return splitWords(input)
    .map((w) => w.toLowerCase())
    .join('/')
}
