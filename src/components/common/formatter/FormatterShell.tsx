import { useToolFieldsPersisted } from '@/hooks'
import type { FormatterShellProps } from '@/types'

import { CopyButton } from '../button'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { FieldForm } from '../form'
import { Pane, SplitPanel } from '../layout'
import { CodeOutput } from '../output'

export const FormatterShell = <I extends { source: string }>({
  autoOpen,
  compute,
  description,
  errorFallback,
  errorLabel,
  initial,
  onAfterDialogClose,
  renderBanner,
  renderControls,
  resultLabel = 'Result',
  resultPlaceholder,
  sourceLabel,
  sourcePlaceholder,
  storageKey,
  title,
  triggerLabel,
}: FormatterShellProps<I>) => {
  // Suppress toast routing when renderBanner is set — banner replaces toast
  // (same content, two channels duplicate). See CONTEXT.md → Formatter shell.
  const { error, inputs, result, setFields, setFieldsImmediate } = useToolFieldsPersisted<I, string>({
    compute,
    debounceMs: 300,
    errorFallback: renderBanner ? undefined : errorFallback,
    errorLabel: renderBanner ? undefined : errorLabel,
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

        {renderBanner?.(error)}

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
