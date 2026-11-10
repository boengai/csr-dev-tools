import type { ReactNode } from 'react'

export type ErrorBannerProps = {
  children: ReactNode
  /**
   * `error` / `warning` announce assertively (`role="alert"`). `notice` is the
   * non-fatal [[Tool status slot]] message — valid output plus something worth
   * knowing — and announces politely (`role="status"`).
   */
  variant?: 'error' | 'notice' | 'warning'
}

/**
 * The [[Tool status slot]] every layout shell renders between its controls and
 * its work area. The shell owns it: tools never render their own input-error
 * markup.
 */
export type ToolStatusProps = {
  /** The pipeline's latest rejection, or `null`. Non-null renders the error banner. */
  error: unknown | null
  /**
   * Fallback text when `error` is not an `Error` with a message. Ignored when
   * `errorLabel` is set.
   */
  errorFallback?: string
  /**
   * Fixed text that always replaces the error's own message. Use when the
   * underlying library throws implementation-leaking messages (WASM facades).
   */
  errorLabel?: string
  /**
   * One button beside the error that fixes the input (Mermaid's Auto-fix).
   * Rendered only while `error` is set.
   */
  errorAction?: ToolStatusAction
  /** Non-fatal messages about a valid result. Hidden while `error` is set. */
  notices?: Array<string>
}

/** A one-click fix offered next to a [[Tool status slot]] error. */
export type ToolStatusAction = {
  label: string
  onClick: () => void
}
