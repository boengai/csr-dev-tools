import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

export type ButtonProps = Partial<ButtonVariants> &
  Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-expanded' | 'aria-label' | 'aria-pressed' | 'disabled' | 'onBlur' | 'onClick' | 'type'
  > & {
    children?: ReactElement<HTMLSpanElement> | string
    'data-testid'?: string
    icon?: ReactElement<SVGElement>
  }

export type ButtonVariants = {
  block: boolean
  size: 'default' | 'large' | 'small'
  variant: 'default' | 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'text' | 'warning'
}

/**
 * A primary action bound to ⌘/Ctrl+Enter while it is mounted (so only while
 * its dialog is open), with the key hint beside it.
 */
export type ModEnterActionProps = {
  /** The action's `<Button>`. */
  children: ReactNode
  /** While true the shortcut is swallowed and does nothing (busy, or not ready). */
  disabled?: boolean
  onTrigger: () => void
}

export type CopyButtonProps = Partial<CopyButtonVariants> & {
  label?: string
  value: string
}

export type CopyButtonVariant = 'icon-only' | 'labeled'

export type CopyButtonVariants = {
  variant: CopyButtonVariant
}

export type ToggleButtonProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'disabled' | 'onClick'> & {
  children: ReactElement<HTMLSpanElement> | string
  pressed: boolean
  size?: 'compact' | 'default'
  variant?: 'default' | 'subtle'
}
