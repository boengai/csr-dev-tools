import type { ErrorBannerProps } from '@/types'

const CLASS_BY_VARIANT = {
  // pre-line: a multi-line message (JSON Schema's error list) keeps its lines.
  error: 'text-body-xs whitespace-pre-line text-error',
  notice: 'text-body-xs text-warning',
  warning: 'text-body-xs text-warning',
} as const

export const ErrorBanner = ({ children, variant = 'error' }: ErrorBannerProps) => (
  <p className={CLASS_BY_VARIANT[variant]} role={variant === 'notice' ? 'status' : 'alert'}>
    {children}
  </p>
)
