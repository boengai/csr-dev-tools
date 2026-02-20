import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { SvgOptimizeResult } from '@/utils/svg-optimize'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import { optimizeSvg, sanitizeSvg } from '@/utils/svg-optimize'

const toolEntry = TOOL_REGISTRY_MAP['svg-viewer']

export const SvgViewer = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [source, setSource] = useState('')
  const [safeSvg, setSafeSvg] = useState('')
  const [optimizeResult, setOptimizeResult] = useState<SvgOptimizeResult | null>(null)

  const updatePreview = useDebounceCallback((val: string) => {
    setSafeSvg(val ? sanitizeSvg(val) : '')
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    setOptimizeResult(null)
    updatePreview(val)
  }

  const handleOptimize = () => {
    if (!source) return
    const result = optimizeSvg(source)
    setOptimizeResult(result)
    setSource(result.optimized)
    setSafeSvg(sanitizeSvg(result.optimized))
  }

  const handleDownload = () => {
    const content = sanitizeSvg(optimizeResult?.optimized ?? source)
    if (!content) return
    const blob = new Blob([content], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized.svg'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const handleReset = () => {
    setSource('')
    setSafeSvg('')
    setOptimizeResult(null)
  }

  const displaySvg = optimizeResult?.optimized ?? source

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Open SVG Viewer
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="SVG Viewer &amp; Optimizer"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="SVG Code"
                name="svg-source"
                onChange={handleSourceChange}
                placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...>'
                rows={12}
                type="textarea"
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
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-body-sm font-medium text-gray-400">Preview</span>
                {displaySvg && <CopyButton label="SVG" value={displaySvg} />}
              </div>
              <div
                className="flex flex-1 items-center justify-center rounded-lg border border-gray-800 bg-white p-4"
                dangerouslySetInnerHTML={{ __html: safeSvg }}
                style={{ minHeight: '200px' }}
              />
              {source && <span className="text-body-xs text-gray-500">Size: {new Blob([source]).size} bytes</span>}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
