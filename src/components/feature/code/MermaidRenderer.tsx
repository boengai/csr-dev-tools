import { useState } from 'react'

import { Button, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { consumeHandoff, suggestMermaidFix } from '@/utils'
import { initializeMermaid, renderMermaid, svgToPng } from '@/utils/mermaid-renderer'

const toolEntry = TOOL_REGISTRY_MAP['mermaid-renderer']

const INITIAL = { source: '' }

const STORAGE_KEY = 'csr-dev-tools-mermaid-renderer'
// Before the TransformerShell migration the draft was a bare JSON string here.
const LEGACY_STORAGE_KEY = 'csr-dev-tools-mermaid-renderer-code'

/** Moves a pre-migration draft to the shell's bag key once, so it isn't lost. */
const migrateLegacyDraft = (): void => {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== null) return
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === null) return
    const source: unknown = JSON.parse(legacy)
    if (typeof source === 'string') localStorage.setItem(STORAGE_KEY, JSON.stringify({ source }))
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Storage unavailable or corrupt: start empty, as before.
  }
}

const EXAMPLES = [
  { code: 'flowchart TD\n    A --> B', label: 'Flowchart' },
  { code: 'sequenceDiagram\n    Alice->>Bob: Hello', label: 'Sequence' },
  { code: 'classDiagram\n    Animal <|-- Duck', label: 'Class' },
  { code: 'stateDiagram-v2\n    [*] --> Active', label: 'State' },
  { code: 'gantt\n    title Project\n    section A\n    Task 1: a1, 2024-01-01, 30d', label: 'Gantt' },
  { code: 'pie\n    title Distribution\n    "A": 40\n    "B": 30\n    "C": 30', label: 'Pie' },
]

// Unique-id source for mermaid.render — the id only needs to be unique across
// concurrent renders to avoid DOM collisions inside mermaid itself.
let mermaidRenderSeq = 0

// Rejects on bad syntax; the shell shows the message in the status slot.
// `renderMermaid` already returns DOMPurify-sanitised SVG.
const computeMermaid = async ({ source }: { source: string }): Promise<string> => {
  initializeMermaid()
  const { svg } = await renderMermaid(source, `mermaid-render-${++mermaidRenderSeq}`)
  return svg
}

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => (await fetch(dataUrl)).blob()

export const MermaidRenderer = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  // Runs once, before the shell reads storage on mount.
  useState(migrateLegacyDraft)

  return (
    <TransformerShell<{ source: string }, 'markup'>
      autoOpen={autoOpen}
      compute={computeMermaid}
      description={toolEntry?.description}
      downloads={(svg) => [
        { file: () => new Blob([svg], { type: 'image/svg+xml' }), filename: 'mermaid-diagram.svg', label: 'SVG' },
        { file: async () => dataUrlToBlob(await svgToPng(svg)), filename: 'mermaid-diagram.png', label: 'PNG' },
      ]}
      errorAction={(error, { source }) => {
        const fix = suggestMermaidFix(source, error instanceof Error ? error.message : '')
        return fix ? { label: `Auto-fix: ${fix.description}`, patch: { source: fix.fixedCode } } : null
      }}
      errorFallback="Invalid Mermaid syntax"
      initial={INITIAL}
      onAfterClose={onAfterClose}
      outputKind="markup"
      // DB Diagram hands its schema over as Mermaid ER syntax.
      prefill={() => {
        const code = consumeHandoff('mermaid-renderer')
        return code ? { source: code } : null
      }}
      renderControls={({ setFieldsImmediate }) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-xs text-gray-500">Examples</span>
          {EXAMPLES.map((example) => (
            <Button
              aria-label={`Use ${example.label} example`}
              key={example.label}
              onClick={() => setFieldsImmediate({ source: example.code })}
              size="small"
              variant="secondary"
            >
              {example.label}
            </Button>
          ))}
        </div>
      )}
      resultLabel="Preview"
      resultPlaceholder="Write Mermaid syntax, or pick an example, to see the diagram"
      sourceLabel="Mermaid Syntax"
      sourcePlaceholder="Enter Mermaid diagram syntax..."
      storageKey={STORAGE_KEY}
      title="Mermaid Renderer"
      triggerLabel="Render"
    />
  )
}
