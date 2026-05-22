import type { ReactNode } from 'react'

type ErrorBannerProps = {
  children: ReactNode
  variant?: 'error' | 'warning'
}

export const ErrorBanner = ({ children, variant = 'error' }: ErrorBannerProps) => (
  <p
    className={variant === 'warning' ? 'text-body-xs text-yellow-400' : 'text-body-xs text-red-400'}
    role="alert"
  >
    {children}
  </p>
)
