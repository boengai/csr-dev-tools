import { useState } from 'react'

import { readJsonStorage, useInputLocalStorage, useToolFields, writeJsonStorage } from '@/hooks'
import type { CodecModes, CodecOutput, CodecShellProps, ToolComputeContext } from '@/types'
import { narrateParseError } from '@/utils/parse-error-narrators'

import { ToolStatus } from '../banner'
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

const DEFAULT_ERROR = 'Conversion failed — please check your input'

/** `?mode=<key>` deep link, validated against the tool's own modes. */
const readModeParam = <M extends string>(modes: CodecModes<M>): M | null => {
  if (typeof window === 'undefined') return null
  const param = new URLSearchParams(window.location.search).get('mode')
  return modes.find((m) => m.key === param)?.key ?? null
}

export function CodecShell<M extends string, R extends CodecOutput = CodecOutput>({
  autoOpen,
  compute,
  description,
  initialResult,
  modeStorageKey,
  errorFallback = DEFAULT_ERROR,
  modes,
  notices,
  onAfterClose,
  onClearInput,
  persistSource = true,
  sourceKeyPrefix,
  sourceToolbarSlot,
}: CodecShellProps<M, R>) {
  const [persistedMode, setPersistedMode] = useInputLocalStorage<M>(
    `csr-dev-tools-${modeStorageKey}-mode`,
    modes[0].key,
  )

  // Initial bag is captured once on mount (lazy initializer); mode changes
  // after that are routed through setFieldsImmediate. A `?mode=` deep link on
  // the tool route wins over the persisted mode for this mount only — it is
  // never written back to the URL.
  const [initialBag] = useState(() => {
    const initialMode = (autoOpen ? readModeParam(modes) : null) ?? persistedMode
    return { mode: initialMode, source: persistSource ? readSource(initialMode, sourceKeyPrefix) : '' }
  })

  // Wrap compute so that, when the active mode declares a sourceFormat and the
  // source has a parse error matching that format, the thrown Error carries a
  // narrated `Invalid <FORMAT>: <reason>` message. Otherwise the original
  // error from compute flows through unchanged.
  const wrappedCompute = async (input: { mode: M; source: string }, context: ToolComputeContext): Promise<R> => {
    try {
      return await compute(input, context)
    } catch (e) {
      const fmt = modes.find((m) => m.key === input.mode)?.sourceFormat
      if (fmt) {
        const narrated = await narrateParseError(fmt, input.source)
        if (narrated != null) throw new Error(narrated)
      }
      throw e
    }
  }

  // No errorLabel / errorFallback / onError: input errors never toast. The
  // shell shows them in the status slot (see CONTEXT.md → Tool status slot).
  const { error, inputs, recompute, result, setFields, setFieldsImmediate } = useToolFields<
    { mode: M; source: string },
    R
  >({
    autorunOnMount: true,
    compute: wrappedCompute,
    debounceMs: 300,
    initial: initialBag,
    initialResult,
    isEmpty: ({ source: val }) => val.trim().length === 0,
  })

  const { mode, source } = inputs
  const modeConfig = modes.find((m) => m.key === mode) ?? modes[0]
  // A stale result next to an error banner reads as valid output — clear it.
  const output = error != null ? '' : result.output

  const handleSourceChange = (val: string) => {
    if (persistSource) writeSource(mode, val, sourceKeyPrefix)
    setFields({ source: val })
  }

  const switchMode = (m: M) => {
    if (m === mode) return
    const restored = persistSource ? readSource(m, sourceKeyPrefix) : ''
    setPersistedMode(m)
    setFieldsImmediate({ mode: m, source: restored })
  }

  // The dialog frame runs this when the dialog closes (there is no Reset button).
  const handleReset = () => {
    setFieldsImmediate({ source: '' })
    onClearInput?.()
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterClose}
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
        <ToolStatus error={error} errorFallback={errorFallback} notices={notices?.(result)} />
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
                  <CopyButton label="result" value={output} />
                </span>
              }
              placeholder={modeConfig.resultPlaceholder}
              value={output}
            />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
