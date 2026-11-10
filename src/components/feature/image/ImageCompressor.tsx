import { useState } from 'react'

import { FieldForm } from '@/components/common'
import { FileProcessorShell } from '@/components/common/file-processor'
import { COMPRESSIBLE_FORMATS, IMAGE_FILE_NOUN, TOOL_REGISTRY_MAP } from '@/constants'
import type { CompressControls, CompressResultProps, CompressSourceProps, ToolComponentProps } from '@/types'
import { formatFileSize, parseDataUrlToBlob, processImage } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-compressor']

const INITIAL_CONTROLS: CompressControls = { quality: 80 }

const process = async (file: File, { quality }: CompressControls): Promise<Blob> => {
  const result = await processImage(file, { quality: quality / 100, strategy: 'stretch' })
  return parseDataUrlToBlob(result.dataUrl)
}

export const ImageCompressor = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <FileProcessorShell<CompressControls>
    accept="image/jpeg,image/webp"
    autoOpen={autoOpen}
    // The quality slider is dragged like typing: compress once it rests.
    controlsDebounceMs={300}
    description={toolEntry?.description}
    errorLabel="Compression failed — try a different image"
    getDownloadFilename={({ result, sourceName }) => {
      // The output keeps the source's format (WebP stays WebP, JPEG stays JPEG).
      const ext = result.type === 'image/webp' ? 'webp' : 'jpg'
      return `compressed-${sourceName.replace(/\.[^.]+$/, '')}.${ext}`
    }}
    initialControls={INITIAL_CONTROLS}
    noun={IMAGE_FILE_NOUN}
    onAfterClose={onAfterClose}
    process={process}
    rejectToastLabel="Image compression supports JPEG and WebP formats"
    renderControls={({ controls, setControls }) => (
      <div className="shrink-0">
        <FieldForm
          label={`Quality (${controls.quality})`}
          max={100}
          min={1}
          name="quality-slider"
          onChange={(val: string) => setControls({ quality: Number(val) })}
          type="range"
          value={String(controls.quality)}
        />
      </div>
    )}
    renderResult={({ pending, result, resultUrl, source }) => (
      <CompressResult pending={pending} result={result} resultUrl={resultUrl} source={source} />
    )}
    renderSource={({ source, sourceUrl }) => <CompressSource source={source} sourceUrl={sourceUrl} />}
    title="Image Compressor"
    triggerLabel="Compress Image"
    uploadLabel="Select JPEG or WebP image"
    // A closed allow-set: only the formats the compressor re-encodes (ADR-0016).
    validate={(file) => COMPRESSIBLE_FORMATS.has(file.type)}
  />
)

const CompressSource = ({ source, sourceUrl }: CompressSourceProps) => {
  const [size, setSize] = useState<string | null>(null)
  return (
    <div className="bg-grid-texture flex grow flex-col items-center justify-center gap-3 overflow-auto bg-black p-4">
      <p className="shrink-0 text-body-sm font-medium text-gray-300">Original</p>
      <img
        alt="Original"
        className="max-h-[50vh] max-w-full object-contain"
        onLoad={(e) => setSize(`${e.currentTarget.naturalWidth}x${e.currentTarget.naturalHeight}`)}
        src={sourceUrl}
      />
      <p className="shrink-0 text-center text-body-xs text-gray-500">
        {[source.name, size, formatFileSize(source.size)].filter(Boolean).join(' — ')}
      </p>
    </div>
  )
}

const CompressResult = ({ pending, result, resultUrl, source }: CompressResultProps) => {
  const ratio = result ? Math.round((1 - result.size / source.size) * 100) : null
  return (
    <div
      aria-live="polite"
      className="bg-grid-texture flex grow flex-col items-center justify-center gap-3 overflow-auto bg-black p-4"
    >
      <p className="shrink-0 text-body-sm font-medium text-gray-300">Compressed</p>
      {resultUrl && result ? (
        <>
          <img
            alt="Compressed"
            className={`max-h-[50vh] max-w-full object-contain transition-opacity ${pending ? 'opacity-50' : ''}`}
            src={resultUrl}
          />
          <p className="shrink-0 text-center text-body-sm text-gray-300">
            {formatFileSize(source.size)} → {formatFileSize(result.size)}
            {ratio != null && ratio > 0 ? (
              <span className="ml-2 text-success">{ratio}% smaller</span>
            ) : (
              <span className="ml-2 text-warning">No reduction</span>
            )}
          </p>
        </>
      ) : (
        <p className="text-center text-body-xs text-gray-500">
          {pending ? 'Compressing…' : 'Pick a quality to compress.'}
        </p>
      )}
    </div>
  )
}
