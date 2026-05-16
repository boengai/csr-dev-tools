import { useEffect, useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type {
  AspectRatioInput,
  AspectRatioLastEdited,
  AspectRatioLocked,
  AspectRatioOutput,
} from '@/types'
import { solveAspectRatio, tv } from '@/utils'

const lockIndicatorStyles = tv({
  base: "relative ml-1 text-body-xs before:absolute before:inset-[-10px] before:content-['']",
  variants: {
    locked: {
      true: 'text-blue-400',
      false: 'text-gray-500',
    },
  },
})

const presetButtonStyles = tv({
  base: 'rounded-md border px-3 py-1.5 text-body-sm transition-colors',
  variants: {
    active: {
      true: 'border-blue-500 bg-blue-500/20 text-blue-300',
      false: 'border-gray-600 text-gray-300 hover:border-gray-400',
    },
  },
})

const toolEntry = TOOL_REGISTRY_MAP['aspect-ratio-calculator']

const PRESETS = [
  { label: '16:9', w: 16, h: 9 },
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
  { label: '21:9', w: 21, h: 9 },
  { label: '9:16', w: 9, h: 16 },
]

type Fields = {
  width: string
  height: string
  ratio: string
  lastEdited: AspectRatioLastEdited
  locked: AspectRatioLocked
}

const INITIAL_FIELDS: Fields = {
  height: '',
  lastEdited: 'width',
  locked: null,
  ratio: '',
  width: '',
}

export const AspectRatioCalculator = () => {
  const { showError } = useToast()
  const [fields, setFields] = useState<Fields>(INITIAL_FIELDS)

  const { result, setInput, setInputImmediate } = useToolComputation<AspectRatioInput, AspectRatioOutput | null>(
    solveAspectRatio,
    {
      debounceMs: 300,
      initial: null,
      isEmpty: ({ height, ratio, source, width }) => {
        if (source === 'width') return !width.trim()
        if (source === 'height') return !height.trim()
        return !ratio.trim()
      },
      onError: (err) => showError(err instanceof Error ? err.message : 'Invalid input'),
    },
  )

  useEffect(() => {
    if (result) {
      setFields((prev) => ({ ...prev, ...result }))
    }
  }, [result])

  const handleWidthChange = (val: string) => {
    setFields((prev) => {
      if (val.trim() === '') {
        return {
          ...prev,
          height: prev.locked === 'height' ? prev.height : '',
          lastEdited: 'width',
          ratio: '',
          width: '',
        }
      }
      return { ...prev, lastEdited: 'width', width: val }
    })
    const input: AspectRatioInput = {
      height: fields.height,
      lastEdited: 'width',
      locked: fields.locked,
      ratio: fields.ratio,
      source: 'width',
      width: val,
    }
    if (val.trim() === '') {
      setInputImmediate(input)
      return
    }
    setInput(input)
  }

  const handleHeightChange = (val: string) => {
    setFields((prev) => {
      if (val.trim() === '') {
        return {
          ...prev,
          height: '',
          lastEdited: 'height',
          ratio: '',
          width: prev.locked === 'width' ? prev.width : '',
        }
      }
      return { ...prev, height: val, lastEdited: 'height' }
    })
    const input: AspectRatioInput = {
      height: val,
      lastEdited: 'height',
      locked: fields.locked,
      ratio: fields.ratio,
      source: 'height',
      width: fields.width,
    }
    if (val.trim() === '') {
      setInputImmediate(input)
      return
    }
    setInput(input)
  }

  const handleRatioChange = (val: string) => {
    setFields((prev) => ({ ...prev, ratio: val }))
    const input: AspectRatioInput = {
      height: fields.height,
      lastEdited: fields.lastEdited,
      locked: fields.locked,
      ratio: val,
      source: 'ratio',
      width: fields.width,
    }
    if (val.trim() === '') {
      setInputImmediate(input)
      return
    }
    setInput(input)
  }

  const applyRatio = (rw: number, rh: number) => {
    const ratioStr = `${rw}:${rh}`
    setFields((prev) => ({ ...prev, ratio: ratioStr }))
    setInputImmediate({
      height: fields.height,
      lastEdited: fields.lastEdited,
      locked: fields.locked,
      ratio: ratioStr,
      source: 'ratio',
      width: fields.width,
    })
  }

  const toggleLock = (dim: 'width' | 'height') => {
    setFields((prev) => ({ ...prev, locked: prev.locked === dim ? null : dim }))
  }

  const { height, locked, ratio, width } = fields

  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div aria-live="polite" className="flex w-full flex-col gap-4">
        <div className="flex w-full items-center gap-2 *:min-w-0 *:flex-1">
          <FieldForm
            label={
              <span className="flex items-center gap-1">
                Width
                <button
                  className={lockIndicatorStyles({ locked: locked === 'width' })}
                  onClick={() => toggleLock('width')}
                  title={locked === 'width' ? 'Unlock width' : 'Lock width'}
                  type="button"
                >
                  {locked === 'width' ? '🔒' : '🔓'}
                </button>
              </span>
            }
            name="width"
            onChange={handleWidthChange}
            placeholder="1920"
            suffix={<CopyButton label="Width" value={width} />}
            type="text"
            value={width}
          />
          <FieldForm
            label={
              <span className="flex items-center gap-1">
                Height
                <button
                  className={lockIndicatorStyles({ locked: locked === 'height' })}
                  onClick={() => toggleLock('height')}
                  title={locked === 'height' ? 'Unlock height' : 'Lock height'}
                  type="button"
                >
                  {locked === 'height' ? '🔒' : '🔓'}
                </button>
              </span>
            }
            name="height"
            onChange={handleHeightChange}
            placeholder="1080"
            suffix={<CopyButton label="Height" value={height} />}
            type="text"
            value={height}
          />
        </div>

        <FieldForm
          label="Ratio"
          name="ratio"
          onChange={handleRatioChange}
          placeholder="16:9"
          suffix={<CopyButton label="Ratio" value={ratio} />}
          type="text"
          value={ratio}
        />

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              className={presetButtonStyles({ active: ratio === preset.label })}
              key={preset.label}
              onClick={() => applyRatio(preset.w, preset.h)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
