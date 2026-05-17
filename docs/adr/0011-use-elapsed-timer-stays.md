# ADR 0011 — `useElapsedTimer` stays

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

`useElapsedTimer` (`src/hooks/useElapsedTimer.ts`, ~19 lines) takes an
`isRunning: boolean` and returns the elapsed seconds since `isRunning`
flipped to `true`, ticking every 100ms via `setInterval`. The hook owns
its `useState<number>` plus the `useEffect` that schedules the interval
and clears it on `isRunning` change or unmount.

A 2026-05-17 architecture pass tagged it as a "one-adapter, deletion-test
passes" candidate. A grep for adopters returned a single file:
`BcryptHasher.tsx`. The inferred friction was "19 lines + a spec file
maintained for 1 caller" — fold it back into BcryptHasher.

## Decision

`useElapsedTimer` is **kept as a primitive**. On closer reading the
file-count framing did not fit: BcryptHasher uses the hook **twice**, in
two distinct subtree components with two independent lifecycles:

| Site | Subcomponent | Driven by |
|---|---|---|
| `BcryptHasher.tsx:48` | `HashTab` | `hashing` from `useAsyncAction` |
| `BcryptHasher.tsx:149` | `VerifyTab` | `verifying` from `useAsyncAction` |

By the project's "two adapters = real seam" rule, that is two adapters
of the same `(isRunning) => elapsed` shape. Inlining would duplicate
the `useState(0)` + `useEffect(() => { setInterval... }, [isRunning])`
block at two sites that already live next to each other and would be
the first to drift apart.

The seam is also load-bearing for tests: `useElapsedTimer.dom.spec.tsx`
exercises the start/stop/clear-on-unmount path directly via
`renderHook`, which would otherwise have to be re-derived against
BcryptHasher's full async flow.

## Consequences

- File-count heuristics ("hook X is imported by only one file") are
  misleading for hooks consumed by sibling subcomponents in the same
  file. Future architecture sweeps should grep call sites
  (`useElapsedTimer\(`), not just `import` statements.
- If a third Tool needs a wall-clock tick (e.g., a future
  PasswordStrengthMeter or LongRunningCsvImport), the seam is already
  there to reuse.
- If BcryptHasher ever consolidates `HashTab`/`VerifyTab` into one
  component sharing a single `pending` state, the hook would drop to
  one adapter and the question becomes worth re-asking.
