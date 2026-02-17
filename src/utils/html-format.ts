import { html as beautifyHtml } from 'js-beautify'

export const formatHtml = (html: string, indent: number | 'tab' = 2): string => {
  if (html.trim().length === 0) return ''

  return beautifyHtml(html, {
    indent_size: indent === 'tab' ? 1 : indent,
    indent_char: indent === 'tab' ? '\t' : ' ',
    wrap_line_length: 0,
    preserve_newlines: true,
    max_preserve_newlines: 2,
    indent_inner_html: true,
  })
}

export const minifyHtml = (html: string): string => {
  if (html.trim().length === 0) return ''

  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}
