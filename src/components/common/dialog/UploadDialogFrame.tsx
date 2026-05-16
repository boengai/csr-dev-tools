import { useCallback, useState } from 'react'

import { UploadInput } from '@/components/common/input/UploadInput'
import type { UploadDialogFrameProps } from '@/types'

import { ToolDialogShell } from './ToolDialogShell'

/**
 * Page-level frame for a Tool whose tile IS a file-upload trigger (rather
 * than a button that opens an empty dialog). Owns the tile (description +
 * UploadInput), the dialog open state, and forwards the dialog wiring to
 * [[ToolDialogShell]]. Sibling to [[ToolDialogFrame]] — pick this when the
 * Tool processes uploaded files and shows results in a dialog.
 *
 * The caller's `onUpload` receives an `openDialog` callback so the Tool
 * controls when the dialog opens — before async processing (to show a
 * loading state) or after (to open with results ready). Skipping the
 * call keeps the dialog closed, e.g. on a validation rejection.
 */
export const UploadDialogFrame = ({
  accept,
  buttonLabel,
  children,
  description,
  multiple = false,
  onAfterClose,
  onReset,
  onUpload,
  size = 'screen',
  title,
  uploadInputName,
}: UploadDialogFrameProps) => {
  const [open, setOpen] = useState(false)

  const openDialog = useCallback(() => {
    setOpen(true)
  }, [])

  const handleChange = (files: Array<File>) => {
    void onUpload(files, openDialog)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {description && <p className="shrink-0 text-body-xs text-gray-400">{description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <UploadInput
            accept={accept}
            button={{ block: true, children: buttonLabel }}
            multiple={multiple}
            name={uploadInputName}
            onChange={handleChange}
          />
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterClose}
        onOpenChange={setOpen}
        onReset={onReset}
        open={open}
        size={size}
        title={title}
      >
        {children}
      </ToolDialogShell>
    </>
  )
}
