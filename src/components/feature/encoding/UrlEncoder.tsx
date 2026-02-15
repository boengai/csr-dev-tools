import { useState } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { decodeUrl, encodeUrl } from '@/utils/url'

const toolEntry = TOOL_REGISTRY_MAP['url-encoder-decoder']

export const UrlEncoder = () => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [action, setAction] = useState<'decode' | 'encode'>('encode')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  const process = (val: string, act: 'decode' | 'encode') => {
    if (val.length === 0) {
      setResult('')
      return
    }
    try {
      setResult(act === 'encode' ? encodeUrl(val) : decodeUrl(val))
    } catch {
      setResult('')
      toast({
        action: 'add',
        item: {
          label:
            act === 'encode'
              ? 'Unable to encode text — input contains invalid characters'
              : 'Enter a valid URL-encoded string (e.g., hello%20world)',
          type: 'error',
        },
      })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, action)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const openDialog = (act: 'decode' | 'encode') => {
    setAction(act)
    setSource('')
    setResult('')
    setDialogOpen(true)
  }

  const handleReset = () => {
    setSource('')
    setResult('')
  }

  const placeholder = action === 'encode' ? 'hello world&foo=bar' : 'hello%20world%26foo%3Dbar'
  const resultPlaceholder = action === 'encode' ? 'hello%20world%26foo%3Dbar' : 'hello world&foo=bar'

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
        onAfterClose={handleReset}
        size="screen"
        title={action === 'encode' ? 'URL Encode' : 'URL Decode'}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Source"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={placeholder}
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                disabled={!result}
                label={
                  <span className="flex items-center gap-1">
                    <span>Result</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                name="result"
                placeholder={resultPlaceholder}
                rows={12}
                type="textarea"
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
