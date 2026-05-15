import { AnimatePresence, m } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button, CopyButton, FieldForm, ToolDialogShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useMountOnce, useToast, useToolComputation } from '@/hooks'
import type { MermaidComputeResult, ToolComponentProps } from '@/types'
import {
  consumeHandoff,
  downloadMermaidSvg,
  downloadPng,
  initializeMermaid,
  renderMermaid,
  suggestMermaidFix,
  svgToPng,
  tv,
} from '@/utils'

const chevronStyles = tv({
  base: 'inline-block transition-transform',
  variants: {
    open: {
      true: 'rotate-90',
      false: '',
    },
  },
})

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

export const MermaidRenderer = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [code, setCode] = useInputLocalStorage('csr-dev-tools-mermaid-renderer-code', DEFAULT_CODE)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [exportingPng, setExportingPng] = useState(false)
  const [referenceOpen, setReferenceOpen] = useState(false)
  const { toast } = useToast()

  const { result, setInput, setInputImmediate } = useToolComputation<string, MermaidComputeResult>(computeMermaid, {
    debounceMs: 500,
    initial: INITIAL_RESULT,
    isEmpty: (input) => !input.trim(),
  })

  const svg = result.kind === 'svg' ? result.svg : ''
  const errorMessage = result.kind === 'error' ? result.message : null
  const fixSuggestion = result.kind === 'error' ? result.fixSuggestion : null

  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = svg
    }
  }, [svg])

  const initialInputRef = useRef<string | null>(null)

  // Handoff is read-once — capture the prefill exactly once across StrictMode's
  // double-mount cycle. The actual compute kickoff is a separate effect below
  // so it survives StrictMode's interim cleanup (which clears the pipeline's
  // pending setTimeout).
  useMountOnce(() => {
    initializeMermaid()
    const prefill = consumeHandoff('mermaid-renderer')
    if (prefill) setCode(prefill)
    initialInputRef.current = prefill ?? code
  })

  useEffect(() => {
    if (initialInputRef.current !== null) {
      setInputImmediate(initialInputRef.current)
    }
  }, [setInputImmediate])

  const handleCodeChange = (value: string) => {
    setCode(value)
    setInput(value)
  }

  const handleExportSvg = () => {
    try {
      downloadMermaidSvg(svg)
      toast({ action: 'add', item: { label: 'Downloaded mermaid-diagram.svg', type: 'success' } })
    } catch {
      toast({ action: 'add', item: { label: 'Failed to export SVG', type: 'error' } })
    }
  }

  const handleExportPng = async () => {
    setExportingPng(true)
    try {
      const dataUrl = await svgToPng(svg)
      downloadPng(dataUrl)
      toast({ action: 'add', item: { label: 'Downloaded mermaid-diagram.png', type: 'success' } })
    } catch {
      toast({ action: 'add', item: { label: 'Failed to export PNG', type: 'error' } })
    } finally {
      setExportingPng(false)
    }
  }

  const handleExampleClick = (exampleCode: string) => {
    setCode(exampleCode)
    setInputImmediate(exampleCode)
  }

  const handleApplyFix = useCallback(() => {
    if (!fixSuggestion) return
    setCode(fixSuggestion.fixedCode)
    setInputImmediate(fixSuggestion.fixedCode)
  }, [fixSuggestion, setCode, setInputImmediate])

  const handleReset = () => {
    setCode(DEFAULT_CODE)
    setInputImmediate(DEFAULT_CODE)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Render
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="screen"
        title="Mermaid Renderer"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            {/* Left Panel: Input */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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

              {/* Syntax Reference Toggle */}
              <div className="flex flex-col gap-2">
                <button
                  aria-expanded={referenceOpen}
                  aria-label="Syntax Reference"
                  className="relative flex cursor-pointer items-center gap-2 text-body-xs text-gray-400 before:absolute before:inset-x-0 before:inset-y-[-8px] before:content-[''] hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  onClick={() => setReferenceOpen((v) => !v)}
                  type="button"
                >
                  <span className={chevronStyles({ open: referenceOpen })}>▶</span>
                  Syntax Reference
                </button>

                <AnimatePresence>
                  {referenceOpen && (
                    <m.div
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col gap-2 rounded border border-gray-800 bg-gray-950 p-3">
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
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            {/* Right Panel: Preview */}
            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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
                  <div className="w-full [&_svg]:h-auto [&_svg]:w-full" ref={previewRef} />
                ) : (
                  !errorMessage && <p className="text-body-xs text-gray-500">Enter Mermaid syntax to see a preview</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
