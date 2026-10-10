import { AnimatePresence, m } from 'motion/react'
import { useCallback, useState } from 'react'

import { Button, CopyButton, DisclosurePanel, EmptyState, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDownload, useMountOnce, useToast, useToolComputationPersisted } from '@/hooks'
import type { MermaidComputeResult, ToolComponentProps } from '@/types'
import { consumeHandoff, initializeMermaid, renderMermaid, suggestMermaidFix, svgToPng } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['mermaid-renderer']

const DEFAULT_CODE = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do something]
    B -->|No| D[Do something else]
    C --> E[End]
    D --> E`

const SYNTAX_EXAMPLES = [
  { code: 'flowchart TD\n    A --> B', label: 'Flowchart' },
  { code: 'sequenceDiagram\n    Alice->>Bob: Hello', label: 'Sequence' },
  { code: 'classDiagram\n    Animal <|-- Duck', label: 'Class' },
  { code: 'stateDiagram-v2\n    [*] --> Active', label: 'State' },
  { code: 'gantt\n    title Project\n    section A\n    Task 1: a1, 2024-01-01, 30d', label: 'Gantt' },
  { code: 'pie\n    title Distribution\n    "A": 40\n    "B": 30\n    "C": 30', label: 'Pie' },
]

const INITIAL_RESULT: MermaidComputeResult = { kind: 'svg', svg: '' }

// Unique-id source for mermaid.render — the id only needs to be unique across
// concurrent renders to avoid DOM collisions inside mermaid itself.
let mermaidRenderSeq = 0

const computeMermaid = async (input: string): Promise<MermaidComputeResult> => {
  try {
    const id = `mermaid-render-${++mermaidRenderSeq}`
    const { svg } = await renderMermaid(input, id)
    return { kind: 'svg', svg }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid Mermaid syntax'
    return { kind: 'error', message, fixSuggestion: suggestMermaidFix(input, message) }
  }
}

export const MermaidRenderer = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [exportingPng, setExportingPng] = useState(false)
  const { showError } = useToast()
  const { downloadDataUrl, downloadSvg } = useDownload()

  const {
    input: code,
    result,
    setInput,
    setInputImmediate,
  } = useToolComputationPersisted<string, MermaidComputeResult>({
    compute: computeMermaid,
    debounceMs: 500,
    initial: DEFAULT_CODE,
    initialResult: INITIAL_RESULT,
    isEmpty: (input) => !input.trim(),
    storageKey: 'csr-dev-tools-mermaid-renderer-code',
  })

  const svg = result.kind === 'svg' ? result.svg : ''
  const errorMessage = result.kind === 'error' ? result.message : null
  const fixSuggestion = result.kind === 'error' ? result.fixSuggestion : null

  // Mount-time: initialize the mermaid library, then handle the optional handoff
  // prefill from the DB Diagram tool. If a prefill exists, override the hook's
  // autorun (which would fire with the persisted code) by calling
  // setInputImmediate(prefill) — the pipeline cancels the pending autorun timeout
  // and fires compute with the prefill instead. If no prefill, the hook's own
  // isEmpty-gated autorun handles the recompute (DEFAULT_CODE is non-empty,
  // so it fires).
  useMountOnce(() => {
    initializeMermaid()
    const prefill = consumeHandoff('mermaid-renderer')
    if (prefill) {
      setInputImmediate(prefill)
    }
  })

  const handleCodeChange = (value: string) => setInput(value)

  const handleExportSvg = () => {
    try {
      downloadSvg(svg, 'mermaid-diagram.svg')
    } catch {
      showError('Failed to export SVG')
    }
  }

  const handleExportPng = async () => {
    setExportingPng(true)
    try {
      const dataUrl = await svgToPng(svg)
      downloadDataUrl(dataUrl, 'mermaid-diagram.png')
    } catch {
      showError('Failed to export PNG')
    } finally {
      setExportingPng(false)
    }
  }

  const handleExampleClick = (exampleCode: string) => setInputImmediate(exampleCode)

  const handleApplyFix = useCallback(() => {
    if (!fixSuggestion) return
    setInputImmediate(fixSuggestion.fixedCode)
  }, [fixSuggestion, setInputImmediate])

  const handleReset = () => setInputImmediate(DEFAULT_CODE)

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      title="Mermaid Renderer"
      triggers={[{ label: 'Render' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          {/* Left Panel: Input */}
          <Pane>
            <FieldForm
              label="Mermaid Syntax"
              name="mermaid-input"
              onChange={handleCodeChange}
              placeholder="Enter Mermaid diagram syntax..."
              type="code"
              value={code}
            />

            <AnimatePresence>
              {errorMessage && (
                <m.div
                  animate={{ height: 'auto', opacity: 1 }}
                  className="flex flex-col gap-2 overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-body-xs text-error" role="alert">
                    {errorMessage}
                  </p>

                  {fixSuggestion && (
                    <div className="flex items-center gap-2">
                      <p className="text-yellow-400 text-body-xs">Suggestion: {fixSuggestion.description}</p>
                      <Button onClick={handleApplyFix} size="small" variant="warning">
                        Auto-fix
                      </Button>
                    </div>
                  )}
                </m.div>
              )}
            </AnimatePresence>

            <DisclosurePanel label="Syntax Reference">
              <div className="flex flex-col gap-2">
                {SYNTAX_EXAMPLES.map((example) => (
                  <div className="flex items-start justify-between gap-2" key={example.label}>
                    <div className="min-w-0 flex-1">
                      <button
                        aria-label={`Use ${example.label} example`}
                        className="cursor-pointer text-body-xs font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        onClick={() => handleExampleClick(example.code)}
                        type="button"
                      >
                        {example.label}
                      </button>
                      <pre className="mt-1 overflow-x-auto font-mono text-body-xs whitespace-pre-wrap text-gray-400">
                        {example.code}
                      </pre>
                    </div>
                    <CopyButton label={example.label} value={example.code} variant="icon-only" />
                  </div>
                ))}
              </div>
            </DisclosurePanel>
          </Pane>

          {/* Right Panel: Preview */}
          <Pane live>
            <div className="flex items-center gap-1">
              <span className="text-body-xs font-medium text-gray-300">Preview</span>
              <div className="ml-auto flex gap-2">
                <Button disabled={!svg} onClick={handleExportSvg} size="small" variant="secondary">
                  Export SVG
                </Button>
                <Button disabled={!svg || exportingPng} onClick={handleExportPng} size="small" variant="secondary">
                  {exportingPng ? 'Exporting...' : 'Export PNG'}
                </Button>
              </div>
            </div>

            <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-auto">
              {svg ? (
                // `svg` is DOMPurify-sanitized inside renderMermaid. Rendered declaratively so a
                // remount (dialog reopen) shows the current diagram without waiting for it to change.
                <div className="w-full [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
              ) : (
                !errorMessage && <EmptyState>Enter Mermaid syntax to see a preview</EmptyState>
              )}
            </div>
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
