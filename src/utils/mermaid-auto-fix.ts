export type MermaidFixRule = {
  apply: (code: string) => string
  description: string
  detect: (code: string, error: string) => boolean
  id: string
}

export type MermaidFixSuggestion = {
  description: string
  fixedCode: string
  ruleId: string
}

const DIAGRAM_TYPE_CORRECTIONS = new Map<string, string>([
  ['classdiagram', 'classDiagram'],
  ['class diagram', 'classDiagram'],
  ['erdiagram', 'erDiagram'],
  ['er diagram', 'erDiagram'],
  ['git graph', 'gitGraph'],
  ['gitgraph', 'gitGraph'],
  ['mind map', 'mindmap'],
  ['pie chart', 'pie'],
  ['piechart', 'pie'],
  ['quadrant chart', 'quadrantChart'],
  ['quadrantchart', 'quadrantChart'],
  ['requirement diagram', 'requirementDiagram'],
  ['requirementdiagram', 'requirementDiagram'],
  ['sankey', 'sankey-beta'],
  ['sequence', 'sequenceDiagram'],
  ['sequence diagram', 'sequenceDiagram'],
  ['sequencediagram', 'sequenceDiagram'],
  ['state diagram', 'stateDiagram-v2'],
  ['statediagram', 'stateDiagram-v2'],
  ['statediagram-v2', 'stateDiagram-v2'],
  ['xychart', 'xychart-beta'],
])

const KNOWN_DIAGRAM_TYPES =
  /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|gantt|pie|gitGraph|journey|mindmap|timeline|sankey-beta|xychart-beta|block-beta|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i

