/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'

import { consumeHandoff, publishHandoff } from './tool-handoff'

afterEach(() => {
  localStorage.clear()
})

describe('tool-handoff', () => {
  it('round-trips a payload across publish → consume', () => {
    publishHandoff('mermaid-renderer', 'flowchart TD\n  A --> B')
    expect(consumeHandoff('mermaid-renderer')).toBe('flowchart TD\n  A --> B')
  })

  it('consumeHandoff is read-once: a second call returns null', () => {
    publishHandoff('mermaid-renderer', 'first')
    expect(consumeHandoff('mermaid-renderer')).toBe('first')
    expect(consumeHandoff('mermaid-renderer')).toBeNull()
  })

  it('returns null when nothing was published', () => {
    expect(consumeHandoff('mermaid-renderer')).toBeNull()
  })

  it('publish overwrites a pending handoff for the same channel', () => {
    publishHandoff('mermaid-renderer', 'one')
    publishHandoff('mermaid-renderer', 'two')
    expect(consumeHandoff('mermaid-renderer')).toBe('two')
  })

  it('clears the underlying storage key after consume', () => {
    publishHandoff('mermaid-renderer', 'payload')
    expect(localStorage.getItem('csr-dev-tools-handoff-mermaid-renderer')).toBe('payload')
    consumeHandoff('mermaid-renderer')
    expect(localStorage.getItem('csr-dev-tools-handoff-mermaid-renderer')).toBeNull()
  })

  it('namespaces the storage key with the handoff prefix', () => {
    publishHandoff('mermaid-renderer', 'x')
    expect(localStorage.getItem('csr-dev-tools-handoff-mermaid-renderer')).toBe('x')
  })
})
