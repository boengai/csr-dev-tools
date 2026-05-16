import { CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { useToast, useToolFieldsPersisted } from '@/hooks'
import type { FormatterShellProps } from '@/types'

export const FormatterShell = <I extends { source: string }>({
  autoOpen,
  compute,
  description,
  errorLabel,
  initial,
  onAfterDialogClose,
  renderControls,
  resultPlaceholder,
  sourceLabel,
  sourcePlaceholder,
  storageKey,
  title,
  triggerLabel,
}: FormatterShellProps<I>) => {
  const { toast } = useToast()

  const { inputs, result, setFields, setFieldsImmediate } = useToolFieldsPersisted<I, string>({
    compute,
    debounceMs: 300,
    initial,
    initialResult: '',
    isEmpty: (input) => input.source.trim().length === 0,
    onError: () => {
      toast({ action: 'add', item: { label: errorLabel, type: 'error' } })
    },
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

        <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label={sourceLabel}
              name="dialog-source"
              onChange={(val: string) => setFields({ source: val } as Partial<I>)}
              placeholder={sourcePlaceholder}
              type="code"
              value={inputs.source}
            />
          </div>

          <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>Result</span>
                  <CopyButton label="result" value={result} />
                </span>
              }
              placeholder={resultPlaceholder}
              value={result}
            />
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
