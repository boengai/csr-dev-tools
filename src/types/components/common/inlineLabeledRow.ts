export type InlineLabeledRowProps = {
  /** The descriptive label rendered on the left. Forwarded to the CopyButton's aria-label as `Copy ${label} to clipboard`. */
  label: string
  /** Canonical value: used for clipboard AND for display when `displayValue` is not given. */
  value: string
  /** Override what's shown to the user. Defaults to `value`. Use when display text differs from clipboard text (e.g., synthetic fallback labels for empty values). */
  displayValue?: string
}
