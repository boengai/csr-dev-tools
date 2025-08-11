import { type Dispatch, type SetStateAction, useState } from 'react'

import type { UseCopyToClipboard } from '@/types'

import { Button, Card, CopyIcon, FieldForm, Tabs } from '@/components/common'
import { useCopyToClipboard } from '@/hooks'

const Form = ({ action, onSubmit }: { action: 'decode' | 'encode'; onSubmit: (source: string) => string }) => {
  // hook
  const copyToClipboard: UseCopyToClipboard = useCopyToClipboard()

  // states
  const [source, setSource]: [string, Dispatch<SetStateAction<string>>] = useState('')
  const [result, setResult]: [string, Dispatch<SetStateAction<string>>] = useState('')

  const handleChange = () => {
    try {
      setResult(onSubmit(source))
    } catch {
      setResult('')
    }
  }

  return (
    <div className="[&>fieldset]:min-h-37 flex h-full shrink-0 grow flex-col gap-4">
      <FieldForm
        label="Source"
        name="source"
        onChange={(val: string) => setSource(val)}
        placeholder={
          action === 'encode'
            ? 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.'
            : 'TG9yZW0lMjBpcHN1bSUyMGlzJTIwcGxhY2Vob2xkZXIlMjB0ZXh0JTIwY29tbW9ubHklMjB1c2VkJTIwaW4lMjB0aGUlMjBncmFwaGljJTJDJTIwcHJpbnQlMkMlMjBhbmQlMjBwdWJsaXNoaW5nJTIwaW5kdXN0cmllcyUyMGZvciUyMHByZXZpZXdpbmclMjBsYXlvdXRzJTIwYW5kJTIwdmlzdWFsJTIwbW9ja3Vwcy4='
        }
        type="textarea"
        value={source}
      />
      <Button disabled={!source} onClick={handleChange} variant="primary">
        {action === 'encode' ? 'Encode' : 'Decode'}
      </Button>
      <FieldForm
        label={
          <span className="flex items-center gap-1">
            <span>Result</span>
            {result && (
              <Button onClick={() => copyToClipboard(result)} variant="text">
                <CopyIcon />
              </Button>
            )}
          </span>
        }
        name="result"
        placeholder={
          action === 'decode'
            ? 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.'
            : 'TG9yZW0lMjBpcHN1bSUyMGlzJTIwcGxhY2Vob2xkZXIlMjB0ZXh0JTIwY29tbW9ubHklMjB1c2VkJTIwaW4lMjB0aGUlMjBncmFwaGljJTJDJTIwcHJpbnQlMkMlMjBhbmQlMjBwdWJsaXNoaW5nJTIwaW5kdXN0cmllcyUyMGZvciUyMHByZXZpZXdpbmclMjBsYXlvdXRzJTIwYW5kJTIwdmlzdWFsJTIwbW9ja3Vwcy4='
        }
        type="textarea"
        value={result}
      />
    </div>
  )
}

const Decoder = () => {
  const handleEncode = (value: string): string => {
    return decodeURIComponent(atob(value))
  }

  return <Form action="decode" onSubmit={handleEncode} />
}

const Encoder = () => {
  const handleEncode = (value: string): string => {
    return btoa(encodeURIComponent(value))
  }

  return <Form action="encode" onSubmit={handleEncode} />
}

export const Base64EncoderCard = () => {
  return (
    <Card title="Base64 Encoder/Decoder">
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
    </Card>
  )
}
