import { usePersistSettings } from '@/hooks'
import type { SettingsDialogProps } from '@/types'

import { Dialog } from '../dialog/Dialog'
import { SwitchInput } from '../input/SwitchInput'

/**
 * Settings body, lazy-loaded on first open. The gear trigger lives eagerly in
 * the App header (no layout shift while this chunk loads); Radix restores
 * focus to it on close since it held focus when the dialog mounted.
 */
export const SettingsDialog = ({ onOpenChange, open }: SettingsDialogProps) => {
  const showBackgroundAnimation = usePersistSettings((s) => s.value.showBackgroundAnimation)
  const setSetting = usePersistSettings((s) => s.setSetting)

  return (
    <Dialog onOpenChange={onOpenChange} open={open} size="small" title="Settings">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer flex-col gap-0.5" htmlFor="bg-animation">
            <span className="text-body-sm text-gray-200">Background animation</span>
            <span className="text-body-xs text-gray-500">Twinkle stars effect (may increase CPU usage)</span>
          </label>
          <SwitchInput
            checked={showBackgroundAnimation}
            id="bg-animation"
            name="showBackgroundAnimation"
            onChange={(checked) => setSetting('showBackgroundAnimation', checked)}
          />
        </div>
      </div>
    </Dialog>
  )
}
