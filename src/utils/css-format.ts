import { css as beautifyCss } from 'js-beautify'

export const formatCss = (css: string, indent: number | 'tab' = 2): string => {
  if (css.trim().length === 0) return ''

  return beautifyCss(css, {
    indent_size: indent === 'tab' ? 1 : indent,
    indent_char: indent === 'tab' ? '\t' : ' ',
  })
}

export const minifyCss = (css: string): string => {
  if (css.trim().length === 0) return ''

  // Preserve string literals before minifying
  const strings: Array<string> = []
  let result = css.replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, (match) => {
    const idx = strings.length
    strings.push(match)
    return `\x00S${idx}\x00`
  })

  result = result
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .replace(/\s+/g, ' ')
    .trim()

  // Restore string literals
  for (let i = 0; i < strings.length; i++) {
    result = result.replace(`\x00S${i}\x00`, strings[i])
  }

  return result
}
