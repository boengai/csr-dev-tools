import { m } from 'motion/react'
import { useRef, useState } from 'react'

import { useElapsedTimer, useMountOnce, useToolFields } from '@/hooks'
import type {
  GeneratorOnOpenProps,
  GeneratorOutputKind,
  GeneratorOutputView,
  GeneratorResults,
  GeneratorShellProps,
  GeneratorStampedResult,
  ToolComputeContext,
} from '@/types'

import { ToolStatus } from '../banner'
import { Button } from '../button/Button'
import { ModEnterAction } from '../button/ModEnterAction'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { Pane, SplitPanel } from '../layout'
import { GeneratorOutput } from './GeneratorOutput'

const DEFAULT_ERROR = 'Unable to generate with these options'

/**
 * Lives inside the dialog body, which mounts only while the dialog is open,
 * so the first run happens on open (not when the tile renders on the
 * dashboard). ⌘/Ctrl+Enter is bound by `ModEnterAction`, also in the body.
 */
const GeneratorOnOpen = ({ onOpen }: GeneratorOnOpenProps) => {
  useMountOnce(onOpen)
  return null
}

/**
 * The shell for the **Generator** layout type (ADR-0027): options in, output
 * out, no source text. See CONTEXT.md → Generator shell and docs/ux/generator.md.
 */
export const GeneratorShell = <O extends object, K extends GeneratorOutputKind>({
  autoOpen,
  compute,
  description,
  errorFallback = DEFAULT_ERROR,
  initial,
  notices,
  onAfterClose,
  output,
  renderOptions,
  run,
  storageKey,
  title,
  triggerLabel,
}: GeneratorShellProps<O, K>) => {
  // Each compute is stamped with its run number when it starts. Closing the
  // dialog records the last run, so anything produced before the close —
  // including a slow run still in flight — is never shown again.
  const runRef = useRef(0)
  const [clearedThrough, setClearedThrough] = useState(0)

  const stampedCompute = async (
    options: O,
    context: ToolComputeContext,
  ): Promise<GeneratorStampedResult<GeneratorResults[K]>> => {
    const stamp = ++runRef.current
    return { run: stamp, value: await compute(options, context) }
  }

  // No errorLabel / errorFallback / onError: input errors never toast. The
  // shell shows them in the status slot (CONTEXT.md → Tool status slot).
  // No autorun: the first run fires when the dialog opens (GeneratorOnOpen).
  const { error, inputs, isPending, recompute, result, setFields, setFieldsImmediate } = useToolFields<
    O,
    GeneratorStampedResult<GeneratorResults[K]>
  >({
    compute: stampedCompute,
    debounceMs: 300,
    initial,
    initialResult: { run: 0, value: null },
    storageKey,
  })

  const random = run.mode === 'random' ? run : null
  const busy = random?.slow === true && isPending
  const elapsed = useElapsedTimer(busy)

  // A stale result next to an error banner reads as valid output — clear it.
  // A slow run hides the previous result until the new one lands.
  const value = error != null || busy || result.run <= clearedThrough ? null : result.value

  // The dialog frame runs this when the dialog closes (there is no Reset
  // button). Options stay; the output goes.
  const handleReset = () => setClearedThrough(runRef.current)

  const view = { kind: output.kind, output, value } as GeneratorOutputView

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      title={title}
      triggers={[{ label: triggerLabel }]}
    >
      <GeneratorOnOpen onOpen={recompute} />
      <div className="flex w-full grow flex-col gap-4">
        <ToolStatus
          error={error}
          errorFallback={errorFallback}
          notices={value !== null ? notices?.(value) : undefined}
        />

        <SplitPanel>
          <Pane gap="lg">
            {/* A non-growing wrapper: some inputs (SelectInput) grow to fill a flex
                column, which would stretch them down the whole options pane. */}
            <div className="flex flex-col gap-4">
              {renderOptions({ options: inputs, setOptions: setFieldsImmediate, setOptionsDebounced: setFields })}
            </div>

            {random && (
              <ModEnterAction disabled={busy} onTrigger={recompute}>
                <Button block disabled={busy} onClick={recompute} variant="primary">
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <m.span
                        animate={{ rotate: 360 }}
                        aria-hidden="true"
                        className="inline-block size-4 rounded-full border-2 border-white/30 border-t-white"
                        transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
                      />
                      {`Generating… ${elapsed.toFixed(1)}s`}
                    </span>
                  ) : (
                    random.generateLabel
                  )}
                </Button>
              </ModEnterAction>
            )}
          </Pane>

          <Pane live>
            <div
              className="flex min-h-0 w-full grow flex-col"
              data-has-value={hasValue(view) ? '' : undefined}
              data-output-kind={output.kind}
              data-slot="tool-output"
            >
              <GeneratorOutput view={view} />
            </div>
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}

const hasValue = (view: GeneratorOutputView): boolean => {
  if (view.value === null) return false
  switch (view.kind) {
    case 'image':
      return true
    case 'swatches':
      return view.value.swatches.length > 0
    default:
      return view.value.length > 0
  }
}
