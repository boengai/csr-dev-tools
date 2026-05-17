# ADR 0012 — `useDiagramIndex` not extracted

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

The DB-diagram React surface has two state channels coming out of
[[DiagramEditor]]:

1. **The diagram document** — exposed via
   `DiagramContext` (`src/components/feature/data/db-diagram/DiagramContext.tsx`)
   using the modern React 19 pattern: `useSyncExternalStore` over
   `editor.subscribe` / `editor.getDocument`. Every panel that needs
   the current document reads it from `useDiagram()`. 22 call sites
   across the panel files. Tearing-safe under concurrent rendering.

2. **The saved-diagrams index** — exposed via `editor.subscribeToIndex` /
   `editor.listDiagrams`, but **not** absorbed into `DiagramContext`.
   The one consumer
   (`DiagramListPanel.tsx:22-30`) hand-rolls the subscription with
   `useState` + `useEffect`:

   ```tsx
   const [diagramIndex, setDiagramIndex] = useState(() => editor.listDiagrams())
   useEffect(() => {
     setDiagramIndex(editor.listDiagrams())
     return editor.subscribeToIndex(setDiagramIndex)
   }, [editor])
   ```

A 2026-05-17 architecture pass — the one that shipped
[[Entity ID minters]] — considered absorbing the index into
`useDiagram()` so the hook returns `{ editor, document, index }` and
the index uses a second `useSyncExternalStore` call inside
`DiagramProvider`. The framing was: parity between the two channels,
plus tearing-safety the hand-rolled `useEffect` does not provide.

On closer reading the framing did not fit as a deepening.

- **Adapter count: one.** `subscribeToIndex` has exactly one
  production consumer (`DiagramListPanel.tsx`). The three other
  references live in `editor.persistence.spec.ts` (test code, not
  adapters). The project's standing rule is "two adapters = real
  seam" — one adapter is, by that rule, premature.
- **Deletion test fails for the proposed seam.** Absorbing the
  4-line subscription into the provider does not concentrate
  complexity; it just moves the same 4 lines from one file to
  another. No N callers collapse onto a shared owner. The benefit
  is purely consistency.
- **Consistency benefit is real but limited.** Tearing in this UI
  surface is theoretical: the index drives a sidebar list whose
  contents change only on user-initiated lifecycle ops
  (`newDiagram`, `loadDiagram`, `deleteDiagram`, `renameDiagram`),
  not on debounced or asynchronous flows. The two paths the
  hand-rolled hook cannot handle — concurrent-rendering tear and
  StrictMode double-effect — do not have observable consequences
  here today.
- **Modernization vs deepening.** Moving the index onto
  `useSyncExternalStore` is a useful refactor when a second
  consumer appears. As a one-consumer refactor, it would be
  cosmetic — codebase-style alignment with the document channel.
  Not architecture-positive.

## Decision

`DiagramListPanel`'s hand-rolled `useState` + `useEffect`
subscription **stays as-is**. `DiagramContext` continues to expose
only `{ editor, document }`; the diagram index is NOT absorbed.

## Consequences

**Positive**

- The "two adapters = real seam" rule is upheld. The project does
  not grow a seam against one adopter on consistency grounds alone.
- Future architecture passes do not re-suggest this migration; the
  ADR records the adapter-count and tearing-irrelevance reasoning.

**Negative**

- The two state channels coming out of [[DiagramEditor]] use
  different React patterns. A reader scanning `DiagramListPanel`
  has to recognize that the index follows the older pattern by
  intent, not by oversight.
- If concurrent rendering becomes load-bearing for the sidebar
  (unlikely for a saved-diagrams list, but possible), the
  hand-rolled subscription has a tearing window the
  `useSyncExternalStore` path does not.

## Revisit when

- A **second consumer** of `subscribeToIndex` or `listDiagrams`
  appears in `src/components/`. Two adopters cross the seam
  threshold; the modernization becomes a deepening.
- The diagram index gains a **non-user-initiated update source**
  (e.g., cross-tab sync via `BroadcastChannel`, or
  background-loaded remote diagrams). Concurrent-render tearing
  then becomes observable, and `useSyncExternalStore`'s
  guarantees start carrying weight.
- The sidebar starts driving **derived state** off the index
  (e.g., a filtered/sorted view computed during render). The
  hand-rolled subscription does not give React the snapshot
  contract needed for safe `useMemo` derivation across
  concurrent renders.
