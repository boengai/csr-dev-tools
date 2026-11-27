/**
 * Tags the parity configs select on (`defineParityConfig`).
 * - `CONTRACT`: the layout contract suite, which every project runs.
 * - `APP_WIDE`: a journey of the app itself (the dashboard layout, settings),
 *   which every build has. A run filtered to its ported Tools still runs it.
 * - `DIOXUS_ONLY`: a check a `ux-improvement` adds when it fixes an a11y
 *   baseline entry (docs/ux/parity.md → Improvements). React fails it by
 *   design, so the React run leaves it out.
 */
export const APP_WIDE = '@app-wide'
export const CONTRACT = '@contract'
export const DIOXUS_ONLY = '@dioxus-only'
