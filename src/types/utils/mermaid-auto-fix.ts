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
