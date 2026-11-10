import { useCopyToClipboard, useDownload, useToast } from '@/hooks'
import type {
  GeneratorFieldsOutputProps,
  GeneratorFile,
  GeneratorFilesOutputProps,
  GeneratorImageDownload,
  GeneratorImageOutputProps,
  GeneratorListOutputProps,
  GeneratorOutputView,
  GeneratorPlaceholderProps,
  GeneratorSwatchesOutputProps,
} from '@/types'

import { Button } from '../button/Button'
import { CopyButton } from '../button/CopyButton'
import { DownloadIcon } from '../icon'
import { CodeOutput, FieldList, OutputImage } from '../output'

const LABEL = 'flex min-h-8 shrink-0 items-center gap-1 pl-2 text-gray-400'
const BOX =
  'max-h-[90dvh] min-h-0 grow overflow-auto rounded-sm border border-gray-800 bg-gray-950 p-4 font-mono text-body-sm break-all whitespace-pre-wrap text-gray-200'
const DOWNLOAD_ALL_STAGGER_MS = 100

const Placeholder = ({ text }: GeneratorPlaceholderProps) => (
  <div className={BOX}>
    <span className="text-gray-600">{text}</span>
  </div>
)

const FieldsOutput = ({ fields, label, placeholder }: GeneratorFieldsOutputProps) => (
  <section aria-label={label} className="flex min-h-0 w-full grow flex-col gap-1">
    {fields === null || fields.length === 0 ? <Placeholder text={placeholder} /> : <FieldList fields={fields} />}
  </section>
)

