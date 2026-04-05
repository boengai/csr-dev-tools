import { useMemo, useReducer } from 'react'

import { Button, ColorInput, DownloadIcon, FieldForm, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import {
  canvasToBlob,
  downloadBlob,
  downloadSvg,
  generatePlaceholderCanvas,
  generatePlaceholderSvg,
  PLACEHOLDER_PRESETS,
  type PlaceholderOptions,
} from '@/utils'
import type { State, Action } from "@/types/components/feature/image/placeholderImageGenerator";

const DEFAULT_WIDTH = '800'
const DEFAULT_HEIGHT = '600'
const DEFAULT_BG_COLOR = '#cccccc'
const DEFAULT_TEXT_COLOR = '#666666'
const MAX_DIMENSION = 4096

const PRESET_OPTIONS = PLACEHOLDER_PRESETS.map((p) => ({
  label: `${p.label} (${p.width}x${p.height})`,
  value: `${p.width}x${p.height}`,
}))

const toPickerHex = (hex: string): string => {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const m = hex.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/)
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : '#000000'
}

const buildOptions = (
  width: string,
  height: string,
  bgColor: string,
  textColor: string,
  text: string,
): PlaceholderOptions | null => {
  const w = Math.round(Number(width))
  const h = Math.round(Number(height))
  if (!width || !height || !Number.isFinite(w) || !Number.isFinite(h)) return null
  if (w <= 0 || h <= 0) return null
  return { bgColor, height: h, text, textColor, width: w }
}

const buildPreviewUri = (options: PlaceholderOptions): string => {
  const svg = generatePlaceholderSvg(options)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const toolEntry = TOOL_REGISTRY_MAP['placeholder-image-generator']
const initialState: State = {
  bgColor: DEFAULT_BG_COLOR,
  bgHexInput: DEFAULT_BG_COLOR,
  height: DEFAULT_HEIGHT,
  text: '',
  textColor: DEFAULT_TEXT_COLOR,
  textHexInput: DEFAULT_TEXT_COLOR,
  width: DEFAULT_WIDTH,
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_WIDTH':
      return { ...state, width: action.value }
    case 'SET_HEIGHT':
      return { ...state, height: action.value }
    case 'SET_PRESET':
      return { ...state, height: action.height, width: action.width }
    case 'SET_BG_PICKER':
      return { ...state, bgColor: action.hex, bgHexInput: action.hex }
    case 'SET_BG_HEX': {
      const next = { ...state, bgHexInput: action.value }
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(action.value)) {
        next.bgColor = toPickerHex(action.value)
      }
      return next
    }
    case 'SET_TEXT_COLOR_PICKER':
      return { ...state, textColor: action.hex, textHexInput: action.hex }
    case 'SET_TEXT_COLOR_HEX': {
      const next = { ...state, textHexInput: action.value }
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(action.value)) {
        next.textColor = toPickerHex(action.value)
      }
      return next
    }
    case 'SET_TEXT':
      return { ...state, text: action.value }
  }
}

