import type { DiffChange, InlineSpan, SideBySideRow } from '@/types'

export const computeLineDiff = async (original: string, modified: string): Promise<Array<DiffChange>> => {
  if (original === '' && modified === '') return []
  const { diffLines } = await import('diff')
  return diffLines(original, modified).map((change) => ({
    added: change.added ?? false,
    removed: change.removed ?? false,
    value: change.value,
  }))
}

export const createUnifiedDiff = async (original: string, modified: string): Promise<string> => {
  if (original === '' && modified === '') return ''
  const { createPatch } = await import('diff')
  return createPatch('text', original, modified, '', '', { context: 3 })
}

const splitLines = (value: string): Array<string> => {
  const lines = value.split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines
}

const computeInlineSpans = async (
  oldLine: string,
  newLine: string,
): Promise<{ left: Array<InlineSpan>; right: Array<InlineSpan> }> => {
  const { diffWords } = await import('diff')
  const parts = diffWords(oldLine, newLine)
  const left: Array<InlineSpan> = []
  const right: Array<InlineSpan> = []
  for (const part of parts) {
    if (part.added) {
      right.push({ text: part.value, type: 'added' })
    } else if (part.removed) {
      left.push({ text: part.value, type: 'removed' })
    } else {
      left.push({ text: part.value, type: 'equal' })
      right.push({ text: part.value, type: 'equal' })
    }
  }
  return { left, right }
}

export const computeSideBySideDiff = async (original: string, modified: string): Promise<Array<SideBySideRow>> => {
  if (original === '' && modified === '') return []
  const { diffLines } = await import('diff')
  const changes = diffLines(original, modified)

  const rows: Array<SideBySideRow> = []
  let leftNum = 1
  let rightNum = 1
  let pendingRemoved: Array<string> = []

  const flushPending = async (addedLines: Array<string>) => {
    const pairCount = Math.min(pendingRemoved.length, addedLines.length)

    for (let i = 0; i < pairCount; i++) {
      const { left, right } = await computeInlineSpans(pendingRemoved[i], addedLines[i])
      rows.push({
        leftContent: pendingRemoved[i],
        leftLineNum: leftNum++,
        leftSpans: left,
        leftType: 'removed',
        rightContent: addedLines[i],
        rightLineNum: rightNum++,
        rightSpans: right,
        rightType: 'added',
      })
    }

    for (let i = pairCount; i < pendingRemoved.length; i++) {
      rows.push({
        leftContent: pendingRemoved[i],
        leftLineNum: leftNum++,
        leftSpans: null,
        leftType: 'removed',
        rightContent: '',
        rightLineNum: null,
        rightSpans: null,
        rightType: 'empty',
      })
    }

    for (let i = pairCount; i < addedLines.length; i++) {
      rows.push({
        leftContent: '',
        leftLineNum: null,
        leftSpans: null,
        leftType: 'empty',
        rightContent: addedLines[i],
        rightLineNum: rightNum++,
        rightSpans: null,
        rightType: 'added',
      })
    }

    pendingRemoved = []
  }

  for (const change of changes) {
    const lines = splitLines(change.value)
    if (change.removed) {
      pendingRemoved.push(...lines)
    } else if (change.added) {
      await flushPending(lines)
    } else {
      await flushPending([])
      for (const line of lines) {
        rows.push({
          leftContent: line,
          leftLineNum: leftNum++,
          leftSpans: null,
          leftType: 'unchanged',
          rightContent: line,
          rightLineNum: rightNum++,
          rightSpans: null,
          rightType: 'unchanged',
        })
      }
    }
  }

  await flushPending([])
  return rows
}
