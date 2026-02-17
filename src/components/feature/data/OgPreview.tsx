import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { OgConfig } from '@/utils'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { generateOgMetaTags } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['og-preview']

const DEFAULT_CONFIG: OgConfig = {
  description: '',
  image: '',
  siteName: '',
  title: '',
  url: '',
}

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url || 'example.com'
  }
}

const ImagePlaceholder = ({ label }: { label: string }) => (
  <div className="flex aspect-video w-full items-center justify-center bg-gray-800 text-body-xs text-gray-500">
    {label || '🖼️ Image Preview'}
  </div>
)

const TwitterCard = ({ config }: { config: OgConfig }) => (
  <div className="flex flex-col overflow-hidden rounded-xl border border-gray-700">
    <ImagePlaceholder label={config.image} />
    <div className="flex flex-col gap-0.5 p-3">
      <span className="truncate text-body-sm font-bold text-gray-200">{config.title || 'Page Title'}</span>
      <span className="line-clamp-2 text-body-xs text-gray-400">{config.description || 'Page description...'}</span>
      <span className="text-body-xs text-gray-500">{getDomain(config.url)}</span>
    </div>
  </div>
)

const FacebookCard = ({ config }: { config: OgConfig }) => (
  <div className="flex flex-col overflow-hidden border border-gray-700">
    <ImagePlaceholder label={config.image} />
    <div className="flex flex-col gap-0.5 bg-gray-900 p-3">
      <span className="text-body-xs uppercase text-gray-500">{getDomain(config.url)}</span>
      <span className="truncate text-body-sm font-bold text-blue-400">{config.title || 'Page Title'}</span>
      <span className="line-clamp-2 text-body-xs text-gray-400">{config.description || 'Page description...'}</span>
    </div>
  </div>
)

const LinkedInCard = ({ config }: { config: OgConfig }) => (
  <div className="flex flex-col overflow-hidden rounded-lg border border-gray-700">
    <ImagePlaceholder label={config.image} />
    <div className="flex flex-col gap-0.5 p-3">
      <span className="truncate text-body-sm font-bold text-gray-200">{config.title || 'Page Title'}</span>
      <span className="text-body-xs text-gray-500">{config.siteName || 'Source'}</span>
    </div>
  </div>
)

export const OgPreview = (_: ToolComponentProps) => {
  const [config, setConfig] = useState<OgConfig>({ ...DEFAULT_CONFIG })

  const metaTags = generateOgMetaTags(config)

  const updateField = (field: keyof OgConfig) => (value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="flex flex-col gap-3">
        <FieldForm
          label="og:title"
          name="og-title"
          onChange={updateField('title')}
          placeholder="My Awesome Page"
          type="text"
          value={config.title}
        />
        <FieldForm
          label="og:description"
          name="og-description"
          onChange={updateField('description')}
          placeholder="A great page about awesome things"
          type="text"
          value={config.description}
        />
        <FieldForm
          label="og:image"
          name="og-image"
          onChange={updateField('image')}
          placeholder="https://example.com/image.png"
          type="text"
          value={config.image}
        />
        <FieldForm
          label="og:site_name"
          name="og-site-name"
          onChange={updateField('siteName')}
          placeholder="Example"
          type="text"
          value={config.siteName}
        />
        <FieldForm
          label="og:url"
          name="og-url"
          onChange={updateField('url')}
          placeholder="https://example.com/page"
          type="text"
          value={config.url}
        />
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div className="grid gap-4 tablet:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-body-sm font-medium text-gray-300">Twitter Card</h3>
          <TwitterCard config={config} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-body-sm font-medium text-gray-300">Facebook</h3>
          <FacebookCard config={config} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-body-sm font-medium text-gray-300">LinkedIn</h3>
          <LinkedInCard config={config} />
        </div>
      </div>

      {metaTags && (
        <div aria-live="polite" className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-medium text-gray-400">Meta Tags</span>
            <CopyButton label="meta tags" value={metaTags} />
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">{metaTags}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
