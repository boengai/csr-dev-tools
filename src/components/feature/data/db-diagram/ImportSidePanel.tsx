import { useState } from 'react'

import { Button, CheckboxInput, CodeInput } from '@/components/common'
import type { DbmlError, ImportSidePanelProps } from '@/types'

import { DiagramSidePanel } from './DiagramSidePanel'

export const ImportSidePanel = ({
  controls,
  extensions,
  onClose,
  onImport,
  placeholder,
  testId,
  title,
}: ImportSidePanelProps) => {
  const [text, setText] = useState('')
  const [merge, setMerge] = useState(false)
  const [errors, setErrors] = useState<Array<DbmlError>>([])

  const handleImport = () => {
    if (!text.trim()) return
    setErrors(onImport(text, { merge }))
  }

  return (
    <DiagramSidePanel
      controls={controls}
      footer={
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[10px] text-gray-400" htmlFor={`${testId}-merge`}>
            <CheckboxInput checked={merge} id={`${testId}-merge`} name={`${testId}-merge`} onChange={setMerge} />
            Merge with existing (otherwise replaces)
          </label>
          <Button
            block
            data-testid={`${testId}-submit`}
            disabled={!text.trim()}
            onClick={handleImport}
            size="small"
            variant="primary"
          >
            Import
          </Button>
        </div>
      }
      onClose={onClose}
      testId={testId}
      title={title}
    >
      <CodeInput
        extensions={extensions}
        height="192px"
        aria-label={title}
        name={`${testId}-input`}
        onChange={setText}
        placeholder={placeholder}
        size="compact"
        value={text}
      />

      {errors.length > 0 && (
        <div className="mt-2 space-y-1" data-testid={`${testId}-errors`}>
          {errors.map((err) => (
            <p className="text-[10px] text-error" key={`${err.line}-${err.message}`}>
              {err.message}
            </p>
          ))}
        </div>
      )}
    </DiagramSidePanel>
  )
}
