import { useMountOnce, useToolFields } from '@/hooks'
import type { TransformerOutput, TransformerOutputByKind, TransformerOutputKind, TransformerShellProps } from '@/types'

import { ToolStatus } from '../banner'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { FieldForm } from '../form'
import { Pane, SplitPanel } from '../layout'
import { TransformerOutputPane } from './TransformerOutputPane'

/** The empty value of each output kind: initial result, cleared-on-error value, placeholder trigger. */
const EMPTY_OUTPUT: TransformerOutputByKind = {
  fields: [],
  image: null,
  markup: '',
  text: '',
}

export const TransformerShell = <I extends { source: string }, K extends TransformerOutputKind = 'text'>({
  autoOpen,
  clearOnReset,
  compute,
  copyAll,
  description,
  downloads,
  errorAction,
  errorFallback,
  errorLabel,
  imageCopyLabel,
  initial,
  markupBackground,
  notices,
  onAfterClose,
  outputKind,
  persistInput = true,
  prefill,
  renderControls,
  resultLabel = 'Result',
  resultPlaceholder,
  secondSource,
  sourceKind = 'code',
  sourceLabel,
  sourcePlaceholder,
  storageKey,
  title,
  triggerLabel,
}: TransformerShellProps<I, K>) => {
  const kind = (outputKind ?? 'text') as K
  const empty = EMPTY_OUTPUT[kind] as TransformerOutput<K>

  // No errorLabel / errorFallback passed to the pipeline: input errors never
  // toast. The shell shows them in the status slot (CONTEXT.md → Tool status slot).
  const { error, inputs, result, setFields, setFieldsImmediate } = useToolFields<I, TransformerOutput<K>>({
    compute,
    debounceMs: 300,
    initial,
    initialResult: empty,
    // A blank second source is "not ready yet", like a blank source: placeholder, no error.
    isEmpty: (input) =>
      input.source.trim().length === 0 ||
      (secondSource !== undefined && String(input[secondSource.field]).trim().length === 0),
    storageKey: persistInput ? storageKey : undefined,
  })

  // A handoff from another Tool wins over the restored input, once.
  useMountOnce(() => {
    const patch = prefill?.()
    if (patch) setFieldsImmediate(patch)
  })

  // Partial reset: clears source, preserves controls (mode, indent, dialect, etc.).
  // The hook's reset() would clear those too, which is not the intended UX for the
  // formatter family. `clearOnReset` names controls that must not outlive the dialog.
  const handleReset = () =>
    setFieldsImmediate({
      ...clearOnReset,
      ...(secondSource ? { [secondSource.field]: '' } : {}),
      source: '',
    } as Partial<I>)

  // A stale result next to an error banner reads as valid output — clear it.
  const output = error != null ? empty : result
  const label = typeof resultLabel === 'function' ? resultLabel(inputs) : resultLabel
  const fix = error != null ? errorAction?.(error, inputs) : null

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      title={title}
      triggers={[{ label: triggerLabel }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        {renderControls && (
          <div className="flex flex-wrap items-end gap-4">
            {renderControls({ inputs, result: output, setFields, setFieldsImmediate })}
          </div>
        )}

        <ToolStatus
          error={error}
          errorAction={fix ? { label: fix.label, onClick: () => setFieldsImmediate(fix.patch) } : undefined}
          errorFallback={errorFallback}
          errorLabel={errorLabel}
          notices={error == null ? notices?.(result) : undefined}
        />

        <SplitPanel>
          <Pane>
            <FieldForm
              label={sourceLabel}
              name="dialog-source"
              onChange={(val: string) => setFields({ source: val } as Partial<I>)}
              placeholder={sourcePlaceholder}
              type={sourceKind}
              value={inputs.source}
            />
            {secondSource && (
              <FieldForm
                label={secondSource.label}
                name={`dialog-source-${secondSource.field}`}
                onChange={(val: string) => setFields({ [secondSource.field]: val } as Partial<I>)}
                placeholder={secondSource.placeholder}
                type={secondSource.kind ?? 'code'}
                value={String(inputs[secondSource.field])}
              />
            )}
          </Pane>

          <Pane live>
            <TransformerOutputPane
              copyAll={copyAll}
              downloads={downloads?.(output)}
              imageCopyLabel={imageCopyLabel}
              kind={kind}
              label={label}
              markupBackground={markupBackground}
              placeholder={resultPlaceholder}
              value={output}
            />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
