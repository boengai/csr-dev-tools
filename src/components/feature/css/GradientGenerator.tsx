import { useState } from 'react'

import type { GradientConfig, GradientStop, GradientType } from '@/utils'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { DEFAULT_GRADIENT, generateGradientCss } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['css-gradient-generator']

const ITEM_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a']

export const GradientGenerator = () => {
  const [config, setConfig] = useState<GradientConfig>(DEFAULT_GRADIENT)

  const cssValue = generateGradientCss(config.type, config.angle, config.stops)

  const handleTypeChange = (value: string) => {
    setConfig((prev) => ({ ...prev, type: value as GradientType }))
  }

  const handleAngleChange = (value: string) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return
    setConfig((prev) => ({ ...prev, angle: parsed }))
  }

  const handleStopColorChange = (index: number, color: string) => {
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.map((s, i) => (i === index ? { ...s, color } : s)),
    }))
  }

  const handleStopPositionChange = (index: number, value: string) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.map((s, i) => (i === index ? { ...s, position: parsed } : s)),
    }))
  }

  const addStop = () => {
    setConfig((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          color: ITEM_COLORS[prev.stops.length % ITEM_COLORS.length],
          position: 50,
        },
      ],
    }))
  }

  const removeStop = (index: number) => {
    if (config.stops.length <= 2) return
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex items-center gap-4">
          <label className="text-body-sm text-gray-100" htmlFor="grad-type">
            Type
          </label>
          <select
            className="text-sm rounded border border-gray-700 bg-transparent px-2 py-1 text-gray-100"
            id="grad-type"
            onChange={(e) => handleTypeChange(e.target.value)}
            value={config.type}
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </div>

        {config.type === 'linear' && (
          <FieldForm
            label="Angle"
            max={360}
            min={0}
            name="grad-angle"
            onChange={handleAngleChange}
            type="range"
            value={String(config.angle)}
          />
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium text-gray-400">Color Stops</span>
            <button
              className="text-xs rounded border border-gray-700 px-2 py-0.5 text-gray-400 hover:text-gray-100"
              onClick={addStop}
              type="button"
            >
              + Add Stop
            </button>
          </div>

          {config.stops.map((stop: GradientStop, index: number) => (
            <div className="flex items-center gap-3" key={index}>
              <input
                aria-label={`Stop ${index + 1} color`}
                className="h-8 w-12 cursor-pointer rounded border border-gray-700 bg-transparent"
                onChange={(e) => handleStopColorChange(index, e.target.value)}
                type="color"
                value={stop.color}
              />
              <div className="flex-1">
                <FieldForm
                  label={`Position ${index + 1}`}
                  max={100}
                  min={0}
                  name={`grad-stop-${index}`}
                  onChange={(val: string) => handleStopPositionChange(index, val)}
                  type="range"
                  value={String(stop.position)}
                />
              </div>
              {config.stops.length > 2 && (
                <button
                  aria-label={`Remove stop ${index + 1}`}
                  className="text-xs text-red-400 hover:text-red-300 rounded border border-gray-700 px-2 py-0.5"
                  onClick={() => removeStop(index)}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div
        className="flex h-48 items-center justify-center rounded-lg border border-gray-800"
        style={{ background: cssValue }}
      />

      <div aria-live="polite" className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium text-gray-400">CSS Output</span>
          <CopyButton label="CSS gradient" value={`background: ${cssValue};`} />
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <code className="text-sm font-mono text-gray-300">background: {cssValue};</code>
        </div>
      </div>
    </div>
  )
}
