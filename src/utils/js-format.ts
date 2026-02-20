import { js as beautifyJs } from 'js-beautify'

export const formatJs = (js: string, indent: number | 'tab' = 2): string => {
  if (js.trim().length === 0) return ''

  return beautifyJs(js, {
    indent_size: indent === 'tab' ? 1 : indent,
    indent_char: indent === 'tab' ? '\t' : ' ',
    preserve_newlines: true,
    max_preserve_newlines: 2,
  })
}

export const minifyJs = (js: string): string => {
  if (js.trim().length === 0) return ''

  // Preserve string literals before stripping comments
  const strings: Array<string> = []
  let result = js.replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, (match) => {
    const idx = strings.length
    strings.push(match)
    return `\x00S${idx}\x00`
  })

  result = result
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Restore string literals
  for (let i = 0; i < strings.length; i++) {
    result = result.replace(`\x00S${i}\x00`, strings[i])
  }

  return result
}
