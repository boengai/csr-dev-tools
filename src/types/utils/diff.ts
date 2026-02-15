export type DiffChange = {
  added: boolean
  removed: boolean
  value: string
}

export type InlineSpan = {
  text: string
  type: 'added' | 'equal' | 'removed'
}

export type DiffLineType = 'added' | 'empty' | 'removed' | 'unchanged'

export type SideBySideRow = {
  leftContent: string
  leftLineNum: number | null
  leftSpans: Array<InlineSpan> | null
  leftType: DiffLineType
  rightContent: string
  rightLineNum: number | null
  rightSpans: Array<InlineSpan> | null
  rightType: DiffLineType
}
