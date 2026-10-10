/** Modifier-key label for keyboard hints: `⌘` on Apple platforms, `Ctrl+` elsewhere (render as `{MOD_KEY_LABEL}K`). */
export const MOD_KEY_LABEL: string =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent) ? '⌘' : 'Ctrl+'
