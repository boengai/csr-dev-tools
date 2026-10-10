import { useMemo } from 'react'

import { CopyButton } from '@/components/common'
import type { ExportSidePanelProps } from '@/types'

import { useDiagram } from './DiagramContext'
import { DiagramSidePanel } from './DiagramSidePanel'

export const ExportSidePanel = ({
  action,
  controls,
  copyLabel,
  derive,
  emptyPlaceholder,
  extraDeps = [],
  onClose,
  testId,
  title,
}: ExportSidePanelProps) => {
  const { document, editor } = useDiagram()
  // document is an intentional reactive dep: re-runs when the diagram changes (editor state is external)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => derive(editor), [document, editor, ...extraDeps])

  return (
    <DiagramSidePanel
      controls={controls}
      footer={
        <div className="flex flex-wrap gap-2">
          <CopyButton label={copyLabel} value={value} />
          {action && <div className="grow">{action(value)}</div>}
        </div>
      }
      onClose={onClose}
      testId={testId}
      title={title}
    >
      <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid={`${testId}-output`}>
        {value || emptyPlaceholder}
      </pre>
    </DiagramSidePanel>
  )
}
