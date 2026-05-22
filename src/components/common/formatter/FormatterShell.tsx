import { CodeOutput, CopyButton, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { useToolFieldsPersisted } from '@/hooks'
import type { FormatterShellProps } from '@/types'

export const FormatterShell = <I extends { source: string }>({
  autoOpen,
  compute,
  description,
  errorFallback,
  errorLabel,
  initial,
  onAfterDialogClose,
  renderControls,
  resultLabel = 'Result',
  resultPlaceholder,
  sourceLabel,
  sourcePlaceholder,
  storageKey,
  title,
  triggerLabel,
}: FormatterShellProps<I>) => {
  const { inputs, result, setFields, setFieldsImmediate } = useToolFieldsPersisted<I, string>({
    compute,
    debounceMs: 300,
    errorFallback,
    errorLabel,
    initial,
    initialResult: '',
    isEmpty: (input) => input.source.trim().length === 0,
    storageKey,
  })

  // Partial reset: clears source, preserves controls (mode, indent, dialect, etc.).
  // The hook's reset() would clear those too, which is not the intended UX for the
  // formatter family.
  const handleReset = () => setFieldsImmediate({ source: '' } as Partial<I>)

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title={title}
      triggers={[{ label: triggerLabel }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        {renderControls && (
          <div className="flex flex-wrap items-end gap-4">{renderControls({ inputs, result, setFieldsImmediate })}</div>
        )}

        <SplitPanel>
          <Pane>
            <FieldForm
              label={sourceLabel}
              name="dialog-source"
              onChange={(val: string) => setFields({ source: val } as Partial<I>)}
              placeholder={sourcePlaceholder}
              type="code"
              value={inputs.source}
            />
          </Pane>

          <Pane live>
            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>{resultLabel}</span>
                  <CopyButton label={resultLabel} value={result} />
                </span>
              }
              placeholder={resultPlaceholder}
              value={result}
            />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
