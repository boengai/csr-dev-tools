import type { ColumnAlignment } from '@/types/utils/markdown-table'

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
  const [header, ...body] = data.map((row) => row.map((cell) => escapeCell(cell.trim())))
  if (header === undefined || header.length === 0) return ''

  const colCount = header.length
  const escaped = [header, ...body]

  // Calculate column widths
  const widths: Array<number> = Array.from({ length: colCount }, (_, c) =>
    Math.max(3, ...escaped.map((row) => (row[c] ?? '').length)),
  )

  // Cells beyond the header's column count have no computed width and stay unpadded.
  const padCell = (text: string, column: number): string => text.padEnd(widths[column] ?? 0)

  const headerRow = `| ${header.map((cell, i) => padCell(cell, i)).join(' | ')} |`
  const separator = `| ${widths.map((w, i) => separatorCell(alignments[i] ?? 'left', w)).join(' | ')} |`
  const dataRows = body.map((row) => `| ${row.map((cell, i) => padCell(cell, i)).join(' | ')} |`)

  return [headerRow, separator, ...dataRows].join('\n')
}

export type { ColumnAlignment } from '@/types/utils/markdown-table'
