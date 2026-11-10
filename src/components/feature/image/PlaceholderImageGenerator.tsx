import { ColorInput, FieldForm, GeneratorShell, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { GeneratorImage, PlaceholderImageAction, PlaceholderImageState, ToolComponentProps } from '@/types'
import {
  canvasToBlob,
  generatePlaceholderCanvas,
  generatePlaceholderSvg,
  PLACEHOLDER_PRESETS,
  type PlaceholderOptions,
} from '@/utils'

const DEFAULT_WIDTH = '800'
const DEFAULT_HEIGHT = '600'
const DEFAULT_BG_COLOR = '#cccccc'
const DEFAULT_TEXT_COLOR = '#666666'
const MAX_DIMENSION = 4096
const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const PRESET_OPTIONS = PLACEHOLDER_PRESETS.map((p) => ({
  label: `${p.label} (${p.width}x${p.height})`,
  value: `${p.width}x${p.height}`,
}))

const toPickerHex = (hex: string): string => {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const m = hex.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/)
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : '#000000'
}

const toolEntry = TOOL_REGISTRY_MAP['placeholder-image-generator']
const initialState: PlaceholderImageState = {
  bgColor: DEFAULT_BG_COLOR,
  bgHexInput: DEFAULT_BG_COLOR,
  height: DEFAULT_HEIGHT,
  text: '',
  textColor: DEFAULT_TEXT_COLOR,
  textHexInput: DEFAULT_TEXT_COLOR,
  width: DEFAULT_WIDTH,
}

// ADR-0008: the reducer stays, as the transition function of the shell's
// options bag (the hex fields only commit a colour once it parses).
const reducer = (state: PlaceholderImageState, action: PlaceholderImageAction): PlaceholderImageState => {
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
      if (HEX_PATTERN.test(action.value)) {
        next.bgColor = toPickerHex(action.value)
      }
      return next
    }
    case 'SET_TEXT_COLOR_PICKER':
      return { ...state, textColor: action.hex, textHexInput: action.hex }
    case 'SET_TEXT_COLOR_HEX': {
      const next = { ...state, textHexInput: action.value }
      if (HEX_PATTERN.test(action.value)) {
        next.textColor = toPickerHex(action.value)
      }
      return next
    }
    case 'SET_TEXT':
      return { ...state, text: action.value }
  }
}

const parseDimension = (value: unknown): number => (typeof value === 'string' && value.trim() ? Number(value) : NaN)

const toPlaceholderOptions = ({
  bgColor,
  height,
  text,
  textColor,
  width,
}: PlaceholderImageState): PlaceholderOptions => {
  const w = Math.round(parseDimension(width))
  const h = Math.round(parseDimension(height))
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error('Enter valid dimensions (e.g., 800 x 600)')
  }
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) throw new Error(`Maximum dimension is ${MAX_DIMENSION}x${MAX_DIMENSION}`)
  if (typeof bgColor !== 'string' || !HEX_PATTERN.test(bgColor)) throw new Error('Pick a valid background color')
  if (typeof textColor !== 'string' || !HEX_PATTERN.test(textColor)) throw new Error('Pick a valid text color')
  return { bgColor, height: h, text: typeof text === 'string' ? text : '', textColor, width: w }
}

// Deterministic: the same options always give the same image, so it runs
// live. Bad dimensions are an input error for the status slot. The PNG is
// drawn on a canvas only when its Download is clicked.
const generate = (state: PlaceholderImageState): GeneratorImage => {
  const options = toPlaceholderOptions(state)
  const svg = generatePlaceholderSvg(options)
  const displayText = options.text || `${options.width}x${options.height}`
  const name = `placeholder-${options.width}x${options.height}`
  return {
    alt: `Placeholder preview: ${displayText}, background ${options.bgColor}, text ${options.textColor}`,
    downloads: [
      {
        blob: () => canvasToBlob(generatePlaceholderCanvas(options)),
        filename: `${name}.png`,
        label: 'Download PNG',
      },
      {
        blob: () => new Blob([svg], { type: 'image/svg+xml' }),
        filename: `${name}.svg`,
        label: 'Download SVG',
      },
    ],
    src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
  }
}

const asText = (value: unknown): string => (typeof value === 'string' ? value : '')

export const PlaceholderImageGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <GeneratorShell
    autoOpen={autoOpen}
    compute={generate}
    description={toolEntry?.description}
    initial={initialState}
    onAfterClose={onAfterClose}
    output={{ kind: 'image', label: 'Preview', placeholder: 'Enter a width and height to preview the image' }}
    renderOptions={({ options, setOptions, setOptionsDebounced }) => {
      // Picks and presets redraw at once; typed values wait for a pause.
      const dispatch = (action: PlaceholderImageAction) => setOptions(reducer(options, action))
      const dispatchTyped = (action: PlaceholderImageAction) => setOptionsDebounced(reducer(options, action))
      const width = asText(options.width)
      const height = asText(options.height)

      return (
        <>
          <div className="flex gap-3">
            <FieldForm
              label="Width"
              name="placeholder-width"
              onChange={(value: string) => dispatchTyped({ type: 'SET_WIDTH', value })}
              placeholder="800"
              type="text"
              value={width}
            />
            <FieldForm
              label="Height"
              name="placeholder-height"
              onChange={(value: string) => dispatchTyped({ type: 'SET_HEIGHT', value })}
              placeholder="600"
              type="text"
              value={height}
            />
          </div>

          <SelectInput
            aria-label="Preset size"
            name="placeholder-preset"
            onChange={(value: string) => {
              const [w = '', h = ''] = value.split('x')
              dispatch({ height: h, type: 'SET_PRESET', width: w })
            }}
            options={PRESET_OPTIONS}
            placeholder="Preset sizes"
          />

          <div className="flex flex-col gap-1">
            <label className="text-body-sm font-medium text-gray-400" htmlFor="placeholder-bg-color">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <ColorInput
                id="placeholder-bg-color"
                onChange={(hex: string) => dispatch({ hex, type: 'SET_BG_PICKER' })}
                value={toPickerHex(asText(options.bgColor))}
              />
              <FieldForm
                aria-label="Background hex value"
                label=""
                name="placeholder-bg-hex"
                onChange={(value: string) => dispatchTyped({ type: 'SET_BG_HEX', value })}
                placeholder="#cccccc"
                type="text"
                value={asText(options.bgHexInput)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-body-sm font-medium text-gray-400" htmlFor="placeholder-text-color">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <ColorInput
                id="placeholder-text-color"
                onChange={(hex: string) => dispatch({ hex, type: 'SET_TEXT_COLOR_PICKER' })}
                value={toPickerHex(asText(options.textColor))}
              />
              <FieldForm
                aria-label="Text color hex value"
                label=""
                name="placeholder-text-color-hex"
                onChange={(value: string) => dispatchTyped({ type: 'SET_TEXT_COLOR_HEX', value })}
                placeholder="#666666"
                type="text"
                value={asText(options.textHexInput)}
              />
            </div>
          </div>

          <FieldForm
            label="Custom Text"
            name="placeholder-text"
            onChange={(value: string) => dispatchTyped({ type: 'SET_TEXT', value })}
            placeholder={`${width || '800'}x${height || '600'}`}
            type="text"
            value={asText(options.text)}
          />
        </>
      )
    }}
    run={{ mode: 'live' }}
    storageKey="csr-dev-tools-placeholder-image-generator"
    title="Placeholder Image Generator"
    triggerLabel="Generate"
  />
)
