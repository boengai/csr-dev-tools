import { useMemo, useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { useInputLocalStorage, useMountOnce, useToast, useToolFields } from '@/hooks'
import type { BidirectionalConverterProps } from '@/types'

const sourceKey = (mode: string, prefix?: string) =>
  prefix ? `csr-dev-tools-${prefix}-${mode}-source` : `csr-dev-tools-${mode}-source`

const readSource = (mode: string, prefix?: string): string => {
  try {
    const item = localStorage.getItem(sourceKey(mode, prefix))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

const writeSource = (mode: string, value: string, prefix?: string) => {
  try {
    localStorage.setItem(sourceKey(mode, prefix), JSON.stringify(value))
  } catch {}
}

export function BidirectionalConverter<M extends string>({
  autoOpen,
  compute,
  description,
  modeStorageKey,
  modes,
  onAfterDialogClose,
  onError,
  sourceKeyPrefix,
  sourceToolbarSlot,
}: BidirectionalConverterProps<M>) {
  const [persistedMode, setPersistedMode] = useInputLocalStorage<M>(
    `csr-dev-tools-${modeStorageKey}-mode`,
    modes[0].key,
  )
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { showError } = useToast()

  const initialBag = useMemo(
    () => ({ mode: persistedMode, source: readSource(persistedMode, sourceKeyPrefix) }),
    // Initial bag is captured once on mount; mode changes after that are
    // routed through setFieldsImmediate, not via re-running this memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only seed
    [],
  )

  const { inputs, result, setFields, setFieldsImmediate } = useToolFields<{ mode: M; source: string }, string>({
    compute,
    debounceMs: 300,
    initial: initialBag,
    initialResult: '',
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

  useMountOnce(() => {
    if (initialBag.source) {
      setFieldsImmediate(initialBag)
    }
  })

  const handleSourceChange = (val: string) => {
    writeSource(mode, val, sourceKeyPrefix)
    setFields({ source: val })
  }

  const openDialog = (m: M) => {
    const restored = readSource(m, sourceKeyPrefix)
    setPersistedMode(m)
    setDialogOpen(true)
    setFieldsImmediate({ mode: m, source: restored })
  }

  const handleReset = () => {
    setFieldsImmediate({ source: '' })
  }

  const recompute = () => {
    setFieldsImmediate({})
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {description && <p className="shrink-0 text-body-xs text-gray-400">{description}</p>}
        <div className="flex grow flex-col items-center justify-center gap-2">
          {modes.map((m) => (
            <Button block key={m.key} onClick={() => openDialog(m.key)} variant="default">
              {m.label}
            </Button>
          ))}
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="screen"
        title={modeConfig.label}
      >
        <div className="flex w-full grow flex-col gap-4">
          {sourceToolbarSlot ? sourceToolbarSlot({ mode, recompute }) : null}
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label={modeConfig.sourceLabel}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={modeConfig.sourcePlaceholder}
                type="code"
                value={source}
              />
            </div>
            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />
            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>{modeConfig.resultLabel}</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                placeholder={modeConfig.resultPlaceholder}
                value={result}
              />
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
