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

  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\n\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
