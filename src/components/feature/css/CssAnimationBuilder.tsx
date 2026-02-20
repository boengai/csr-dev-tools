import { useMemo, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { AnimationConfig, AnimationDirection, AnimationFillMode, AnimationTimingFunction, KeyframeStep } from '@/utils'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { DEFAULT_ANIMATION_CONFIG, generateAnimationCss, buildTransformString } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['css-animation-builder']

const TIMING_FUNCTIONS: Array<AnimationTimingFunction> = ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out']
const DIRECTIONS: Array<AnimationDirection> = ['normal', 'reverse', 'alternate', 'alternate-reverse']
const FILL_MODES: Array<AnimationFillMode> = ['none', 'forwards', 'backwards', 'both']
const AVAILABLE_PERCENTS = [0, 25, 50, 75, 100]

const createKeyframe = (percent: number): KeyframeStep => ({
  backgroundColor: '#6366f1',
  opacity: 1,
  percent,
  rotate: 0,
  scale: 1,
  translateX: 0,
  translateY: 0,
})

export const CssAnimationBuilder = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [config, setConfig] = useState<AnimationConfig>({ ...DEFAULT_ANIMATION_CONFIG })
  const [animKey, setAnimKey] = useState(0)

  const cssOutput = useMemo(() => generateAnimationCss(config), [config])

  const updateConfig = (partial: Partial<AnimationConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
    setAnimKey((k) => k + 1)
  }

  const updateKeyframe = (index: number, partial: Partial<KeyframeStep>) => {
    setConfig((prev) => {
      const keyframes = prev.keyframes.map((kf, i) => (i === index ? { ...kf, ...partial } : kf))
      return { ...prev, keyframes }
    })
    setAnimKey((k) => k + 1)
  }

  const addKeyframe = (percent: number) => {
    setConfig((prev) => ({
      ...prev,
      keyframes: [...prev.keyframes, createKeyframe(percent)].sort((a, b) => a.percent - b.percent),
    }))
    setAnimKey((k) => k + 1)
  }

  const removeKeyframe = (index: number) => {
    if (config.keyframes.length <= 2) return
    setConfig((prev) => ({ ...prev, keyframes: prev.keyframes.filter((_, i) => i !== index) }))
    setAnimKey((k) => k + 1)
  }

  const handleReset = () => {
    setConfig({ ...DEFAULT_ANIMATION_CONFIG })
    setAnimKey(0)
  }

  const existingPercents = new Set(config.keyframes.map((kf) => kf.percent))
  const addablePercents = AVAILABLE_PERCENTS.filter((p) => !existingPercents.has(p))

  const previewStyle = useMemo(() => {
    const sorted = [...config.keyframes].sort((a, b) => a.percent - b.percent)
    const keyframeBody = sorted
      .map(
        (s) =>
          `${s.percent}% { opacity: ${s.opacity}; transform: ${buildTransformString(s)}; background-color: ${s.backgroundColor}; }`,
      )
      .join(' ')
    const iterations = config.iterationCount === 'infinite' ? 'infinite' : (Number(config.iterationCount) > 0 ? config.iterationCount : '1')
    return `@keyframes csr-anim-preview { ${keyframeBody} } .csr-anim-target { animation: csr-anim-preview ${config.duration}s ${config.timingFunction} ${iterations} ${config.direction} ${config.fillMode}; }`
  }, [config])

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <Button onClick={() => setDialogOpen(true)} variant="primary">
        Build Animation
      </Button>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="CSS Animation Builder"
      >
        <div className="flex grow flex-col gap-4 overflow-auto p-4 tablet:min-h-0 tablet:flex-row">
          {/* Left Panel: Keyframes + Settings */}
          <div className="flex shrink-0 flex-col gap-4 overflow-auto tablet:w-1/2">
            <div className="flex flex-col gap-3">
              <h3 className="text-body-sm font-medium text-gray-300">Keyframes</h3>
              {config.keyframes.map((kf, i) => (
                <div className="rounded border border-gray-800 bg-gray-950 p-3" key={`${kf.percent}-${i}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-body-sm font-bold text-primary">{kf.percent}%</span>
                    {config.keyframes.length > 2 && (
                      <button
                        className="text-red-400 hover:text-red-300 text-body-xs"
                        onClick={() => removeKeyframe(i)}
                        type="button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FieldForm
                      label="Translate X"
                      max={200}
                      min={-200}
                      name={`kf-${i}-tx`}
                      onChange={(v) => updateKeyframe(i, { translateX: Number(v) })}
                      type="range"
                      value={String(kf.translateX)}
                    />
                    <FieldForm
                      label="Translate Y"
                      max={200}
                      min={-200}
                      name={`kf-${i}-ty`}
                      onChange={(v) => updateKeyframe(i, { translateY: Number(v) })}
                      type="range"
                      value={String(kf.translateY)}
                    />
                    <FieldForm
                      label="Rotate"
                      max={360}
                      min={0}
                      name={`kf-${i}-rot`}
                      onChange={(v) => updateKeyframe(i, { rotate: Number(v) })}
                      type="range"
                      value={String(kf.rotate)}
                    />
                    <FieldForm
                      label="Scale"
                      max={3}
                      min={0.1}
                      name={`kf-${i}-scale`}
                      onChange={(v) => updateKeyframe(i, { scale: Number(v) })}
                      step={0.1}
                      type="range"
                      value={String(kf.scale)}
                    />
                    <FieldForm
                      label="Opacity"
                      max={1}
                      min={0}
                      name={`kf-${i}-opacity`}
                      onChange={(v) => updateKeyframe(i, { opacity: Number(v) })}
                      step={0.01}
                      type="range"
                      value={String(kf.opacity)}
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-body-xs text-gray-400" htmlFor={`kf-${i}-bg`}>
                        BG Color
                      </label>
                      <input
                        className="h-8 w-12 cursor-pointer rounded border border-gray-700 bg-transparent"
                        id={`kf-${i}-bg`}
                        onChange={(e) => updateKeyframe(i, { backgroundColor: e.target.value })}
                        type="color"
                        value={kf.backgroundColor}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {addablePercents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {addablePercents.map((p) => (
                    <button
                      className="rounded border border-gray-700 px-2 py-1 text-body-xs text-gray-400 hover:border-primary hover:text-primary"
                      key={p}
                      onClick={() => addKeyframe(p)}
                      type="button"
                    >
                      + {p}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-gray-900" />

            <div className="flex flex-col gap-3">
              <h3 className="text-body-sm font-medium text-gray-300">Settings</h3>
              <FieldForm
                label="Duration (s)"
                max={10}
                min={0.1}
                name="anim-duration"
                onChange={(v) => updateConfig({ duration: Number(v) })}
                step={0.1}
                type="range"
                value={String(config.duration)}
              />
              <FieldForm
                label="Timing Function"
                name="anim-timing"
                onChange={(v) => updateConfig({ timingFunction: v as AnimationTimingFunction })}
                options={TIMING_FUNCTIONS.map((t) => ({ label: t, value: t }))}
                type="select"
                value={config.timingFunction}
              />
              <FieldForm
                label="Iteration Count"
                name="anim-iterations"
                onChange={(v) => updateConfig({ iterationCount: v })}
                placeholder="1 or infinite"
                type="text"
                value={config.iterationCount}
              />
              <FieldForm
                label="Direction"
                name="anim-direction"
                onChange={(v) => updateConfig({ direction: v as AnimationDirection })}
                options={DIRECTIONS.map((d) => ({ label: d, value: d }))}
                type="select"
                value={config.direction}
              />
              <FieldForm
                label="Fill Mode"
                name="anim-fill"
                onChange={(v) => updateConfig({ fillMode: v as AnimationFillMode })}
                options={FILL_MODES.map((f) => ({ label: f, value: f }))}
                type="select"
                value={config.fillMode}
              />
            </div>
          </div>

          {/* Right Panel: Preview + CSS Output */}
          <div className="flex flex-col gap-4 tablet:w-1/2">
            <div className="flex flex-col gap-2">
              <h3 className="text-body-sm font-medium text-gray-300">Preview</h3>
              <div className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-12">
                <style>{previewStyle}</style>
                <div
                  className="csr-anim-target h-20 w-20 rounded-lg"
                  key={animKey}
                  style={{ backgroundColor: config.keyframes[0]?.backgroundColor ?? '#6366f1' }}
                />
              </div>
            </div>

            <div aria-live="polite" className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-body-sm font-medium text-gray-400">CSS Output</span>
                <CopyButton label="CSS animation" value={cssOutput} />
              </div>
              <div className="max-h-64 overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3">
                <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">{cssOutput}</pre>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
