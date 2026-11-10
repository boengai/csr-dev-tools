import DOMPurify from 'dompurify'
import { useState } from 'react'

import { Button, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { SvgOptimizeResult, ToolComponentProps } from '@/types'
import { optimizeSvg } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['svg-viewer']

const INITIAL = { source: '' }

const byteSize = (text: string): number => new Blob([text]).size

// Sanitised here too (not only by the shell) so Download saves the same safe SVG.
const computeSvg = ({ source }: { source: string }): string => {
  const safe = DOMPurify.sanitize(source, { USE_PROFILES: { svg: true } })
  if (!/<svg[\s>]/i.test(safe)) throw new Error('No <svg> element found — paste SVG markup that starts with <svg')
  return safe
}

export const SvgViewer = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  // The last Optimize run; its stats show while the source is still its output.
  const [optimized, setOptimized] = useState<SvgOptimizeResult | null>(null)

  return (
    <TransformerShell<{ source: string }, 'markup'>
      autoOpen={autoOpen}
      compute={computeSvg}
      description={toolEntry?.description}
      downloads={(svg) => [
        { file: () => new Blob([svg], { type: 'image/svg+xml' }), filename: 'image.svg', label: 'SVG' },
      ]}
      initial={INITIAL}
      // Dark-ink SVG would vanish on the dark pane.
      markupBackground="light"
      onAfterClose={onAfterClose}
      outputKind="markup"
      // Never saved before the shell; kept that way.
      persistInput={false}
      renderControls={({ inputs, setFieldsImmediate }) => {
        const stats = optimized?.optimized === inputs.source ? optimized : null
        return (
          <>
            <Button
              disabled={!inputs.source.trim()}
              onClick={() => {
                const next = optimizeSvg(inputs.source)
                setOptimized(next)
                setFieldsImmediate({ source: next.optimized })
              }}
              size="small"
            >
              Optimize
            </Button>
            {stats ? (
              <p className="text-body-xs text-gray-500">
                Optimized: {stats.originalSize} B → {stats.optimizedSize} B (saved {stats.savings})
              </p>
            ) : (
              inputs.source && <p className="text-body-xs text-gray-500">Size: {byteSize(inputs.source)} B</p>
            )}
          </>
        )
      }}
      resultLabel="Preview"
      resultPlaceholder="Paste SVG markup on the left to preview it here"
      sourceLabel="SVG Code"
      sourcePlaceholder='<svg xmlns="http://www.w3.org/2000/svg" ...>'
      title="SVG Viewer & Optimizer"
      triggerLabel="Open SVG Viewer"
    />
  )
}
