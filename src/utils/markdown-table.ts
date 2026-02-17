export type ColumnAlignment = 'center' | 'left' | 'right'

const escapeCell = (text: string): string => text.replace(/\|/g, '\\|')

const separatorCell = (align: ColumnAlignment, width: number): string => {
  const dashes = '-'.repeat(Math.max(width, 3))
  switch (align) {
    case 'center':
      return `:${dashes.slice(1, -1)}:`
    case 'right':
      return `${dashes.slice(0, -1)}:`
    default:
      return `:${dashes.slice(1)}`
  }
}

export const generateMarkdownTable = (data: Array<Array<string>>, alignments: Array<ColumnAlignment>): string => {
  if (data.length === 0 || data[0].length === 0) return ''

  const colCount = data[0].length
  const escaped = data.map((row) => row.map((cell) => escapeCell(cell.trim())))

  // Calculate column widths
  const widths: Array<number> = Array.from({ length: colCount }, (_, c) =>
    Math.max(3, ...escaped.map((row) => (row[c] ?? '').length)),
  )

  const padCell = (text: string, width: number): string => text.padEnd(width)

  const headerRow = `| ${escaped[0].map((cell, i) => padCell(cell, widths[i])).join(' | ')} |`
  const separator = `| ${widths.map((w, i) => separatorCell(alignments[i] ?? 'left', w)).join(' | ')} |`
  const dataRows = escaped.slice(1).map((row) => `| ${row.map((cell, i) => padCell(cell, widths[i])).join(' | ')} |`)

  return [headerRow, separator, ...dataRows].join('\n')
}
