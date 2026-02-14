import { useState } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { decodeUrl, encodeUrl } from '@/utils/url'

const toolEntry = TOOL_REGISTRY_MAP['url-encoder-decoder']

export const UrlEncoder = () => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [action, setAction] = useState<'decode' | 'encode'>('encode')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { clearError, error, setError } = useToolError()

  const process = (val: string, act: 'decode' | 'encode') => {
    if (val.length === 0) {
      setResult('')
      clearError()
      return
    }
    try {
      setResult(act === 'encode' ? encodeUrl(val) : decodeUrl(val))
      clearError()
    } catch {
      setResult('')
      setError(
        act === 'encode'
          ? 'Unable to encode text — input contains invalid characters'
          : 'Enter a valid URL-encoded string (e.g., hello%20world)',
      )
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, action)
  }, 150)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const openDialog = (act: 'decode' | 'encode') => {
    setAction(act)
    setSource('')
    setResult('')
    clearError()
    setDialogOpen(true)
  }

  const handleReset = () => {
    setSource('')
    setResult('')
    clearError()
  }

  const placeholder = action === 'encode' ? 'hello world&foo=bar' : 'hello%20world%26foo%3Dbar'
  const resultPlaceholder = action === 'encode' ? 'hello%20world%26foo%3Dbar' : 'hello world&foo=bar'

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

      <div className="flex grow flex-col items-center justify-center gap-2">
        <Button block onClick={() => openDialog('encode')} variant="default">
          Encode
        </Button>
        <Button block onClick={() => openDialog('decode')} variant="default">
          Decode
        </Button>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title={action === 'encode' ? 'URL Encode' : 'URL Decode'}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="tablet:flex-row flex size-full grow flex-col gap-6">
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

            <div className="tablet:border-t-0 tablet:border-l-2 border-t-2 border-dashed border-gray-900" />

            <div className="flex min-h-0 flex-1 flex-col gap-2">
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

          {error != null && (
            <p className="text-error text-body-sm shrink-0" role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}
