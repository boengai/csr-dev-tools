import type { ButtonHTMLAttributes, ReactElement } from 'react'

export type ButtonProps = Partial<ButtonVariants> &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onClick' | 'type'> & {
    children?: ReactElement<HTMLSpanElement> | string
    icon?: ReactElement<SVGElement>
  }

export type ButtonVariants = {
  block: boolean
  size: 'default' | 'large' | 'small'
  variant: 'default' | 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'text' | 'warning'
}
