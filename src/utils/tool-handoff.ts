/**
 * Cross-tool handoff: a typed channel that lets one Tool publish a payload for
 * another Tool to consume on its next mount. Currently used by DB Diagram's
 * Mermaid export to seed the Mermaid Renderer when the user clicks
 * "Open in Renderer".
 *
 * Carries two invariants:
 *   1. Channel keys are typed (HandoffChannel union), so a typo at the
 *      producer or consumer fails to compile rather than silently dropping.
 *   2. `consume` is read-once: it returns the payload AND clears it. A second
 *      call returns null. Stops a stale prefill from leaking into a later
 *      Tool mount.
 *
 * Transport is `localStorage`. Producers typically `publishHandoff` then
 * `window.open` the consumer route — the consumer mounts and `consumeHandoff`
 * fires within the same tick.
 */

export type HandoffChannel = 'mermaid-renderer'

const HANDOFF_KEY_PREFIX = 'csr-dev-tools-handoff-'
const channelKey = (channel: HandoffChannel): string => `${HANDOFF_KEY_PREFIX}${channel}`

export const publishHandoff = (channel: HandoffChannel, payload: string): void => {
  localStorage.setItem(channelKey(channel), payload)
}

export const consumeHandoff = (channel: HandoffChannel): string | null => {
  const key = channelKey(channel)
  const payload = localStorage.getItem(key)
  if (payload != null) localStorage.removeItem(key)
  return payload
}
