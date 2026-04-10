import type { CodeOutputProps } from '@/types/components/common/output/codeOutput'

export const CodeOutput = ({ label, placeholder, value }: CodeOutputProps) => {
  return (
    <fieldset className="flex min-h-0 w-full grow flex-col gap-1">
      {label && <label className="min-h-8 shrink-0 pl-2 text-gray-400">{label}</label>}
      <pre
        className="max-h-[90dvh] min-h-0 grow overflow-auto rounded-sm border border-gray-800 bg-gray-950 p-4 font-mono text-body-sm break-all whitespace-pre-wrap text-gray-200"
        data-has-value={value ? '' : undefined}
      >
        {value || <span className="text-gray-600">{placeholder}</span>}
      </pre>
    </fieldset>
  )
}
