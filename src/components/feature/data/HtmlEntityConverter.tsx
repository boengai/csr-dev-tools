import { useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { decodeHtmlEntities, encodeHtmlEntities } from '@/utils/html-entity'

type ConvertMode = 'encode' | 'decode'
type EntityMode = 'named' | 'numeric'

const toolEntry = TOOL_REGISTRY_MAP['html-entity-converter']

export const HtmlEntityConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('encode')
  const [entityMode, setEntityMode] = useState<EntityMode>('named')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const sessionRef = useRef(0)

  const process = (val: string, m: ConvertMode, em: EntityMode) => {
    const session = ++sessionRef.current
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      const output = m === 'encode' ? encodeHtmlEntities(val, em) : decodeHtmlEntities(val)
      if (session !== sessionRef.current) return
      setResult(output)
    } catch (e) {
      if (session !== sessionRef.current) return
      setResult('')
      const msg = e instanceof Error ? e.message : 'Conversion failed'
      toast({ action: 'add', item: { label: msg, type: 'error' } })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, mode, entityMode)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const openDialog = (m: ConvertMode) => {
    sessionRef.current++
    setMode(m)
    setEntityMode('named')
    setSource('')
    setResult('')
    setDialogOpen(true)
  }

  const handleEntityModeChange = (val: string) => {
    const newMode = val as EntityMode
    setEntityMode(newMode)
    if (source.trim().length > 0) {
      process(source, mode, newMode)
    }
  }

  const handleReset = () => {
    sessionRef.current++
    setSource('')
    setResult('')
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  const isEncode = mode === 'encode'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('encode')} variant="default">
            Encode
          </Button>
          <Button block onClick={() => openDialog('decode')} variant="default">
            Decode
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title={isEncode ? 'Encode HTML Entities' : 'Decode HTML Entities'}
      >
        <div className="flex w-full grow flex-col gap-4">
          {isEncode && (
            <SelectInput
              name="entity-mode-select"
              onChange={handleEntityModeChange}
              options={[
                { label: 'Named Entities', value: 'named' },
                { label: 'Numeric Entities', value: 'numeric' },
              ]}
              value={entityMode}
            />
          )}

          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label={isEncode ? 'Text Input' : 'HTML Entity Input'}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={
                  isEncode ? '<div class="hello">&copy; 2024</div>' : '&lt;div&gt;&amp;copy; 2024&lt;/div&gt;'
                }
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>{isEncode ? 'Encoded Output' : 'Decoded Output'}</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                placeholder={
                  isEncode ? '&lt;div class=&quot;hello&quot;&gt;&amp;copy; 2024&lt;/div&gt;' : '<div>&copy; 2024</div>'
                }
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
