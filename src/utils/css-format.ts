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

  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .replace(/\s+/g, ' ')
    .trim()
}