const MERMAID_FIX_RULES: Array<MermaidFixRule> = [
  // Rule 1: box...end containing messages → rect...end
  {
    apply: (code: string): string => {
      const lines = code.split('\n')

      // First pass: find box blocks that contain message arrows
      const boxRanges: Array<{ end: number; hasMessages: boolean; start: number }> = []
      let currentBoxStart = -1
      let currentHasMessages = false

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim()
        if (/^box\b/i.test(trimmed) && currentBoxStart < 0) {
          currentBoxStart = i
          currentHasMessages = false
        } else if (currentBoxStart >= 0 && /^end\b/i.test(trimmed)) {
          boxRanges.push({ end: i, hasMessages: currentHasMessages, start: currentBoxStart })
          currentBoxStart = -1
        } else if (currentBoxStart >= 0 && /(?:->>|-->>|->|-->)/.test(trimmed)) {
          currentHasMessages = true
        }
      }

      // Second pass: replace box → rect for blocks with messages
      const boxLinesToConvert = new Set(
        boxRanges.filter((r) => r.hasMessages).map((r) => r.start),
      )

      return lines
        .map((line, i) => {
          if (!boxLinesToConvert.has(i)) return line

          const match = line.match(/^(\s*)box\b\s*(.*)/i)
          if (!match) return line

          const indent = match[1]
          const rest = match[2].trim()

          // Try to extract color portion (rgb/rgba/hex/transparent)
          const colorMatch = rest.match(
            /^(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|transparent)\s*/i,
          )

          if (colorMatch) {
            return `${indent}rect ${colorMatch[1]}`
          }

          // No recognized color — use a default
          return rest ? `${indent}rect rgb(200, 200, 200)` : `${indent}rect rgb(200, 200, 200)`
        })
        .join('\n')
    },
    description:
      'Convert "box...end" blocks containing messages to "rect...end" (box is only for participant grouping)',
    detect: (code: string, error: string): boolean => {
      const isSequenceDiagram = /^\s*sequenceDiagram/m.test(code)
      if (!isSequenceDiagram) return false

      // Check error pattern from Mermaid parser
      if (
        /Expecting.*(?:'end'|'participant'|'participant_actor'|'destroy').*got\s+'ACTOR'/i.test(
          error,
        )
      ) {
        return true
      }

      // Structural detection: box block contains message arrows
      return /^\s*box\b[^\n]*\n(?:(?!\bend\b)[\s\S])*?(?:->>|-->>|->(?!>)|-->)/m.test(code)
    },
    id: 'box-with-messages',
  },

  // Rule 2: Missing diagram type declaration
  {
    apply: (code: string): string => {
      const trimmed = code.trim()
      if (/->>/.test(trimmed)) return `sequenceDiagram\n${trimmed}`
      if (/<\|--/.test(trimmed)) return `classDiagram\n${trimmed}`
      return `flowchart TD\n${trimmed}`
    },
    description: 'Add missing diagram type declaration',
    detect: (code: string, error: string): boolean => {
      if (!error) return false
      const firstLine = code.trim().split('\n')[0].trim()
      if (KNOWN_DIAGRAM_TYPES.test(firstLine)) return false
      // Also check if a correction exists — if so, the typo rule should handle it
      if (DIAGRAM_TYPE_CORRECTIONS.has(firstLine.toLowerCase())) return false
      return (
        /no diagram type detected|unknown diagram type/i.test(error) ||
        /Parse error on line 1/i.test(error)
      )
    },
    id: 'missing-diagram-type',
  },

  // Rule 3: Diagram type typos / case errors
  {
    apply: (code: string): string => {
      const lines = code.split('\n')
      const firstLineTrimmed = lines[0].trim().toLowerCase()
      const correction = DIAGRAM_TYPE_CORRECTIONS.get(firstLineTrimmed)
      if (correction) {
        lines[0] = lines[0].replace(lines[0].trim(), correction)
      }
      return lines.join('\n')
    },
    description: 'Fix diagram type spelling',
    detect: (code: string, _error: string): boolean => {
      const firstLine = code.trim().split('\n')[0].trim()
      const lower = firstLine.toLowerCase()
      const correction = DIAGRAM_TYPE_CORRECTIONS.get(lower)
      // Only trigger if the correction differs from the original text
      return correction !== undefined && correction !== firstLine
    },
    id: 'diagram-type-typo',
  },

  // Rule 4: Deprecated graph → flowchart
  {
    apply: (code: string): string => {
      return code.replace(/^(\s*)graph\b/im, '$1flowchart')
    },
    description: 'Replace deprecated "graph" with modern "flowchart" syntax',
    detect: (code: string, error: string): boolean => {
      if (!error) return false
      const firstLine = code.trim().split('\n')[0].trim()
      return /^graph\b/i.test(firstLine)
    },
    id: 'graph-to-flowchart',
  },

  // Rule 5: Flowchart arrows in sequence diagram (missing message colon)
  {
    apply: (code: string): string => {
      return code
        .split('\n')
        .map((line) => {
          if (/^\s*\w+\s*-->\s*\w+\s*$/.test(line)) {
            return line.replace(/(\w+)\s*-->\s*(\w+)/, '$1->>$2: ')
          }
          return line
        })
        .join('\n')
    },
    description: 'Fix arrow syntax: sequence diagrams use "->>" not "-->"',
    detect: (code: string, error: string): boolean => {
      if (!error) return false
      const isSequence = /^\s*sequenceDiagram/m.test(code)
      if (!isSequence) return false
      return /^\s*\w+\s*-->\s*\w+\s*$/m.test(code)
    },
    id: 'wrong-arrow-in-sequence',
  },

  // Rule 6: Semicolons as line separators
  {
    apply: (code: string): string => {
      return code.replace(/;\s*/g, '\n    ')
    },
    description: 'Replace semicolons with newlines',
    detect: (code: string, error: string): boolean => {
      if (!error) return false
      const lines = code.trim().split('\n')
      return lines.length <= 3 && /;\s*\w/.test(code)
    },
    id: 'semicolon-line-separator',
  },
]

export const suggestMermaidFix = (
  code: string,
  error: string,
): MermaidFixSuggestion | null => {
  if (!code.trim() || !error) return null

  for (const rule of MERMAID_FIX_RULES) {
    if (rule.detect(code, error)) {
      return {
        description: rule.description,
        fixedCode: rule.apply(code),
        ruleId: rule.id,
      }
    }
  }

  return null
}
