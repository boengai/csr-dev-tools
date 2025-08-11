import { type ChangeEvent, type RefObject, useRef } from 'react'

import type { UploadInputProps } from '@/types'

import { Button } from '../button'
import { UploadIcon } from '../icon'

export const UploadInput = ({ button, disabled, onBlur, onChange, ...props }: UploadInputProps) => {
  const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null)

  const handleChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files: FileList | null = event.target.files
    if (files?.length) {
      onChange?.(Array.from(files))
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="relative w-full">
      <input {...props} className="hidden" disabled={disabled} onChange={handleChange} ref={inputRef} type="file" />
      <Button
        block={button?.block}
        disabled={disabled}
        icon={<UploadIcon />}
        onBlur={onBlur}
        onClick={handleClick}
        variant="primary"
      >
        {button?.children ?? 'Upload File'}
      </Button>
    </div>
  )
}
