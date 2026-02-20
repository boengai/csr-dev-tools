export type SortMode = 'az' | 'length-asc' | 'length-desc' | 'numeric' | 'za'

export type TextSortOptions = {
  removeDuplicates: boolean
  removeEmpty: boolean
  sortMode: SortMode
  trimLines: boolean
}

export const DEFAULT_SORT_OPTIONS: TextSortOptions = {
  removeDuplicates: false,
  removeEmpty: false,
  sortMode: 'az',
  trimLines: false,
}

export type TextSortResult = {
  lineCountAfter: number
  lineCountBefore: number
  output: string
}

export const sortAndProcessText = (input: string, options: TextSortOptions): TextSortResult => {
  let lines = input.replace(/\r\n/g, '\n').split('\n')
  const lineCountBefore = lines.length

  if (options.trimLines) {
    lines = lines.map((l) => l.trim())
  }

  if (options.removeEmpty) {
    lines = lines.filter((l) => l.trim().length > 0)
  }

  if (options.removeDuplicates) {
    lines = [...new Set(lines)]
  }

  switch (options.sortMode) {
    case 'az':
      lines.sort((a, b) => a.localeCompare(b))
      break
    case 'za':
      lines.sort((a, b) => b.localeCompare(a))
      break
    case 'length-asc':
      lines.sort((a, b) => a.length - b.length)
      break
    case 'length-desc':
      lines.sort((a, b) => b.length - a.length)
      break
    case 'numeric':
      lines.sort((a, b) => {
        const na = parseFloat(a)
        const nb = parseFloat(b)
        if (isNaN(na) && isNaN(nb)) return a.localeCompare(b)
        if (isNaN(na)) return 1
        if (isNaN(nb)) return -1
        return na - nb
      })
      break
  }

  return {
    lineCountAfter: lines.length,
    lineCountBefore,
    output: lines.join('\n'),
  }
}
