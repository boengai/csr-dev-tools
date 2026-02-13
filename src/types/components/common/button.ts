import type { ButtonHTMLAttributes, ReactElement } from 'react'

export type ButtonProps = Partial<ButtonVariants> &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onBlur' | 'onClick' | 'type'> & {
    children?: ReactElement<HTMLSpanElement> | string
    icon?: ReactElement<SVGElement>
  }

export type ButtonVariants = {
  block: boolean
  size: 'default' | 'large' | 'small'
  variant: 'default' | 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'text' | 'warning'
}

export type CopyButtonProps = Partial<CopyButtonVariants> & {
  label?: string
  value: string
}

export type CopyButtonVariant = 'icon-only' | 'labeled'

export type CopyButtonVariants = {
  variant: CopyButtonVariant
}
