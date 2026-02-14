import { describe, expect, it } from 'vitest'

import type { SideBySideRow } from '@/utils/diff'

import { computeLineDiff, computeSideBySideDiff, createUnifiedDiff } from '@/utils/diff'

describe('diff utilities', () => {
  describe('computeLineDiff', () => {
    it('should return unchanged for identical texts', async () => {
      const result = await computeLineDiff('hello\nworld', 'hello\nworld')
      expect(result).toHaveLength(1)
      expect(result[0].added).toBe(false)
      expect(result[0].removed).toBe(false)
      expect(result[0].value).toContain('hello')
    })

    it('should detect completely different texts', async () => {
      const result = await computeLineDiff('alpha\nbeta\n', 'gamma\ndelta\n')
      expect(result.some((c) => c.removed)).toBe(true)
      expect(result.some((c) => c.added)).toBe(true)
    })

    it('should detect added lines', async () => {
      const result = await computeLineDiff('line1\n', 'line1\nline2\n')
      const added = result.filter((c) => c.added)
      expect(added.length).toBeGreaterThan(0)
      expect(added[0].value).toContain('line2')
    })

    it('should detect removed lines', async () => {
      const result = await computeLineDiff('line1\nline2\n', 'line1\n')
      const removed = result.filter((c) => c.removed)
      expect(removed.length).toBeGreaterThan(0)
      expect(removed[0].value).toContain('line2')
    })

    it('should detect mixed changes', async () => {
      const result = await computeLineDiff('a\nb\nc\n', 'a\nx\nc\n')
      expect(result.some((c) => c.added)).toBe(true)
      expect(result.some((c) => c.removed)).toBe(true)
      expect(result.some((c) => !c.added && !c.removed)).toBe(true)
    })

    it('should handle empty original (all added)', async () => {
      const result = await computeLineDiff('', 'new line\n')
      expect(result.some((c) => c.added)).toBe(true)
      expect(result.every((c) => !c.removed)).toBe(true)
    })

    it('should handle empty modified (all removed)', async () => {
      const result = await computeLineDiff('old line\n', '')
      expect(result.some((c) => c.removed)).toBe(true)
      expect(result.every((c) => !c.added)).toBe(true)
    })

    it('should handle both empty', async () => {
      const result = await computeLineDiff('', '')
      expect(result).toHaveLength(0)
    })

    it('should handle multiline texts with partial changes', async () => {
      const original = 'line1\nline2\nline3\nline4\n'
      const modified = 'line1\nmodified\nline3\nline4\nnew line\n'
      const result = await computeLineDiff(original, modified)
      expect(result.length).toBeGreaterThan(1)
    })

    it('should handle Unicode content', async () => {
      const result = await computeLineDiff('hello 🌍\n', 'hello 🌍\nnew 日本語\n')
      const added = result.filter((c) => c.added)
      expect(added.length).toBeGreaterThan(0)
      expect(added[0].value).toContain('日本語')
    })

    it('should handle large texts without error', async () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `line ${i}`)
      const original = lines.join('\n') + '\n'
      const modified = lines.map((l, i) => (i === 500 ? 'changed' : l)).join('\n') + '\n'
      const result = await computeLineDiff(original, modified)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should detect trailing newline difference', async () => {
      const result = await computeLineDiff('hello\n', 'hello')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('createUnifiedDiff', () => {
    it('should produce unified diff format with markers', async () => {
      const result = await createUnifiedDiff('hello\n', 'world\n')
      expect(result).toContain('---')
      expect(result).toContain('+++')
      expect(result).toContain('@@')
    })

    it('should produce minimal output for identical texts', async () => {
      const result = await createUnifiedDiff('same\n', 'same\n')
      expect(result).not.toContain('@@')
    })

    it('should show added lines with + prefix', async () => {
      const result = await createUnifiedDiff('a\n', 'a\nb\n')
      expect(result).toContain('+b')
    })

    it('should show removed lines with - prefix', async () => {
      const result = await createUnifiedDiff('a\nb\n', 'a\n')
      expect(result).toContain('-b')
    })

    it('should handle both empty inputs', async () => {
      const result = await createUnifiedDiff('', '')
      expect(result).not.toContain('@@')
    })
  })

  describe('computeSideBySideDiff', () => {
    it('should return empty array for both empty inputs', async () => {
      const result = await computeSideBySideDiff('', '')
      expect(result).toHaveLength(0)
    })

    it('should return all unchanged rows for identical texts', async () => {
      const result = await computeSideBySideDiff('alpha\nbeta\ngamma\n', 'alpha\nbeta\ngamma\n')
      expect(result).toHaveLength(3)
      for (const row of result) {
        expect(row.leftType).toBe('unchanged')
        expect(row.rightType).toBe('unchanged')
        expect(row.leftContent).toBe(row.rightContent)
      }
      expect(result[0].leftLineNum).toBe(1)
      expect(result[0].rightLineNum).toBe(1)
      expect(result[2].leftLineNum).toBe(3)
      expect(result[2].rightLineNum).toBe(3)
    })

    it('should handle added-only lines', async () => {
      const result = await computeSideBySideDiff('a\n', 'a\nb\nc\n')
      expect(result.length).toBe(3)

      expect(result[0].leftType).toBe('unchanged')
      expect(result[0].rightType).toBe('unchanged')

      const addedRows = result.filter((r) => r.rightType === 'added')
      expect(addedRows).toHaveLength(2)
      for (const row of addedRows) {
        expect(row.leftType).toBe('empty')
        expect(row.leftLineNum).toBeNull()
      }
    })

    it('should handle removed-only lines', async () => {
      const result = await computeSideBySideDiff('a\nb\nc\n', 'a\n')
      expect(result.length).toBe(3)

      expect(result[0].leftType).toBe('unchanged')
      const removedRows = result.filter((r) => r.leftType === 'removed')
      expect(removedRows).toHaveLength(2)
      for (const row of removedRows) {
        expect(row.rightType).toBe('empty')
        expect(row.rightLineNum).toBeNull()
      }
    })

    it('should produce inline spans for paired modified lines', async () => {
      const result = await computeSideBySideDiff('hello world\n', 'hello earth\n')
      expect(result).toHaveLength(1)

      const row = result[0]
      expect(row.leftType).toBe('removed')
      expect(row.rightType).toBe('added')
      expect(row.leftSpans).not.toBeNull()
      expect(row.rightSpans).not.toBeNull()

      const leftRemoved = row.leftSpans!.filter((s) => s.type === 'removed')
      expect(leftRemoved.length).toBeGreaterThan(0)

      const rightAdded = row.rightSpans!.filter((s) => s.type === 'added')
      expect(rightAdded.length).toBeGreaterThan(0)
    })

    it('should handle more removed than added lines', async () => {
      const result = await computeSideBySideDiff('a\nb\nc\n', 'x\n')
      // 'a' pairs with 'x', 'b' and 'c' are standalone removed
      const paired = result.filter((r) => r.leftType === 'removed' && r.rightType === 'added')
      const standalone = result.filter((r) => r.leftType === 'removed' && r.rightType === 'empty')
      expect(paired).toHaveLength(1)
      expect(standalone).toHaveLength(2)
    })

    it('should handle more added than removed lines', async () => {
      const result = await computeSideBySideDiff('a\n', 'x\ny\nz\n')
      const paired = result.filter((r) => r.leftType === 'removed' && r.rightType === 'added')
      const standalone = result.filter((r) => r.leftType === 'empty' && r.rightType === 'added')
      expect(paired).toHaveLength(1)
      expect(standalone).toHaveLength(2)
    })

    it('should maintain continuous line numbers across mixed changes', async () => {
      const result = await computeSideBySideDiff('a\nb\nc\nd\n', 'a\nx\nc\ny\nz\n')

      const leftNums = result.filter((r) => r.leftLineNum != null).map((r) => r.leftLineNum)
      const rightNums = result.filter((r) => r.rightLineNum != null).map((r) => r.rightLineNum)

      // Verify monotonically increasing
      for (let i = 1; i < leftNums.length; i++) {
        expect(leftNums[i]).toBe(leftNums[i - 1]! + 1)
      }
      for (let i = 1; i < rightNums.length; i++) {
        expect(rightNums[i]).toBe(rightNums[i - 1]! + 1)
      }

      // Verify correct total counts
      expect(leftNums).toHaveLength(4)
      expect(rightNums).toHaveLength(5)
    })

    it('should handle large texts without error', async () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `line ${i}`)
      const original = lines.join('\n') + '\n'
      const modified = lines.map((l, i) => (i === 500 ? 'changed line' : l)).join('\n') + '\n'
      const result = await computeSideBySideDiff(original, modified)
      expect(result.length).toBeGreaterThanOrEqual(1000)

      const pairedRow = result.find((r: SideBySideRow) => r.leftType === 'removed' && r.rightType === 'added')
      expect(pairedRow).toBeDefined()
      expect(pairedRow!.leftSpans).not.toBeNull()
    })
  })
})
