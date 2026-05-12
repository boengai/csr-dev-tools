import { useState } from 'react'

import { ColorInput, CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { type BoxShadowConfig, DEFAULT_BOX_SHADOW, generateBoxShadowCSS } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['box-shadow-generator']

export const BoxShadowGenerator = () => {
  const [config, setConfig] = useState<BoxShadowConfig>(DEFAULT_BOX_SHADOW)
  const [previewBg, setPreviewBg] = useState('#ffffff')

  const cssString = generateBoxShadowCSS(config)

  const handleNumberChange =
    (key: keyof Pick<BoxShadowConfig, 'alpha' | 'blur' | 'hOffset' | 'spread' | 'vOffset'>) => (value: string) => {
      const parsed = Number(value)
      if (Number.isNaN(parsed)) return
      setConfig((prev) => ({ ...prev, [key]: parsed }))
    }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div className="flex shrink-0 flex-col gap-3">
        <FieldForm
          label="Horizontal Offset"
          max={100}
          min={-100}
          name="bs-h-offset"
          onChange={handleNumberChange('hOffset')}
          type="range"
          value={String(config.hOffset)}
        />
        <FieldForm
          label="Vertical Offset"
          max={100}
          min={-100}
          name="bs-v-offset"
          onChange={handleNumberChange('vOffset')}
          type="range"
          value={String(config.vOffset)}
        />
        <FieldForm
          label="Blur Radius"
          max={200}
          min={0}
          name="bs-blur"
          onChange={handleNumberChange('blur')}
          type="range"
          value={String(config.blur)}
        />
        <FieldForm
          label="Spread Radius"
          max={100}
          min={-100}
          name="bs-spread"
          onChange={handleNumberChange('spread')}
          type="range"
          value={String(config.spread)}
        />
        <FieldForm
          label="Opacity"
          max={100}
          min={0}
          name="bs-alpha"
          onChange={handleNumberChange('alpha')}
          type="range"
          value={String(config.alpha)}
        />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-100" htmlFor="bs-color">
              Color
            </label>
            <ColorInput
              id="bs-color"
              onChange={(val) => setConfig((prev) => ({ ...prev, color: val }))}
              value={config.color}
            />
          </div>
          <button
            aria-label="Toggle inset shadow"
            aria-pressed={config.inset}
            className="text-xs rounded border px-3 font-mono leading-7 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500"
            data-state={config.inset ? 'active' : 'inactive'}
            onClick={() => setConfig((prev) => ({ ...prev, inset: !prev.inset }))}
            type="button"
          >
            Inset
          </button>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div
        className="relative flex items-center justify-center rounded-lg border border-gray-800 p-16"
        style={{ backgroundColor: previewBg }}
      >
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <label className="text-body-xs text-gray-500" htmlFor="bs-preview-bg">
            BG
          </label>
          <ColorInput id="bs-preview-bg" onChange={setPreviewBg} value={previewBg} />
        </div>
        <div className="h-32 w-48 rounded-lg border border-gray-200 bg-white" style={{ boxShadow: cssString }} />
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium text-gray-400">CSS Output</span>
          <CopyButton label="CSS box-shadow" value={`box-shadow: ${cssString};`} />
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <code className="text-sm font-mono text-gray-300">box-shadow: {cssString};</code>
        </div>
      </div>
    </div>
  )
}
