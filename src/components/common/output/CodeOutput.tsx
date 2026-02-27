import type { ReactNode } from 'react'

type CodeOutputProps = {
  label?: ReactNode
  placeholder?: string
  value: string
}

export const CodeOutput = ({ label, placeholder, value }: CodeOutputProps) => {
  return (
    <fieldset className="flex min-h-0 w-full grow flex-col gap-1">
      {label && <label className="min-h-8 shrink-0 pl-2 text-gray-100">{label}</label>}
      <pre className="min-h-0 grow overflow-auto rounded-lg border-2 border-gray-900 bg-gray-950 p-4 font-mono text-body-sm whitespace-pre-wrap break-words text-gray-200" data-has-value={value ? '' : undefined}>
        {value || <span className="text-gray-600">{placeholder}</span>}
      </pre>
    </fieldset>
  )
}