export const PlaceholderImageGenerator = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { bgColor, bgHexInput, height, text, textColor, textHexInput, width } = state
  const { toast } = useToast()

  const previewUri = useMemo(() => {
    const opts = buildOptions(width, height, bgColor, textColor, text)
    return opts ? buildPreviewUri(opts) : ''
  }, [width, height, bgColor, textColor, text])

  const handleWidthChange = (val: string) => dispatch({ type: 'SET_WIDTH', value: val })
  const handleHeightChange = (val: string) => dispatch({ type: 'SET_HEIGHT', value: val })
  const handleTextChange = (val: string) => dispatch({ type: 'SET_TEXT', value: val })
  const handleBgPickerChange = (hex: string) => dispatch({ type: 'SET_BG_PICKER', hex })
  const handleBgHexChange = (val: string) => dispatch({ type: 'SET_BG_HEX', value: val })
  const handleTextColorPickerChange = (hex: string) => dispatch({ type: 'SET_TEXT_COLOR_PICKER', hex })
  const handleTextColorHexChange = (val: string) => dispatch({ type: 'SET_TEXT_COLOR_HEX', value: val })

  const handlePresetChange = (val: string) => {
    const [w, h] = val.split('x')
    dispatch({ type: 'SET_PRESET', height: h, width: w })
  }

  const validateDimensions = (): PlaceholderOptions | null => {
    const w = Math.round(Number(width))
    const h = Math.round(Number(height))
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      toast({
        action: 'add',
        item: {
          label: 'Enter valid dimensions (e.g., 800 x 600)',
          type: 'error',
        },
      })
      return null
    }
    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      toast({
        action: 'add',
        item: {
          label: `Maximum dimension is ${MAX_DIMENSION}x${MAX_DIMENSION}`,
          type: 'error',
        },
      })
      return null
    }
    return { bgColor, height: h, text, textColor, width: w }
  }

  const handleDownloadPng = async () => {
    const opts = validateDimensions()
    if (!opts) return
    try {
      const canvas = generatePlaceholderCanvas(opts)
      const blob = await canvasToBlob(canvas)
      downloadBlob(blob, `placeholder-${opts.width}x${opts.height}.png`)
      toast({
        action: 'add',
        item: {
          label: `Downloaded placeholder-${opts.width}x${opts.height}.png`,
          type: 'success',
        },
      })
    } catch {
      toast({
        action: 'add',
        item: { label: 'Failed to generate PNG', type: 'error' },
      })
    }
  }

  const handleDownloadSvg = () => {
    const opts = validateDimensions()
    if (!opts) return
    const svg = generatePlaceholderSvg(opts)
    downloadSvg(svg, `placeholder-${opts.width}x${opts.height}.svg`)
    toast({
      action: 'add',
      item: {
        label: `Downloaded placeholder-${opts.width}x${opts.height}.svg`,
        type: 'success',
      },
    })
  }

  const displayText = text || `${width || '0'}x${height || '0'}`

  return (
    <div className="flex size-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="flex grow flex-col gap-6 overflow-y-auto tablet:flex-row">
        <div className="flex shrink-0 flex-col gap-3 tablet:flex-1 tablet:shrink tablet:overflow-y-auto">
          <div className="flex gap-3">
            <FieldForm
              label="Width"
              name="placeholder-width"
              onChange={handleWidthChange}
              placeholder="800"
              type="text"
              value={width}
            />
            <FieldForm
              label="Height"
              name="placeholder-height"
              onChange={handleHeightChange}
              placeholder="600"
              type="text"
              value={height}
            />
          </div>

          <SelectInput
            name="placeholder-preset"
            onChange={handlePresetChange}
            options={PRESET_OPTIONS}
            placeholder="Preset sizes"
          />

          <div className="flex flex-col gap-1">
            <label className="text-body-sm font-medium text-gray-400" htmlFor="placeholder-bg-color">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <ColorInput
                aria-label="Background color picker"
                onChange={handleBgPickerChange}
                value={toPickerHex(bgColor)}
              />
              <FieldForm
                label=""
                name="placeholder-bg-hex"
                onChange={handleBgHexChange}
                placeholder="#cccccc"
                type="text"
                value={bgHexInput}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-body-sm font-medium text-gray-400" htmlFor="placeholder-text-color">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <ColorInput onChange={handleTextColorPickerChange} value={toPickerHex(textColor)} />
              <FieldForm
                label=""
                name="placeholder-text-color-hex"
                onChange={handleTextColorHexChange}
                placeholder="#666666"
                type="text"
                value={textHexInput}
              />
            </div>
          </div>

          <FieldForm
            label="Custom Text"
            name="placeholder-text"
            onChange={handleTextChange}
            placeholder={`${width || '800'}x${height || '600'}`}
            type="text"
            value={text}
          />
        </div>

        <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

        <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-4">
          {previewUri ? (
            <img
              alt={`Placeholder image preview: ${displayText}, background ${bgColor}, text ${textColor}`}
              className="max-h-full max-w-full border border-gray-700 object-contain"
              src={previewUri}
            />
          ) : (
            <p className="text-body-sm text-gray-500">Enter dimensions to preview</p>
          )}
        </div>
      </div>

      <div className="flex w-full shrink-0 gap-8 [&>button]:w-[calc(50%-1rem)]">
        <Button aria-label="Download PNG image" icon={<DownloadIcon />} onClick={handleDownloadPng} variant="primary">
          Download PNG
        </Button>
        <Button aria-label="Download SVG image" icon={<DownloadIcon />} onClick={handleDownloadSvg} variant="default">
          Download SVG
        </Button>
      </div>
    </div>
  )
}
