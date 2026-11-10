import { TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CertificateInfo, ToolComponentProps, TransformerField } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['certificate-decoder']

const INITIAL: { source: string } = { source: '' }

const VALIDITY_LABEL = 'Validity'

const formatRelativeTime = (date: Date) => {
  const diff = date.getTime() - Date.now()
  const absDays = Math.abs(Math.round(diff / (1000 * 60 * 60 * 24)))

  if (absDays === 0) return 'today'
  if (diff > 0) return `in ${absDays} day${absDays !== 1 ? 's' : ''}`
  return `${absDays} day${absDays !== 1 ? 's' : ''} ago`
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

// Only the valid wording starts with "Valid —"; `notices` relies on that.
const describeValidity = ({ notAfter, notBefore, validityStatus }: CertificateInfo): string => {
  if (validityStatus === 'expired') return `Expired — expired ${formatRelativeTime(notAfter)}`
  if (validityStatus === 'not-yet-valid') return `Not yet valid — starts ${formatRelativeTime(notBefore)}`
  if (validityStatus === 'malformed-dates') return 'Malformed dates — notBefore is after notAfter'
  return `Valid — expires ${formatRelativeTime(notAfter)}`
}

const toFields = (info: CertificateInfo): Array<TransformerField> => [
  { copy: false, label: VALIDITY_LABEL, value: describeValidity(info) },
  { label: 'Subject', value: info.subject },
  { label: 'Issuer', value: info.issuer },
  { label: 'Serial Number', value: info.serialNumber },
  {
    copyValue: isoDate(info.notBefore),
    label: 'Not Before',
    value: `${isoDate(info.notBefore)} (${formatRelativeTime(info.notBefore)})`,
  },
  {
    copyValue: isoDate(info.notAfter),
    label: 'Not After',
    value: `${isoDate(info.notAfter)} (${formatRelativeTime(info.notAfter)})`,
  },
  {
    label: 'Public Key',
    value: info.publicKeySize > 0 ? `${info.publicKeyAlgorithm} ${info.publicKeySize} bits` : info.publicKeyAlgorithm,
  },
  { label: 'Signature Algorithm', value: info.signatureAlgorithm },
  ...info.extensions.map((ext) => ({ label: ext.critical ? `${ext.name} (critical)` : ext.name, value: ext.value })),
]

export const CertificateDecoder = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={async ({ source }) => {
      const { parsePemCertificate } = await import('@/utils/certificate-decoder')
      return toFields(await parsePemCertificate(source.trim()))
    }}
    description={toolEntry?.description}
    errorFallback="Certificate format not recognized"
    initial={INITIAL}
    // An expired / not-yet-valid certificate still decodes; say so above the work area.
    notices={(fields) => {
      const validity = fields.find((f) => f.label === VALIDITY_LABEL)?.value
      return validity && !validity.startsWith('Valid —') ? [validity] : []
    }}
    onAfterClose={onAfterClose}
    outputKind="fields"
    // Certificates are not newly persisted: nothing pasted here reaches localStorage.
    persistInput={false}
    resultLabel="Certificate"
    resultPlaceholder="Paste a PEM certificate to decode it"
    sourceLabel="PEM certificate"
    sourcePlaceholder="-----BEGIN CERTIFICATE-----"
    title="Certificate Decoder"
    triggerLabel="Decode Certificate"
  />
)
