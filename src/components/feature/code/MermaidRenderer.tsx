import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { MermaidFixSuggestion } from '@/utils/mermaid-auto-fix'
import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { tv } from '@/utils'
import { suggestMermaidFix } from '@/utils/mermaid-auto-fix'
import { downloadPng, downloadSvg, initializeMermaid, renderMermaid, svgToPng } from '@/utils/mermaid-renderer'

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

const MERMAID_PREFILL_KEY = 'csr-dev-tools-mermaid-renderer-prefill'

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

export const MermaidRenderer = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [referenceOpen, setReferenceOpen] = useState(false)
  const [exportingPng, setExportingPng] = useState(false)
  const [fixSuggestion, setFixSuggestion] = useState<MermaidFixSuggestion | null>(null)
  const { toast } = useToast()

  const renderCounterRef = useRef(0)
  const initializedRef = useRef(false)

  const handleRender = useCallback(async (input: string) => {
    const currentRender = ++renderCounterRef.current
    try {
      const result = await renderMermaid(input, `mermaid-render-${currentRender}`)
      if (currentRender === renderCounterRef.current) {
        setSvg(result.svg)
        setError(null)
        setFixSuggestion(null)
      }
    } catch (err) {
      if (currentRender === renderCounterRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Invalid Mermaid syntax'
        setError(errorMessage)
        setSvg('')
        setFixSuggestion(suggestMermaidFix(input, errorMessage))
      }
    }
  }, [])

  const debouncedRender = useDebounceCallback(handleRender, 500)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      initializeMermaid()
      setIsReady(true)

      // Check for cross-tool prefill from DB Diagram
      const prefill = localStorage.getItem(MERMAID_PREFILL_KEY)
      if (prefill) {
        localStorage.removeItem(MERMAID_PREFILL_KEY)
        setCode(prefill)
        handleRender(prefill)
      } else {
        handleRender(DEFAULT_CODE)
      }
    }
  }, [handleRender])

  const handleCodeChange = (value: string) => {
    setCode(value)
    debouncedRender(value)
  }

  const handleExportSvg = () => {
    try {
      downloadSvg(svg)
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
    handleRender(exampleCode)
  }

  const handleApplyFix = useCallback(() => {
    if (!fixSuggestion) return
    setCode(fixSuggestion.fixedCode)
    setFixSuggestion(null)
    handleRender(fixSuggestion.fixedCode)
  }, [fixSuggestion, handleRender])

  const handleReset = () => {
    setCode(DEFAULT_CODE)
    setSvg('')
    setError(null)
    setFixSuggestion(null)
    setReferenceOpen(false)
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Render
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title="Mermaid Renderer"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            {/* Left Panel: Input */}
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Mermaid Syntax"
                name="mermaid-input"
                onChange={handleCodeChange}
                placeholder="Enter Mermaid diagram syntax..."
                rows={16}
                type="textarea"
                value={code}
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    animate={{ height: 'auto', opacity: 1 }}
                    className="flex flex-col gap-2 overflow-hidden"
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-body-xs text-error" role="alert">
                      {error}
                    </p>

                    {fixSuggestion && (
                      <div className="flex items-center gap-2">
                        <p className="text-body-xs text-yellow-400">
                          Suggestion: {fixSuggestion.description}
                        </p>
                        <Button onClick={handleApplyFix} size="small" variant="warning">
                          Auto-fix
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Syntax Reference Toggle */}
              <div className="flex flex-col gap-2">
                <button
                  aria-expanded={referenceOpen}
                  aria-label="Syntax Reference"
                  className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-400 hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  onClick={() => setReferenceOpen((prev) => !prev)}
                  type="button"
                >
                  <span className={chevronStyles({ open: referenceOpen })}>▶</span>
                  Syntax Reference
                </button>

                <AnimatePresence>
                  {referenceOpen && (
                    <motion.div
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            {/* Right Panel: Preview */}
            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
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
                  <div className="w-full [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
                ) : (
                  !error && <p className="text-body-xs text-gray-500">Enter Mermaid syntax to see a preview</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
