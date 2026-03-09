import { useState } from 'react'

import { usePersistSettings } from '@/hooks'

import { Dialog } from '../dialog'
import { GearIcon } from '../icon'
import { SwitchInput } from '../input'

export const SettingsDialog = () => {
  const [open, setOpen] = useState(false)
  const showBackgroundAnimation = usePersistSettings((s) => s.value.showBackgroundAnimation)
  const setSetting = usePersistSettings((s) => s.setSetting)

  return (
    <Dialog
      injected={{ open, setOpen }}
      size="small"
      title="Settings"
      trigger={
        <button
          aria-label="Settings"
          className="flex size-10 items-center justify-center rounded text-gray-400 transition-colors hover:text-white"
          type="button"
        >
          <GearIcon />
        </button>
      }
    >
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
