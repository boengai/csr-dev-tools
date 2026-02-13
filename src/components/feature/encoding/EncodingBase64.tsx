import { useState } from 'react'

import { Button, CopyIcon, FieldForm, Tabs } from '@/components/common'
import { useCopyToClipboard, useDebounceCallback } from '@/hooks'

const Form = ({ action, onSubmit }: { action: 'decode' | 'encode'; onSubmit: (source: string) => string }) => {
  // states
  const [source, setSource] = useState('')
  const [result, setResult] = useState<Error | string>('')

  // hook
  const copyToClipboard = useCopyToClipboard()
  const dbSetResult = useDebounceCallback((s: string) => {
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
    <div className="flex h-full shrink-0 grow flex-col gap-4 [&>fieldset]:min-h-37">
      <FieldForm
        label="Source"
        name="source"
        onChange={handleSourceChange}
        placeholder={action === 'encode' ? 'Hello, World!' : 'SGVsbG8sIFdvcmxkIQ=='}
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
          result instanceof Error ? result.message : action === 'decode' ? 'Hello, World!' : 'SGVsbG8sIFdvcmxkIQ=='
        }
        type="textarea"
        value={typeof result === 'string' ? result : ''}
      />
    </div>
  )
}

const Decoder = () => {
  const handleEncode = (value: string) => {
    return atob(value)
  }

  return <Form action="decode" onSubmit={handleEncode} />
}

const Encoder = () => {
  const handleEncode = (value: string) => {
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
