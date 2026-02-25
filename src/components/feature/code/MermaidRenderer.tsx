import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, TextAreaInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { downloadPng, downloadSvg, initializeMermaid, renderMermaid, svgToPng } from '@/utils/mermaid-renderer'

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

export const MermaidRenderer = (_props: ToolComponentProps) => {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [referenceOpen, setReferenceOpen] = useState(false)
  const [exportingPng, setExportingPng] = useState(false)
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
      }
    } catch (err) {
      if (currentRender === renderCounterRef.current) {
        setError(err instanceof Error ? err.message : 'Invalid Mermaid syntax')
        setSvg('')
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

  if (!isReady) {
    return (
      <div className="flex h-full w-full animate-pulse items-center justify-center rounded bg-gray-800">
        <span className="text-body-xs text-gray-500">Loading Mermaid renderer...</span>
      </div>
    )
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="md:flex-row flex flex-col gap-4">
        {/* Left Panel: Editor Section */}
        <div className="md:w-[45%] flex min-w-0 flex-col gap-2">
          <h3 className="text-body-sm font-semibold text-gray-100">Mermaid Syntax</h3>
          <div className="[&_textarea]:font-mono">
            <TextAreaInput
              name="mermaid-input"
              onChange={handleCodeChange}
              placeholder="Enter Mermaid diagram syntax..."
              rows={12}
              value={code}
            />
          </div>

          {error && (
            <p className="text-red-400 text-body-xs" role="alert">
              {error}
            </p>
          )}

          {/* Syntax Reference Toggle */}
          <div className="flex flex-col gap-2">
            <button
              aria-expanded={referenceOpen}
              aria-label="Syntax Reference"
              className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-400 hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => setReferenceOpen((prev) => !prev)}
              type="button"
            >
              <span className={`inline-block transition-transform ${referenceOpen ? 'rotate-90' : ''}`}>▶</span>
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

        {/* Right Panel: Preview Section */}
        <div className="md:w-[55%] flex min-w-0 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-body-sm font-semibold text-gray-100">Preview</h3>
            <div className="flex gap-2">
              <Button disabled={!svg} onClick={handleExportSvg} size="small" variant="secondary">
                Export SVG
              </Button>
              <Button disabled={!svg || exportingPng} onClick={handleExportPng} size="small" variant="secondary">
                {exportingPng ? 'Exporting...' : 'Export PNG'}
              </Button>
            </div>
          </div>

          <div
            aria-live="polite"
            className="flex min-h-64 flex-1 items-center justify-center overflow-auto rounded border border-gray-800 bg-gray-900 p-4"
          >
            {svg ? (
              <div className="[&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              !error && <p className="text-body-xs text-gray-500">Enter Mermaid syntax to see a preview</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
