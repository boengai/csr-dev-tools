import { useState } from 'react'

import { ColorInput, CssOutputCell, FieldForm, ToggleButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { type BorderRadiusConfig, DEFAULT_BORDER_RADIUS, generateBorderRadiusCss } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['css-border-radius-generator']

const CORNERS = [
  { hKey: 'topLeft', label: 'Top Left', vKey: 'topLeftV' },
  { hKey: 'topRight', label: 'Top Right', vKey: 'topRightV' },
  { hKey: 'bottomRight', label: 'Bottom Right', vKey: 'bottomRightV' },
  { hKey: 'bottomLeft', label: 'Bottom Left', vKey: 'bottomLeftV' },
] as const

export const BorderRadiusGenerator = (_props: ToolComponentProps) => {
  const [config, setConfig] = useState<BorderRadiusConfig>(DEFAULT_BORDER_RADIUS)
  const [previewBg, setPreviewBg] = useState('#6366f1')

  const css = generateBorderRadiusCss(config)
  const cssValue = css.replace('border-radius: ', '').replace(';', '')

  const update = (key: keyof BorderRadiusConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <ToggleButton
            onClick={() => update('asymmetric', !config.asymmetric)}
            pressed={config.asymmetric}
            variant="subtle"
          >
            Asymmetric
          </ToggleButton>
        </div>

        {CORNERS.map((corner) => (
          <div className="flex flex-col gap-1" key={corner.hKey}>
            <FieldForm
              label={`${corner.label}${config.asymmetric ? ' H' : ''}`}
              max={100}
              min={0}
              name={corner.hKey}
              onChange={(val: string) => update(corner.hKey, Number(val))}
              type="range"
              value={String(config[corner.hKey])}
            />
            {config.asymmetric && (
              <FieldForm
                label={`${corner.label} V`}
                max={100}
                min={0}
                name={corner.vKey}
                onChange={(val: string) => update(corner.vKey, Number(val))}
                type="range"
                value={String(config[corner.vKey])}
              />
            )}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div
        className="relative flex items-center justify-center rounded-lg border border-gray-800 p-16"
        style={{ backgroundColor: previewBg }}
      >
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <label className="text-body-xs text-gray-500" htmlFor="br-preview-bg">
            BG
          </label>
          <ColorInput id="br-preview-bg" onChange={setPreviewBg} value={previewBg} />
        </div>
        <div className="h-32 w-48 border border-gray-200 bg-white" style={{ borderRadius: cssValue }} />
      </div>

      <CssOutputCell copyLabel="CSS" size="compact" value={css} />
    </div>
  )
}
