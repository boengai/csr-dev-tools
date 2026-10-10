import { useState } from 'react'

import { readJsonStorage, useInputLocalStorage, useToast, useToolFields, writeJsonStorage } from '@/hooks'
import type { BidirectionalConverterProps, ConvertOutput } from '@/types'
import { narrateParseError } from '@/utils/parse-error-narrators'

import { CopyButton, ToggleButton } from '../button'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { FieldForm } from '../form'
import { Pane, SplitPanel } from '../layout'
import { CodeOutput } from '../output'

const sourceKey = (mode: string, prefix?: string) =>
  prefix ? `csr-dev-tools-${prefix}-${mode}-source` : `csr-dev-tools-${mode}-source`

const readSource = (mode: string, prefix?: string): string => readJsonStorage<string>(sourceKey(mode, prefix), '')

const writeSource = (mode: string, value: string, prefix?: string): void =>
  writeJsonStorage(sourceKey(mode, prefix), value)

export function BidirectionalConverter<M extends string, R extends ConvertOutput = ConvertOutput>({
  autoOpen,
  compute,
  description,
  initialResult,
  modeStorageKey,
  modes,
  onAfterDialogClose,
  onError,
  renderBanner,
  sourceKeyPrefix,
  sourceToolbarSlot,
}: BidirectionalConverterProps<M, R>) {
  const [persistedMode, setPersistedMode] = useInputLocalStorage<M>(
    `csr-dev-tools-${modeStorageKey}-mode`,
    modes[0].key,
  )
  const { showError } = useToast()

  // Initial bag is captured once on mount (lazy initializer); mode changes
  // after that are routed through setFieldsImmediate.
  const [initialBag] = useState(() => ({ mode: persistedMode, source: readSource(persistedMode, sourceKeyPrefix) }))

  // Wrap compute so that, when the active mode declares a sourceFormat and the
  // source has a parse error matching that format, the thrown Error carries a
  // narrated `Invalid <FORMAT>: <reason>` message. Otherwise the original
  // error from compute flows through unchanged.
  const wrappedCompute = async (input: { mode: M; source: string }): Promise<R> => {
    try {
      return await compute(input)
    } catch (e) {
      const fmt = modes.find((m) => m.key === input.mode)?.sourceFormat
      if (fmt) {
        const narrated = await narrateParseError(fmt, input.source)
        if (narrated != null) throw new Error(narrated)
      }
      throw e
    }
  }

  const { inputs, recompute, result, setFields, setFieldsImmediate } = useToolFields<{ mode: M; source: string }, R>({
    autorunOnMount: true,
    compute: wrappedCompute,
    debounceMs: 300,
    initial: initialBag,
    initialResult,
    isEmpty: ({ source: val }) => val.trim().length === 0,
    onError: (err, input) => {
      if (onError) {
        onError(err, input.mode)
        return
      }
      const label = err instanceof Error ? err.message : 'Conversion failed — please check your input'
      showError(label)
    },
  })

  const { mode, source } = inputs
  const modeConfig = modes.find((m) => m.key === mode) ?? modes[0]

  const handleSourceChange = (val: string) => {
    writeSource(mode, val, sourceKeyPrefix)
    setFields({ source: val })
  }

  const switchMode = (m: M) => {
    if (m === mode) return
    const restored = readSource(m, sourceKeyPrefix)
    setPersistedMode(m)
    setFieldsImmediate({ mode: m, source: restored })
  }

  const handleReset = () => {
    setFieldsImmediate({ source: '' })
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      size="screen"
      title={modeConfig.label}
      triggers={[{ label: modeConfig.label }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        {modes.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-body-xs text-gray-400">Mode</span>
            {modes.map((m) => (
              <ToggleButton
                aria-label={`${m.label} mode`}
                key={m.key}
                onClick={() => switchMode(m.key)}
                pressed={m.key === mode}
              >
                {m.label}
              </ToggleButton>
            ))}
          </div>
        )}
        {sourceToolbarSlot ? sourceToolbarSlot({ mode, recompute }) : null}
        {renderBanner?.(result)}
        <SplitPanel>
          <Pane>
            <FieldForm
              label={modeConfig.sourceLabel}
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder={modeConfig.sourcePlaceholder}
              type="code"
              value={source}
            />
          </Pane>
          <Pane live>
            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>{modeConfig.resultLabel}</span>
                  <CopyButton label="result" value={result.output} />
                </span>
              }
              placeholder={modeConfig.resultPlaceholder}
              value={result.output}
            />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
