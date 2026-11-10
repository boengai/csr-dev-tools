import DOMPurify from 'dompurify'
import { useMemo, useState } from 'react'

import { useDownload, useToast } from '@/hooks'
import type {
  TransformerDownloadButtonProps,
  TransformerField,
  TransformerImage,
  TransformerImageOutputProps,
  TransformerMarkupOutputProps,
  TransformerOutputKind,
  TransformerOutputPaneProps,
  TransformerPaneLabelProps,
  TransformerPlaceholderProps,
} from '@/types'
import { tv } from '@/utils'

import { Button, CopyButton } from '../button'
import { DownloadIcon } from '../icon'
import { CodeOutput, FieldList, OutputImage } from '../output'

const markupStyles = tv({
  // `[&_svg]`: a lone SVG (SVG Viewer, Mermaid) scales down to the pane.
  base: 'prose min-h-0 max-w-none grow overflow-auto rounded-sm border border-gray-800 p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full',
  variants: {
    background: {
      dark: 'bg-gray-950 prose-invert',
      light: 'bg-white',
    },
  },
})

const sanitizeMarkup = (markup: string): string =>
  DOMPurify.sanitize(markup, { USE_PROFILES: { html: true, svg: true, svgFilters: true } })

const Placeholder = ({ text }: TransformerPlaceholderProps) => (
  <div
    data-slot="output-placeholder"
    className="flex min-h-24 grow items-center justify-center rounded-sm border border-gray-800 bg-gray-950 p-4 text-body-sm text-gray-600"
  >
    {text}
  </div>
)

const DownloadIconButton = ({ disabled, download }: TransformerDownloadButtonProps) => {
  const { downloadBlob } = useDownload()
  const showError = useToast((s) => s.showError)
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setBusy(true)
    try {
      downloadBlob(await download.file(), download.filename)
    } catch {
      // A download is an action, so its failure toasts (docs/ux → Errors).
      showError(`Failed to download ${download.filename}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      aria-label={`Download ${download.label}`}
      disabled={disabled || busy}
      icon={<DownloadIcon size={14} />}
      onClick={() => void handleClick()}
      size="small"
      variant="text"
    />
  )
}

const PaneLabel = ({
  copyLabel,
  copyValue,
  downloads,
  downloadsDisabled = false,
  label,
}: TransformerPaneLabelProps) => (
  <span className="flex min-h-8 shrink-0 items-center gap-1 pl-2 text-gray-400">
    <span>{label}</span>
    {copyValue !== undefined && <CopyButton label={copyLabel ?? label} value={copyValue} />}
    {downloads?.map((download) => (
      <DownloadIconButton disabled={downloadsDisabled} download={download} key={download.filename} />
    ))}
  </span>
)

const MarkupOutput = ({ background, safeMarkup }: TransformerMarkupOutputProps) => (
  <div className={markupStyles({ background })} dangerouslySetInnerHTML={{ __html: safeMarkup }} />
)

const ImageOutput = ({ image, label, placeholder }: TransformerImageOutputProps) => {
  const { downloadDataUrl } = useDownload()
  return (
    <>
      {image ? <OutputImage alt={image.alt} src={image.src} /> : <Placeholder text={placeholder} />}
      <Button
        aria-label={`Download ${label}`}
        block
        disabled={!image}
        icon={<DownloadIcon />}
        onClick={() => image && downloadDataUrl(image.src, image.filename)}
        variant="primary"
      >
        Download
      </Button>
    </>
  )
}

const isEmptyOutput = (kind: TransformerOutputKind, value: unknown): boolean => {
  if (kind === 'fields') return (value as Array<TransformerField>).length === 0
  if (kind === 'image') return value == null
  return value === ''
}

/** Builds a Blob from a data URL without a network round trip. */
const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => (await fetch(dataUrl)).blob()

/**
 * The result side of the [[Transformer shell]]. One renderer per output kind;
 * every kind shows the Tool's placeholder while its value is empty. The
 * wrapper is the contract harness's output region (`data-slot="tool-output"`).
 */
export const TransformerOutputPane = <K extends TransformerOutputKind>({
  copyAll,
  downloads,
  imageCopyLabel,
  kind,
  label,
  markupBackground = 'dark',
  placeholder,
  value,
}: TransformerOutputPaneProps<K>) => {
  const empty = isEmptyOutput(kind, value)
  // Sanitised once: the preview and Copy both use it, so Copy takes exactly what is shown.
  const safeMarkup = useMemo(() => (kind === 'markup' ? sanitizeMarkup(value as string) : ''), [kind, value])
  const image = kind === 'image' ? (value as TransformerImage | null) : null
  // Built from every row (JSONPath re-parses each match), so only when the rows change.
  const copyAllValue = useMemo(() => (copyAll && !empty ? copyAll(value) : undefined), [copyAll, empty, value])

  return (
    <section
      aria-label={label}
      className="flex min-h-0 w-full grow flex-col gap-1"
      data-has-value={empty ? undefined : ''}
      data-output-kind={kind}
      data-slot="tool-output"
    >
      {kind === 'text' && (
        <CodeOutput
          label={
            <PaneLabel copyValue={value as string} downloads={downloads} downloadsDisabled={empty} label={label} />
          }
          placeholder={placeholder}
          value={value as string}
        />
      )}
      {kind === 'fields' && (
        <>
          <PaneLabel copyValue={copyAllValue} label={label} />
          {empty ? <Placeholder text={placeholder} /> : <FieldList fields={value as Array<TransformerField>} />}
        </>
      )}
      {kind === 'markup' && (
        <>
          <PaneLabel copyValue={safeMarkup} downloads={downloads} downloadsDisabled={empty} label={label} />
          {empty ? (
            <Placeholder text={placeholder} />
          ) : (
            <MarkupOutput background={markupBackground} safeMarkup={safeMarkup} />
          )}
        </>
      )}
      {kind === 'image' &&
        (imageCopyLabel !== undefined ? (
          // Copy and Download together: both in the label, Download as an icon (docs/ux → Buttons).
          <>
            <PaneLabel
              copyLabel={imageCopyLabel}
              copyValue={image?.copy ?? ''}
              downloads={[{ file: () => dataUrlToBlob(image?.src ?? ''), filename: image?.filename ?? 'image', label }]}
              downloadsDisabled={!image}
              label={label}
            />
            {image ? <OutputImage alt={image.alt} src={image.src} /> : <Placeholder text={placeholder} />}
          </>
        ) : (
          <>
            <PaneLabel label={label} />
            <ImageOutput image={image} label={label} placeholder={placeholder} />
          </>
        ))}
    </section>
  )
}
