import type { DiffChange, InlineSpan, SideBySideRow } from '@/types'
import { createUnifiedDiffWasm, diffLines, diffWords } from '@/wasm/diff'

export const computeLineDiff = async (original: string, modified: string): Promise<Array<DiffChange>> => {
  if (original === '' && modified === '') return []
  return diffLines(original, modified)
}

export const createUnifiedDiff = async (original: string, modified: string): Promise<string> => {
  if (original === '' && modified === '') return ''
  return createUnifiedDiffWasm(original, modified, 3)
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
  const parts = await diffWords(oldLine, newLine)
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
  const changes = await diffLines(original, modified)

  const rows: Array<SideBySideRow> = []
  let leftNum = 1
  let rightNum = 1
  let pendingRemoved: Array<string> = []

  const flushPending = async (addedLines: Array<string>) => {
    // Pair removed/added lines positionally; leftovers on either side get an empty partner.
    for (const [i, removedLine] of pendingRemoved.entries()) {
      const addedLine = addedLines[i]
      if (addedLine === undefined) {
        rows.push({
          leftContent: removedLine,
          leftLineNum: leftNum++,
          leftSpans: null,
          leftType: 'removed',
          rightContent: '',
          rightLineNum: null,
          rightSpans: null,
          rightType: 'empty',
        })
        continue
      }
      const { left, right } = await computeInlineSpans(removedLine, addedLine)
      rows.push({
        leftContent: removedLine,
        leftLineNum: leftNum++,
        leftSpans: left,
        leftType: 'removed',
        rightContent: addedLine,
        rightLineNum: rightNum++,
        rightSpans: right,
        rightType: 'added',
      })
    }

    for (const addedLine of addedLines.slice(pendingRemoved.length)) {
      rows.push({
        leftContent: '',
        leftLineNum: null,
        leftSpans: null,
        leftType: 'empty',
        rightContent: addedLine,
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
