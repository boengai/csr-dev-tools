# ADR 0010 — `useMountOnce` stays as a primitive

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

`useMountOnce` (`src/hooks/useMountOnce.ts`, ~35 lines) runs a callback
exactly once after the component mounts, including under
`React.StrictMode` (which double-invokes effects in development). It does
this via a deferred `setTimeout(0)` whose first-mount schedule is
cancelled by the first-mount cleanup, then re-scheduled by the second
mount — so the callback fires after the cleanup-remount cycle settles
and observes the post-remount state.

A 2026-05-17 architecture pass asked whether the hook had become
shallow. After the pipeline gained `autorunOnMount` (this pass's
sibling deepening), the remaining callers dropped from 14 to **5**:

| Caller | What it runs in `useMountOnce` |
|---|---|
| `UuidGenerator.tsx:17` | `useAsyncAction.run()` (non-idempotent — generates a batch of UUIDs) |
| `MermaidRenderer.tsx:103` | `initializeMermaid()` + `consumeHandoff('mermaid-renderer')` + `setInputImmediate(prefill)` |
| `BidirectionalConverter.tsx:71` | `setFieldsImmediate(initialBag)` (per-mode localStorage source restore) |
| `useToolFields.ts` (NEW) | `setInputImmediate(inputsRef.current)` when `autorunOnMount: true` |

The five callers serve **four different concerns** — not one shape.
Applying the deletion test: if `useMountOnce` were deleted, complexity
would NOT concentrate in one new module — it would redistribute as
`useEffect(fn, [])` (plus a `useRef` guard) at five sites.

## Decision

`useMountOnce` is **kept** as a first-class primitive at five adopters.

The hook's load-bearing value is the **StrictMode-safe deferred-fire
guarantee**, which:

1. Prevents double-firing of non-idempotent callbacks in development —
   load-bearing for `UuidGenerator`, which would otherwise generate two
   batches of UUIDs on first mount in dev mode. The other four adopters
   have idempotent callbacks, so they would tolerate a bare
   `useEffect(fn, [])` — but the convention of "I-don't-want-to-think-
   about-StrictMode-double-fire when scheduling mount work" is itself
   the value the hook delivers. The cost of reading `useMountOnce(...)`
   and knowing the guarantee is lower than the cost of reading
   `useEffect(() => { /* is this idempotent? */ }, [])` and deciding.

2. Ensures any state mutations the callback makes — e.g. firing the
   pipeline via `setInputImmediate` — observe the post-remount state,
   not the soon-to-be-invalidated first-mount state. This matters most
   for `MermaidRenderer`'s WASM-init + handoff-override sequence: a
   bare `useEffect(init)` would run twice in dev, producing two
   `initializeMermaid()` calls back-to-back with no opportunity for
   the library to detect "already initialized."

The five adopters serve four concerns, so the hook is not deep in the
sense of "one shape behind one interface." But the **invariant** it
owns — "mount work runs after StrictMode settles, exactly once" — is a
real invariant that earns its keep at five sites. The "two adapters =
real seam" rule is about code-shape re-use; this hook's value is
invariant centralization, like [[Tool handoff]] (ADR-0003).

## Consequences

- The 2026-05-17 architecture pass closes the door on inlining
  `useMountOnce` callers as bare `useEffect(fn, [])`.
- New mount-time work in a Tool reaches for `useMountOnce` by default,
  not `useEffect(fn, [])` — the StrictMode-safety is the documented
  convention.
- If a future pass adds an `autorunOnMount`-equivalent to the single-
  Input pipeline siblings (`useToolComputation` /
  `useToolComputationPersisted`), the `useMountOnce` callers in those
  pipelines collapse further — but the hook still has at least
  `UuidGenerator` (non-idempotent run), `MermaidRenderer` (WASM init),
  and `BidirectionalConverter` (per-mode source restore) as adopters
  that cannot move into a pipeline option.
- The hook's `setTimeout(0)`-deferred semantics are part of its
  contract — adopters depend on the post-remount state being visible
  when the callback fires. Changing to a synchronous `useEffect` schedule
  would silently break `MermaidRenderer`'s handoff-override sequence and
  the pipeline-driven autorun pattern.
