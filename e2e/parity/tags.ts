/**
 * Tags the parity configs select on (`defineParityConfig`).
 * - `CONTRACT`: the layout contract suite, which every project runs.
 * - `DIOXUS_ONLY`: a check a `ux-improvement` adds when it fixes an a11y
 *   baseline entry (docs/ux/parity.md → Improvements). React fails it by
 *   design, so the React run leaves it out.
 */
export const CONTRACT = '@contract'
export const DIOXUS_ONLY = '@dioxus-only'