const ImageOutput = ({ image, label, placeholder }: GeneratorImageOutputProps) => {
  const { downloadBlob } = useDownload()
  const showError = useToast((s) => s.showError)

  // Built on click: a PNG needs a canvas, and the preview never waits for it.
  const download = async (file: GeneratorImageDownload) => {
    try {
      downloadBlob(await file.blob(), file.filename)
    } catch {
      showError(`Failed to create ${file.filename}`)
    }
  }

  return (
    <section aria-label={label} className="flex min-h-0 w-full grow flex-col gap-2">
      <div className={LABEL}>
        <span>{label}</span>
      </div>
      {image === null ? (
        <Placeholder text={placeholder} />
      ) : (
        <>
          <OutputImage alt={image.alt} src={image.src} />
          <div className="flex flex-wrap gap-2">
            {image.downloads.map((file, i) => (
              <Button
                icon={<DownloadIcon size={14} />}
                key={file.filename}
                onClick={() => void download(file)}
                size="small"
                variant={i === 0 ? 'primary' : 'default'}
              >
                {file.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

const SwatchesOutput = ({ copyAllLabel, itemLabel, label, placeholder, value }: GeneratorSwatchesOutputProps) => {
  const copyToClipboard = useCopyToClipboard()
  const swatches = value?.swatches ?? []

  return (
    <section className="flex min-h-0 w-full grow flex-col gap-1">
      <div className={LABEL}>
        <span>{label}</span>
        <CopyButton label={copyAllLabel} value={value?.copyAll ?? ''} />
      </div>
      {swatches.length === 0 ? (
        <Placeholder text={placeholder} />
      ) : (
        <ul className="grid grid-cols-1 gap-2 tablet:grid-cols-5">
          {swatches.map((swatch, i) => (
            // A palette can repeat a colour.
            <li className="flex" key={`${i}-${swatch.value}`}>
              {/* raw button: the swatch itself is the copy target, filled with its own colour */}
              <button
                aria-label={`Copy ${itemLabel} ${swatch.value} to clipboard`}
                className="group relative flex min-h-24 w-full cursor-pointer flex-col items-center justify-end overflow-hidden rounded-lg border border-gray-700 p-2 transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                onClick={() => void copyToClipboard(swatch.value)}
                style={{ backgroundColor: swatch.color }}
                type="button"
              >
                <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />
                <span className="relative z-10 flex flex-col items-center gap-0.5 text-center opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                  {swatch.details.map((detail) => (
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-body-xs text-white" key={detail}>
                      {detail}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const ListOutput = ({ itemLabel, label, placeholder, values }: GeneratorListOutputProps) => (
  <section className="flex min-h-0 w-full grow flex-col gap-1">
    <div className={LABEL}>
      <span>{values.length > 0 ? `${label} (${values.length})` : label}</span>
      <CopyButton label={`all ${label}`} value={values.join('\n')} />
    </div>
    <div className={BOX}>
      {values.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {values.map((value, i) => (
            <li className="flex items-center justify-between gap-2" key={`${i}-${value}`}>
              <span>
                {values.length > 1 && <span className="text-gray-600">{i + 1}. </span>}
                {value}
              </span>
              <CopyButton label={`${itemLabel} ${i + 1}`} value={value} />
            </li>
          ))}
        </ol>
      ) : (
        <span className="text-gray-600">{placeholder}</span>
      )}
    </div>
  </section>
)

const FilesOutput = ({ files, placeholder }: GeneratorFilesOutputProps) => {
  const { downloadBlob } = useDownload()

  if (files === null || files.length === 0) {
    return (
      <section className="flex min-h-0 w-full grow flex-col gap-1">
        <pre className={BOX}>
          <span className="text-gray-600">{placeholder}</span>
        </pre>
      </section>
    )
  }

  const download = (file: GeneratorFile) =>
    downloadBlob(new Blob([file.value], { type: file.mimeType ?? 'text/plain' }), file.filename)

  // Browsers drop back-to-back programmatic downloads; stagger them.
  const downloadAll = () =>
    files.forEach((file, i) => window.setTimeout(() => download(file), i * DOWNLOAD_ALL_STAGGER_MS))

  return (
    <div className="flex min-h-0 w-full grow flex-col gap-4">
      {files.map((file) => (
        <CodeOutput
          key={file.filename}
          label={
            <span className="flex items-center gap-1">
              <span>{file.label}</span>
              <CopyButton label={file.label} value={file.value} />
            </span>
          }
          placeholder={placeholder}
          value={file.value}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        {files.map((file) => (
          <Button icon={<DownloadIcon size={14} />} key={file.filename} onClick={() => download(file)} size="small">
            {`Download ${file.filename}`}
          </Button>
        ))}
        {files.length > 1 && (
          <Button icon={<DownloadIcon size={14} />} onClick={downloadAll} size="small">
            Download all
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * The Generator shell's output pane, one named kind at a time (no free-form
 * slot): `text` (Copy in the label), `list` (Copy all in the label, Copy per
 * row), `files` (Copy in each block's label, Download at the bottom),
 * `fields` (Copy per row), `image` (preview, Download at the bottom) and
 * `swatches` (Copy all in the label, each swatch copies on click).
 */
export const GeneratorOutput = ({ view }: { view: GeneratorOutputView }) => {
  switch (view.kind) {
    case 'fields':
      return <FieldsOutput fields={view.value} label={view.output.label} placeholder={view.output.placeholder} />
    case 'files':
      return <FilesOutput files={view.value} placeholder={view.output.placeholder} />
    case 'image':
      return <ImageOutput image={view.value} label={view.output.label} placeholder={view.output.placeholder} />
    case 'list':
      return (
        <ListOutput
          itemLabel={view.output.itemLabel}
          label={view.output.label}
          placeholder={view.output.placeholder}
          values={view.value ?? []}
        />
      )
    case 'swatches':
      return (
        <SwatchesOutput
          copyAllLabel={view.output.copyAllLabel}
          itemLabel={view.output.itemLabel}
          label={view.output.label}
          placeholder={view.output.placeholder}
          value={view.value}
        />
      )
    case 'text':
      return (
        <CodeOutput
          label={
            <span className="flex items-center gap-1">
              <span>{view.output.label}</span>
              <CopyButton label={view.output.label} value={view.value ?? ''} />
            </span>
          }
          placeholder={view.output.placeholder}
          value={view.value ?? ''}
        />
      )
  }
}
