import { describe, expect, it } from 'vitest'

import { suggestMermaidFix } from '@/utils/mermaid-auto-fix'

describe('mermaid-auto-fix', () => {
  describe('suggestMermaidFix', () => {
    it('returns null when no fix is applicable', () => {
      const result = suggestMermaidFix('flowchart TD\n    A --> B', 'Some random error')
      expect(result).toBeNull()
    })

    it('returns null for empty code', () => {
      expect(suggestMermaidFix('', 'error')).toBeNull()
      expect(suggestMermaidFix('   ', 'error')).toBeNull()
    })

    it('returns null for empty error', () => {
      expect(suggestMermaidFix('flowchart TD\n    A --> B', '')).toBeNull()
    })
  })

  describe('box-with-messages rule', () => {
    const BOX_ERROR = `Parse error on line 8: Expecting 'SPACE', 'NEWLINE', 'end', 'participant', 'participant_actor', 'destroy', got 'ACTOR'`

    it('detects box containing message arrows in sequence diagram', () => {
      const code = `sequenceDiagram
    participant A
    participant B

    box rgba(0, 150, 255, 0.1) Group
        A->>B: Hello
    end`

      const result = suggestMermaidFix(code, BOX_ERROR)
      expect(result).not.toBeNull()
      expect(result!.ruleId).toBe('box-with-messages')
    })

    it('does not trigger for non-sequence diagrams', () => {
      const code = `flowchart TD
    box Something
        A --> B
    end`
      const result = suggestMermaidFix(code, 'some error')
      expect(result).toBeNull()
    })

    it('converts box to rect preserving rgba color', () => {
      const code = `sequenceDiagram
    participant A
    participant B

    box rgba(0, 150, 255, 0.1) Scenario A
        A->>B: Hello
        B-->>A: Reply
    end`

      const result = suggestMermaidFix(code, BOX_ERROR)
      expect(result).not.toBeNull()
      expect(result!.fixedCode).toContain('rect rgba(0, 150, 255, 0.1)')
      expect(result!.fixedCode).not.toMatch(/^\s*box\b/m)
    })

    it('converts box to rect preserving rgb color', () => {
      const code = `sequenceDiagram
    box rgb(200,200,200) Group
        A->>B: msg
    end`

      const result = suggestMermaidFix(code, BOX_ERROR)
      expect(result!.fixedCode).toContain('rect rgb(200,200,200)')
    })

    it('converts box to rect with default color when named color used', () => {
      const code = `sequenceDiagram
    box LightBlue Worker Group
        A->>B: msg
    end`

      const result = suggestMermaidFix(code, BOX_ERROR)
      expect(result!.fixedCode).toContain('rect rgb(200, 200, 200)')
    })

    it('handles multiple box blocks, converting only those with messages', () => {
      const code = `sequenceDiagram
    box rgba(0, 150, 255, 0.1) Group A
        participant A
    end
    box rgba(0, 200, 100, 0.1) Group B
        A->>B: Hello
    end`

      const result = suggestMermaidFix(code, BOX_ERROR)
      expect(result).not.toBeNull()
      // First box (participants only) stays as box
      expect(result!.fixedCode).toMatch(/box rgba\(0, 150, 255, 0\.1\)/)
      // Second box (with messages) becomes rect
      expect(result!.fixedCode).toContain('rect rgba(0, 200, 100, 0.1)')
    })

    it('preserves indentation', () => {
      const code = `sequenceDiagram
    box rgba(0, 150, 255, 0.1) Group
        A->>B: msg
    end`

      const result = suggestMermaidFix(code, BOX_ERROR)
      expect(result!.fixedCode).toMatch(/^    rect/m)
    })

    it('handles the exact user-reported scenario', () => {
      const code = `sequenceDiagram
    participant BD as BDD Runner (Playwright Worker)
    participant F as E2E Factory (Hooks)
    participant API as Backend (E2E API)
    participant DB as Test Database

    box rgba(0, 150, 255, 0.1) Scenario A (Worker 1)
        BD->>F: Start
        F->>API: POST /api/e2e/clients
        API->>DB: Insert Client A
        F-->>BD: Save context
    end`

      const error = `Parse error on line 8: ... (Worker 1) BD->>F: เริ่มรัน Sce --- ^ Expecting 'SPACE', 'NEWLINE', 'end', 'participant', 'participant_actor', 'destroy', got 'ACTOR'`

      const result = suggestMermaidFix(code, error)
      expect(result).not.toBeNull()
      expect(result!.ruleId).toBe('box-with-messages')
      expect(result!.fixedCode).toContain('rect rgba(0, 150, 255, 0.1)')
      expect(result!.fixedCode).not.toMatch(/^\s*box\b/m)
    })

    it('converts box with hex color', () => {
      const code = `sequenceDiagram
    box #f0f0f0 Group
        A->>B: msg
    end`

      const result = suggestMermaidFix(code, BOX_ERROR)
      expect(result!.fixedCode).toContain('rect #f0f0f0')
    })

    it('converts box with transparent keyword', () => {
      const code = `sequenceDiagram
    box transparent Group
        A->>B: msg
    end`

      const result = suggestMermaidFix(code, BOX_ERROR)
      expect(result!.fixedCode).toContain('rect transparent')
    })
  })

  describe('missing-diagram-type rule', () => {
    it('detects code without a diagram type keyword', () => {
      const code = 'A --> B\nB --> C'
      const result = suggestMermaidFix(code, 'Parse error on line 1')
      expect(result).not.toBeNull()
      expect(result!.ruleId).toBe('missing-diagram-type')
    })

    it('does not trigger when diagram type is present', () => {
      const code = 'flowchart TD\n    A --> B'
      const result = suggestMermaidFix(code, 'some other error')
      expect(result).toBeNull()
    })

    it('prepends flowchart TD for code with --> arrows', () => {
      const code = 'A --> B'
      const result = suggestMermaidFix(code, 'No diagram type detected')
      expect(result!.fixedCode).toMatch(/^flowchart TD\n/)
    })

    it('prepends sequenceDiagram for code with ->> arrows', () => {
      const code = 'Alice->>Bob: Hello'
      const result = suggestMermaidFix(code, 'No diagram type detected')
      expect(result!.fixedCode).toMatch(/^sequenceDiagram\n/)
    })

    it('prepends classDiagram for code with <|-- arrows', () => {
      const code = 'Animal <|-- Duck'
      const result = suggestMermaidFix(code, 'No diagram type detected')
      expect(result!.fixedCode).toMatch(/^classDiagram\n/)
    })

    it('defaults to flowchart TD for ambiguous code', () => {
      const code = 'A --- B'
      const result = suggestMermaidFix(code, 'No diagram type detected')
      expect(result!.fixedCode).toMatch(/^flowchart TD\n/)
    })
  })

  describe('diagram-type-typo rule', () => {
    it('fixes "sequencediagram" to "sequenceDiagram"', () => {
      const code = 'sequencediagram\n    Alice->>Bob: Hello'
      const result = suggestMermaidFix(code, 'error')
      expect(result).not.toBeNull()
      expect(result!.ruleId).toBe('diagram-type-typo')
      expect(result!.fixedCode).toMatch(/^sequenceDiagram\n/)
    })

    it('fixes "classdiagram" to "classDiagram"', () => {
      const code = 'classdiagram\n    Animal <|-- Duck'
      const result = suggestMermaidFix(code, 'error')
      expect(result!.fixedCode).toMatch(/^classDiagram\n/)
    })

    it('fixes "erdiagram" to "erDiagram"', () => {
      const code = 'erdiagram\n    CUSTOMER ||--o{ ORDER : places'
      const result = suggestMermaidFix(code, 'error')
      expect(result!.fixedCode).toMatch(/^erDiagram\n/)
    })

    it('fixes "gitgraph" to "gitGraph"', () => {
      const code = 'gitgraph\n    commit'
      const result = suggestMermaidFix(code, 'error')
      expect(result!.fixedCode).toMatch(/^gitGraph\n/)
    })

    it('does not modify already-correct diagram types', () => {
      const code = 'sequenceDiagram\n    Alice->>Bob: Hello'
      const result = suggestMermaidFix(code, 'some error')
      // Should not match typo rule (correct casing)
      expect(result?.ruleId).not.toBe('diagram-type-typo')
    })

    it('preserves the rest of the code unchanged', () => {
      const code = 'sequencediagram\n    Alice->>Bob: Hello\n    Bob-->>Alice: Hi'
      const result = suggestMermaidFix(code, 'error')
      expect(result!.fixedCode).toBe('sequenceDiagram\n    Alice->>Bob: Hello\n    Bob-->>Alice: Hi')
    })
  })

  describe('graph-to-flowchart rule', () => {
    it('replaces "graph" with "flowchart" when error present', () => {
      const code = 'graph TD\n    A --> B'
      const result = suggestMermaidFix(code, 'error')
      expect(result).not.toBeNull()
      expect(result!.ruleId).toBe('graph-to-flowchart')
      expect(result!.fixedCode).toMatch(/^flowchart TD\n/)
    })

    it('preserves direction modifier', () => {
      const code = 'graph LR\n    A --> B'
      const result = suggestMermaidFix(code, 'error')
      expect(result!.fixedCode).toMatch(/^flowchart LR\n/)
    })

    it('does not trigger when no error', () => {
      const code = 'graph TD\n    A --> B'
      const result = suggestMermaidFix(code, '')
      expect(result).toBeNull()
    })
  })

  describe('wrong-arrow-in-sequence rule', () => {
    it('detects flowchart arrows in sequence diagram', () => {
      const code = 'sequenceDiagram\n    Alice --> Bob'
      const result = suggestMermaidFix(code, 'error')
      expect(result).not.toBeNull()
      expect(result!.ruleId).toBe('wrong-arrow-in-sequence')
    })

    it('converts "A --> B" to "A->>B: " in sequence context', () => {
      const code = 'sequenceDiagram\n    Alice --> Bob'
      const result = suggestMermaidFix(code, 'error')
      expect(result!.fixedCode).toContain('Alice->>Bob: ')
    })

    it('does not modify lines that already have message colons', () => {
      const code = 'sequenceDiagram\n    Alice->>Bob: Hello\n    Charlie --> Dave'
      const result = suggestMermaidFix(code, 'error')
      expect(result!.fixedCode).toContain('Alice->>Bob: Hello')
      expect(result!.fixedCode).toContain('Charlie->>Dave: ')
    })
  })

  describe('semicolon-line-separator rule', () => {
    it('splits semicolon-separated statements into newlines', () => {
      const code = 'flowchart TD; A --> B; B --> C'
      const result = suggestMermaidFix(code, 'error')
      expect(result).not.toBeNull()
      expect(result!.ruleId).toBe('semicolon-line-separator')
      expect(result!.fixedCode).toContain('flowchart TD')
      expect(result!.fixedCode).toContain('A --> B')
      expect(result!.fixedCode).toContain('B --> C')
    })

    it('does not trigger for multi-line code', () => {
      const code = 'flowchart TD\n    A --> B\n    B --> C\n    C --> D'
      const result = suggestMermaidFix(code, 'error')
      expect(result?.ruleId).not.toBe('semicolon-line-separator')
    })
  })

  describe('rule priority', () => {
    it('returns the first matching rule when multiple could match', () => {
      // This code matches both box-with-messages and potentially other rules
      const code = `sequenceDiagram
    box rgba(0, 150, 255, 0.1) Group
        A->>B: Hello
    end`
      const error = `Expecting 'end', 'participant', 'participant_actor', 'destroy', got 'ACTOR'`

      const result = suggestMermaidFix(code, error)
      expect(result!.ruleId).toBe('box-with-messages')
    })
  })
})
