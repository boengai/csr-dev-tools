import DOMPurify from 'dompurify'
import { useState } from 'react'

import { Button, CopyButton, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { downloadBlob, optimizeSvg, type SvgOptimizeResult } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['svg-viewer']

const sanitize = (svg: string): string => DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } })

export const SvgViewer = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [optimizeResult, setOptimizeResult] = useState<SvgOptimizeResult | null>(null)

  const {
    input: source,
    result: safeSvg,
    setInput,
    setInputImmediate,
    reset,
  } = useToolInput<string, string>({
    compute: (val) => sanitize(val),
    debounceMs: 300,
    initial: '',
    initialResult: '',
    isEmpty: (val) => !val,
  })

  const handleSourceChange = (val: string) => {
    setOptimizeResult(null)
    setInput(val)
  }

  const handleOptimize = () => {
    if (!source) return
    const result = optimizeSvg(source)
    setOptimizeResult(result)
    setInputImmediate(result.optimized)
  }

  const handleDownload = () => {
    const content = sanitize(optimizeResult?.optimized ?? source)
    if (!content) return
    const blob = new Blob([content], { type: 'image/svg+xml' })
    downloadBlob(blob, 'optimized.svg')
  }

  const handleReset = () => {
    setOptimizeResult(null)
    reset()
  }

  const displaySvg = optimizeResult?.optimized ?? source

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      title="SVG Viewer & Optimizer"
      triggers={[{ label: 'Open SVG Viewer' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label="SVG Code"
              name="svg-source"
              onChange={handleSourceChange}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...>'
              type="code"
              value={source}
            />

            <div className="flex items-center gap-2">
              <Button onClick={handleOptimize} variant="default">
                Optimize
              </Button>
              <Button onClick={handleDownload} variant="default">
                Download
              </Button>
            </div>

            {optimizeResult && (
              <div
                aria-live="polite"
                className="text-sm flex flex-col gap-1 rounded border border-gray-800 bg-gray-950 p-3"
              >
                <span className="text-gray-400">
                  Original: <span className="text-gray-100">{optimizeResult.originalSize} bytes</span>
                </span>
                <span className="text-gray-400">
                  Optimized: <span className="text-gray-100">{optimizeResult.optimizedSize} bytes</span>
                </span>
                <span className="text-gray-400">
                  Saved: <span className="text-green-400">{optimizeResult.savings}</span>
                </span>
              </div>
            )}
          </Pane>

          <Pane>
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-medium text-gray-400">Preview</span>
              {displaySvg && <CopyButton label="SVG" value={sanitize(displaySvg)} />}
            </div>
            <div
              className="flex flex-1 items-center justify-center rounded-lg border border-gray-800 bg-white p-4"
              // `safeSvg` is the DOMPurify-sanitized compute result.
              dangerouslySetInnerHTML={{ __html: safeSvg }}
              style={{ minHeight: '200px' }}
            />
            {source && <span className="text-body-xs text-gray-500">Size: {new Blob([source]).size} bytes</span>}
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
