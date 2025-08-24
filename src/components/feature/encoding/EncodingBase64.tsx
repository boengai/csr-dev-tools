import { type Dispatch, type SetStateAction, useState } from 'react'

import type { UseCopyToClipboard } from '@/types'

import { Button, CopyIcon, FieldForm, Tabs } from '@/components/common'
import { useCopyToClipboard, useDebounceCallback } from '@/hooks'

const Form = ({ action, onSubmit }: { action: 'decode' | 'encode'; onSubmit: (source: string) => string }) => {
  // states
  const [source, setSource]: [string, Dispatch<SetStateAction<string>>] = useState('')
  const [result, setResult]: [Error | string, Dispatch<SetStateAction<Error | string>>] = useState<Error | string>('')

  // hook
  const copyToClipboard: UseCopyToClipboard = useCopyToClipboard()
  const dbSetResult: (s: string) => void = useDebounceCallback((s: string) => {
    try {
      setResult(onSubmit(s))
    } catch {
      setResult(new Error('Unable to process input'))
    }
  })

  const handleSourceChange = (val: string) => {
    setSource(val)
    dbSetResult(val)
  }

  return (
    <div className="[&>fieldset]:min-h-37 flex h-full shrink-0 grow flex-col gap-4">
      <FieldForm
        label="Source"
        name="source"
        onChange={handleSourceChange}
        placeholder={
          action === 'encode'
            ? 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.'
            : 'TG9yZW0lMjBpcHN1bSUyMGlzJTIwcGxhY2Vob2xkZXIlMjB0ZXh0JTIwY29tbW9ubHklMjB1c2VkJTIwaW4lMjB0aGUlMjBncmFwaGljJTJDJTIwcHJpbnQlMkMlMjBhbmQlMjBwdWJsaXNoaW5nJTIwaW5kdXN0cmllcyUyMGZvciUyMHByZXZpZXdpbmclMjBsYXlvdXRzJTIwYW5kJTIwdmlzdWFsJTIwbW9ja3Vwcy4='
        }
        type="textarea"
        value={source}
      />
      <FieldForm
        disabled={result instanceof Error}
        label={
          <span className="flex items-center gap-1">
            <span>Result</span>
            {typeof result === 'string' && result && (
              <Button onClick={() => copyToClipboard(result)} variant="text">
                <CopyIcon />
              </Button>
            )}
          </span>
        }
        name="result"
        placeholder={
          result instanceof Error
            ? result.message
            : action === 'decode'
              ? 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.'
              : 'TG9yZW0lMjBpcHN1bSUyMGlzJTIwcGxhY2Vob2xkZXIlMjB0ZXh0JTIwY29tbW9ubHklMjB1c2VkJTIwaW4lMjB0aGUlMjBncmFwaGljJTJDJTIwcHJpbnQlMkMlMjBhbmQlMjBwdWJsaXNoaW5nJTIwaW5kdXN0cmllcyUyMGZvciUyMHByZXZpZXdpbmclMjBsYXlvdXRzJTIwYW5kJTIwdmlzdWFsJTIwbW9ja3Vwcy4='
        }
        type="textarea"
        value={typeof result === 'string' ? result : ''}
      />
    </div>
  )
}

const Decoder = () => {
  const handleEncode = (value: string): string => {
    return atob(value)
  }

  return <Form action="decode" onSubmit={handleEncode} />
}

const Encoder = () => {
  const handleEncode = (value: string): string => {
    return btoa(value)
  }

  return <Form action="encode" onSubmit={handleEncode} />
}

export const EncodingBase64 = () => {
  return (
    <Tabs
      items={[
        {
          content: <Encoder />,
          trigger: <button>Encoder</button>,
          value: 'encoder',
        },
        {
          content: <Decoder />,
          trigger: <button>Decoder</button>,
          value: 'decoder',
        },
      ]}
    />
  )
}
