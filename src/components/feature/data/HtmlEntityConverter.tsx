import { useEffect, useRef, useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm, SelectInput } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useToast, useToolComputation } from '@/hooks'
import type { EntityMode, HtmlEntityConvertMode, HtmlEntityInput, ToolComponentProps } from '@/types'
import { decodeHtmlEntities, encodeHtmlEntities } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['html-entity-converter']

const sourceKey = (m: HtmlEntityConvertMode) => `csr-dev-tools-html-entity-${m}-source`

const readSource = (m: HtmlEntityConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const HtmlEntityConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [mode, setMode] = useInputLocalStorage<HtmlEntityConvertMode>('csr-dev-tools-html-entity-mode', 'encode')
  const [source, setSource] = useState(() => readSource(mode))
  const [entityMode, setEntityMode] = useState<EntityMode>('named')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

  const { result, setInput, setInputImmediate } = useToolComputation<HtmlEntityInput, string>(
    ({ source: val, mode: m, entityMode: em }) =>
      m === 'encode' ? encodeHtmlEntities(val, em) : decodeHtmlEntities(val),
    {
      debounceMs: 300,
      initial: '',
      isEmpty: ({ source: val }) => val.trim().length === 0,
      onError: (e) => {
        const msg = e instanceof Error ? e.message : 'Conversion failed'
        toast({ action: 'add', item: { label: msg, type: 'error' } })
      },
    },
  )

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (source) setInputImmediate({ source, mode, entityMode })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleSourceChange = (val: string) => {
    setSource(val)
    try {
      localStorage.setItem(sourceKey(modeRef.current), JSON.stringify(val))
    } catch {}
    setInput({ source: val, mode, entityMode })
  }

  const openDialog = (m: HtmlEntityConvertMode) => {
    setMode(m)
    modeRef.current = m
    setEntityMode('named')
    const restored = readSource(m)
    setSource(restored)
    setDialogOpen(true)
    setInputImmediate({ source: restored, mode: m, entityMode: 'named' })
  }

  const handleEntityModeChange = (val: string) => {
    const newMode = val as EntityMode
    setEntityMode(newMode)
    setInputImmediate({ source, mode, entityMode: newMode })
  }

  const handleReset = () => {
    setInputImmediate({ source: '', mode, entityMode })
  }

  const isEncode = mode === 'encode'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('encode')} variant="default">
            Encode
          </Button>
          <Button block onClick={() => openDialog('decode')} variant="default">
            Decode
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
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
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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
      </ToolDialogShell>
    </>
  )
}
