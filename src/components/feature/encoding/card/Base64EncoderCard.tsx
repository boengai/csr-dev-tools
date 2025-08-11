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
    <div className="flex grow flex-col gap-4 pt-2 [&>fieldset]:grow">
      <FieldForm
        label="Source"
        name="source"
        onChange={(val: string) => setSource(val)}
        type="textarea"
        value={source}
      />
      <Button onClick={handleChange} variant="primary">
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
