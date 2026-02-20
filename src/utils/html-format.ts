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

  // Preserve whitespace-sensitive blocks before minifying
  const preserved: Array<string> = []
  let result = html.replace(/<(pre|script|style|code)\b[\s\S]*?<\/\1>/gi, (match) => {
    const idx = preserved.length
    preserved.push(match)
    return `\x00P${idx}\x00`
  })

  result = result
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()

  // Restore preserved blocks
  for (let i = 0; i < preserved.length; i++) {
    result = result.replace(`\x00P${i}\x00`, preserved[i])
  }

  return result
}
