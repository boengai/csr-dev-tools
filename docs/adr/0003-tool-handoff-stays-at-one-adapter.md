# ADR 0003 — Tool handoff stays as a typed seam at one adapter

- **Status:** Accepted
- **Date:** 2026-05-16

## Context

The [[Tool handoff]] module (`src/utils/tool-handoff.ts`, ~25 lines) is a
typed cross-tool channel: one Tool publishes a payload that another
Tool consumes on its next mount. Implemented by `publishHandoff` /
`consumeHandoff`. Documented in CONTEXT.md.

Today's only channel: DB Diagram's "Open in Mermaid Renderer" button
publishes the generated Mermaid syntax under the `'mermaid-renderer'`
channel; the Mermaid Renderer Tool's mount calls
`consumeHandoff('mermaid-renderer')` and seeds its editor. One
producer (`db-diagram/ExportMermaidPanel.tsx`), one consumer
(`feature/code/MermaidRenderer.tsx`).

This is one adapter. The project's standing rule is "two adapters =
real seam" — and the abstraction has held at one adapter through the
entire multi-field Tool migration arc (14 merged slices) without a
second channel materializing. The 2026-05-16 architecture pass
re-asked the question: keep the abstraction or delete it and inline
the ~10 lines of localStorage round-trip into the two callers?

## Decision

`tool-handoff` is **kept as a typed module at one adapter**. The
"two adapters" rule is about code-shape re-use; `tool-handoff`'s
load-bearing value is type-safety and invariant centralization, both
of which apply at one adapter as much as at two.

Specifically, the module owns two invariants the call sites would
otherwise have to re-implement:

1. **Channel keys are typed** (`HandoffChannel` union). A typo at
   either the producer or the consumer fails to compile rather than
   silently dropping the handoff. Inlining `localStorage.setItem('mermaid-render', ...)`
   at the producer and `localStorage.getItem('mermaid-renderer', ...)`
   at the consumer (note the typo) would compile cleanly and silently
   misbehave.

2. **`consume` is read-once** — it returns the payload AND clears it.
   A second mount of the same consumer returns null. Stops a stale
   prefill from leaking into a later visit. Inlining would require
   each consumer to re-implement the read-and-clear pattern correctly,
   and a future consumer that did just `localStorage.getItem(key)`
   without the clear would silently leak stale state.

The cost of keeping the abstraction is ~25 lines for one adopter. The
cost of inlining is ~10 lines saved AND losing both invariants at
each new site that ever wants this channel pattern.

## Consequences

**Positive**

- Future channels (if any emerge) come for free with the type-checked
  key and read-once semantics built in.
- The CONTEXT.md "Tool handoff" entry continues to be the single
  reference for cross-Tool channel semantics.
- Future architecture passes will not re-suggest deleting this
  abstraction; this ADR records why one adapter is enough.

**Negative**

- ~25 lines of module code carry one adopter. Cost is small but real.
- A reader scanning `src/utils/` may wonder why such a small module
  has its own file. The JSDoc + this ADR are the answer.

## Revisit when

- The abstraction grows beyond the current two invariants — e.g.,
  channels need TTL, batching, schema validation, or cross-tab
  coordination. At that point the cost-of-keeping crosses the
  cost-of-inlining, and the design needs a real re-think (not just
  a delete/keep decision).
- The DB Diagram → Mermaid Renderer channel itself is removed
  (e.g., the "Open in Mermaid Renderer" button goes away). At zero
  adapters, the abstraction earns nothing and should be deleted.
- A second channel emerges that has notably different shape (e.g.,
  streaming payload, multi-consumer broadcast) — the current
  abstraction may not fit, in which case the question becomes
  "extend the existing module or build a sibling" rather than
  "keep or delete."
