import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { BorderRadiusConfig } from '@/utils/border-radius'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { DEFAULT_BORDER_RADIUS, generateBorderRadiusCss } from '@/utils/border-radius'

const toolEntry = TOOL_REGISTRY_MAP['css-border-radius-generator']

const CORNERS = [
  { hKey: 'topLeft', label: 'Top Left', vKey: 'topLeftV' },
  { hKey: 'topRight', label: 'Top Right', vKey: 'topRightV' },
  { hKey: 'bottomRight', label: 'Bottom Right', vKey: 'bottomRightV' },
  { hKey: 'bottomLeft', label: 'Bottom Left', vKey: 'bottomLeftV' },
] as const

export const BorderRadiusGenerator = (_props: ToolComponentProps) => {
  const [config, setConfig] = useState<BorderRadiusConfig>(DEFAULT_BORDER_RADIUS)

  const css = generateBorderRadiusCss(config)
  const cssValue = css.replace('border-radius: ', '').replace(';', '')

  const update = (key: keyof BorderRadiusConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            aria-pressed={config.asymmetric}
            className={`rounded border px-3 py-1 text-body-xs ${config.asymmetric ? 'border-primary bg-primary/20 text-primary' : 'border-gray-700 text-gray-500'}`}
            onClick={() => update('asymmetric', !config.asymmetric)}
            type="button"
          >
            Asymmetric
          </button>
        </div>

        {CORNERS.map((corner) => (
          <div className="flex flex-col gap-1" key={corner.hKey}>
            <FieldForm
              label={`${corner.label}${config.asymmetric ? ' H' : ''}: ${config[corner.hKey] as number}px`}
              max={100}
              min={0}
              name={corner.hKey}
              onChange={(val: string) => update(corner.hKey, Number(val))}
              type="range"
              value={String(config[corner.hKey])}
            />
            {config.asymmetric && (
              <FieldForm
                label={`${corner.label} V: ${config[corner.vKey] as number}px`}
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

      <div
        className="flex min-h-[160px] items-center justify-center border-2 border-gray-700 bg-primary/30"
        style={{ borderRadius: cssValue }}
      >
        <span className="text-body-sm text-gray-300">Preview</span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="text-body-xs font-medium text-gray-400">CSS</span>
          <CopyButton label="CSS" value={css} />
        </div>
        <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-body-xs text-gray-300">
          {css}
        </pre>
      </div>
    </div>
  )
}
