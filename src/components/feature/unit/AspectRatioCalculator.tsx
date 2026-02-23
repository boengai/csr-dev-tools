import { useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { calculateDimension, parseRatio, simplifyRatio } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['aspect-ratio-calculator']

const PRESETS = [
  { label: '16:9', w: 16, h: 9 },
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
  { label: '21:9', w: 21, h: 9 },
  { label: '9:16', w: 9, h: 16 },
]

export const AspectRatioCalculator = () => {
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [ratio, setRatio] = useState('')
  const [lastEdited, setLastEdited] = useState<'width' | 'height'>('width')
  const [locked, setLocked] = useState<'width' | 'height' | null>(null)
  const { toast } = useToast()

  const showError = (label: string) => toast({ action: 'add', item: { label, type: 'error' } })

  // Non-debounced recalculation for preset buttons (immediate response)
  const recalcFromWidthAndRatio = (w: string, ratioStr: string) => {
    if (w.trim() === '' || ratioStr.trim() === '') return
    const wNum = Number(w)
    if (Number.isNaN(wNum) || wNum <= 0) return
    const parsed = parseRatio(ratioStr)
    if (!parsed) return
    setHeight(Math.round(calculateDimension(wNum, parsed.w, parsed.h, 'height')).toString())
  }

  const recalcFromHeightAndRatio = (h: string, ratioStr: string) => {
    if (h.trim() === '' || ratioStr.trim() === '') return
    const hNum = Number(h)
    if (Number.isNaN(hNum) || hNum <= 0) return
    const parsed = parseRatio(ratioStr)
    if (!parsed) return
    setWidth(Math.round(calculateDimension(hNum, parsed.w, parsed.h, 'width')).toString())
  }

  // Debounced handlers with validation inside (matching UnitPxToRem pattern)
  const dbProcessWidth = useDebounceCallback((w: string, ratioStr: string, h: string) => {
    const wNum = Number(w)
    if (Number.isNaN(wNum) || wNum <= 0) {
      showError('Enter a valid width (e.g., 1920)')
      return
    }
    if (ratioStr.trim()) {
      const parsed = parseRatio(ratioStr)
      if (!parsed) return
      setHeight(Math.round(calculateDimension(wNum, parsed.w, parsed.h, 'height')).toString())
    } else if (h.trim()) {
      const hNum = Number(h)
      if (!Number.isNaN(hNum) && hNum > 0) {
        setRatio(simplifyRatio(wNum, hNum))
      }
    }
  }, 300)

  const dbProcessHeight = useDebounceCallback((h: string, ratioStr: string, w: string) => {
    const hNum = Number(h)
    if (Number.isNaN(hNum) || hNum <= 0) {
      showError('Enter a valid height (e.g., 1080)')
      return
    }
    if (ratioStr.trim()) {
      const parsed = parseRatio(ratioStr)
      if (!parsed) return
      setWidth(Math.round(calculateDimension(hNum, parsed.w, parsed.h, 'width')).toString())
    } else if (w.trim()) {
      const wNum = Number(w)
      if (!Number.isNaN(wNum) && wNum > 0) {
        setRatio(simplifyRatio(wNum, hNum))
      }
    }
  }, 300)

  const dbProcessRatio = useDebounceCallback(
    (
      val: string,
      w: string,
      h: string,
      currentLocked: 'width' | 'height' | null,
      currentLastEdited: 'width' | 'height',
    ) => {
      if (val.trim() === '') return
      const parsed = parseRatio(val)
      if (!parsed) {
        showError('Enter a valid ratio (e.g., 16:9 or 1.778)')
        return
      }
      const ratioStr = `${parsed.w}:${parsed.h}`
      if (currentLocked === 'width' && w.trim()) {
        recalcFromWidthAndRatio(w, ratioStr)
      } else if (currentLocked === 'height' && h.trim()) {
        recalcFromHeightAndRatio(h, ratioStr)
      } else if (currentLastEdited === 'width' && w.trim()) {
        recalcFromWidthAndRatio(w, ratioStr)
      } else if (currentLastEdited === 'height' && h.trim()) {
        recalcFromHeightAndRatio(h, ratioStr)
      }
    },
    300,
  )

  const handleWidthChange = (val: string) => {
    setWidth(val)
    setLastEdited('width')
    if (val.trim() === '') {
      if (locked !== 'height') setHeight('')
      setRatio('')
      return
    }
    dbProcessWidth(val, ratio, height)
  }

  const handleHeightChange = (val: string) => {
    setHeight(val)
    setLastEdited('height')
    if (val.trim() === '') {
      if (locked !== 'width') setWidth('')
      setRatio('')
      return
    }
    dbProcessHeight(val, ratio, width)
  }

  const handleRatioChange = (val: string) => {
    setRatio(val)
    if (val.trim() === '') return
    dbProcessRatio(val, width, height, locked, lastEdited)
  }

  const applyRatio = (rw: number, rh: number) => {
    const ratioStr = `${rw}:${rh}`
    setRatio(ratioStr)

    if (locked === 'width' && width.trim()) {
      recalcFromWidthAndRatio(width, ratioStr)
    } else if (locked === 'height' && height.trim()) {
      recalcFromHeightAndRatio(height, ratioStr)
    } else if (lastEdited === 'width' && width.trim()) {
      recalcFromWidthAndRatio(width, ratioStr)
    } else if (lastEdited === 'height' && height.trim()) {
      recalcFromHeightAndRatio(height, ratioStr)
    }
  }

  const toggleLock = (dim: 'width' | 'height') => {
    setLocked((prev) => (prev === dim ? null : dim))
  }

  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div aria-live="polite" className="flex w-full flex-col gap-4">
        <div className="flex w-full items-center gap-2 *:min-w-0 *:flex-1">
          <FieldForm
            label={
              <span className="flex items-center gap-1">
                Width
                <button
                  className={`ml-1 text-body-xs ${locked === 'width' ? 'text-blue-400' : 'text-gray-500'}`}
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
                  className={`ml-1 text-body-xs ${locked === 'height' ? 'text-blue-400' : 'text-gray-500'}`}
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
              className={`rounded-md border px-3 py-1.5 text-body-sm transition-colors ${
                ratio === preset.label
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 text-gray-300 hover:border-gray-400'
              }`}
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
