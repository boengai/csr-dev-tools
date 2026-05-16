export type MonoOutputCellProps = {
  /**
   * Accessibility label for the CopyButton (e.g., "hash value", "HMAC value").
   * Distinct from `label` because the visible label often includes a context
   * suffix that doesn't read well as a button aria-label.
   */
  copyAriaLabel: string
  /** Visible label rendered above the mono-output box. */
  label: string
  /** The value to render in the box and copy to clipboard. Empty string renders an em-dash placeholder. */
  value: string
}
