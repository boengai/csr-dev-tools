import { useState } from 'react'

import { CodeInput, CopyButton } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { type CertificateExtension, type CertificateInfo, cnMerge, tv, type ValidityStatus } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['certificate-decoder']

const resultValueStyles = tv({
  base: 'truncate text-body-xs text-gray-200',
  variants: {
    mono: {
      true: 'font-mono',
      false: '',
    },
  },
})

const ResultRow = ({
  copyValue,
  label,
  mono = true,
  value,
}: {
  copyValue?: string
  label: string
  mono?: boolean
  value: string
}) => (
  <div className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-3 py-2">
    <span className="shrink-0 text-body-xs text-gray-400">{label}</span>
    <div className="flex items-center gap-1 overflow-hidden">
      <span className={resultValueStyles({ mono })}>{value}</span>
      <CopyButton label={label} value={copyValue ?? value} />
    </div>
  </div>
)

const VALIDITY_CONFIG: Record<ValidityStatus, { icon: string; label: string; style: string }> = {
  expired: { icon: '✗', label: 'Expired', style: 'border-red-800 bg-red-950 text-red-400' },
  'malformed-dates': {
    icon: '⚠',
    label: 'Malformed dates',
    style: 'border-red-800 bg-red-950 text-red-400',
  },
  'not-yet-valid': { icon: '○', label: 'Not yet valid', style: 'border-amber-800 bg-amber-950 text-amber-400' },
  valid: { icon: '✓', label: 'Valid', style: 'border-green-800 bg-green-950 text-green-400' },
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const absDays = Math.abs(Math.round(diff / (1000 * 60 * 60 * 24)))

  if (absDays === 0) return 'today'
  if (diff > 0) return `in ${absDays} day${absDays !== 1 ? 's' : ''}`
  return `${absDays} day${absDays !== 1 ? 's' : ''} ago`
}

const ValidityBadge = ({
  notAfter,
  notBefore,
  status,
}: {
  notAfter: Date
  notBefore: Date
  status: ValidityStatus
}) => {
  const config = VALIDITY_CONFIG[status]
  const relativeText =
    status === 'expired'
      ? `expired ${formatRelativeTime(notAfter)}`
      : status === 'not-yet-valid'
        ? `starts ${formatRelativeTime(notBefore)}`
        : status === 'malformed-dates'
          ? 'notBefore is after notAfter'
          : `expires ${formatRelativeTime(notAfter)}`

  return (
    <div
      className={cnMerge(
        'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-body-xs font-medium',
        config.style,
      )}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>
        {config.label} ({relativeText})
      </span>
    </div>
  )
}

const ExtensionItem = ({ ext }: { ext: CertificateExtension }) => (
  <div className="rounded border border-gray-800 bg-gray-950 px-3 py-2">
    <div className="flex items-center gap-2">
      <span className="text-body-xs font-medium text-gray-300">{ext.name}</span>
      {ext.critical && (
        <span className="bg-amber-900/50 text-amber-400 rounded px-1.5 py-0.5 text-[10px] font-medium">Critical</span>
      )}
    </div>
    <p className="mt-1 font-mono text-body-xs break-all text-gray-400">{ext.value}</p>
  </div>
)

export const CertificateDecoder = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [input, setInputValue] = useState('')
  const { showError } = useToast()

  const {
    result,
    isPending: loading,
    setInput,
    setInputImmediate,
  } = useToolComputation<string, CertificateInfo | null>(
    async (val) => {
      const { parsePemCertificate } = await import('@/utils/certificate-decoder')
      return parsePemCertificate(val.trim())
    },
    {
      debounceMs: 300,
      initial: null,
      isEmpty: (val) => !val.trim(),
      onError: (error) => {
        showError(error instanceof Error ? error.message : 'Certificate format not recognized')
      },
    },
  )

  const handleChange = (val: string) => {
    setInputValue(val)
    setInput(val)
  }

  const handleReset = () => {
    setInputValue('')
    setInputImmediate('')
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="Certificate Decoder"
      triggers={[{ label: 'Decode Certificate' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <CodeInput
          aria-label="PEM certificate input"
          minHeight="200px"
          name="certificate-input"
          onChange={handleChange}
          placeholder="Paste PEM-encoded certificate here..."
          value={input}
        />

        {loading && input.trim() && (
          <p className="text-body-xs text-gray-400" role="status">
            Decoding...
          </p>
        )}

        <div aria-live="polite" className="flex flex-col gap-3">
          {result && !loading && (
            <>
              <ValidityBadge notAfter={result.notAfter} notBefore={result.notBefore} status={result.validityStatus} />

              <div className="flex flex-col gap-2">
                <ResultRow label="Subject" mono={false} value={result.subject} />
                <ResultRow label="Issuer" mono={false} value={result.issuer} />
                <ResultRow label="Serial Number" value={result.serialNumber} />
                <ResultRow
                  copyValue={result.notBefore.toISOString().slice(0, 10)}
                  label="Not Before"
                  mono={false}
                  value={`${result.notBefore.toISOString().slice(0, 10)} (${formatRelativeTime(result.notBefore)})`}
                />
                <ResultRow
                  copyValue={result.notAfter.toISOString().slice(0, 10)}
                  label="Not After"
                  mono={false}
                  value={`${result.notAfter.toISOString().slice(0, 10)} (${formatRelativeTime(result.notAfter)})`}
                />
                <ResultRow
                  label="Public Key"
                  mono={false}
                  value={
                    result.publicKeySize > 0
                      ? `${result.publicKeyAlgorithm} ${result.publicKeySize} bits`
                      : result.publicKeyAlgorithm
                  }
                />
                <ResultRow label="Signature Algorithm" mono={false} value={result.signatureAlgorithm} />
              </div>

              {result.extensions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-body-xs font-medium text-gray-300">Extensions</h3>
                  {result.extensions.map((ext) => (
                    <ExtensionItem ext={ext} key={`${ext.oid}-${ext.name}`} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ToolDialogFrame>
  )
}
