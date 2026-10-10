# ADR 0024 — Persisted pipeline hooks fold into a `storageKey` option

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

The [[Tool computation pipeline]] family had five hooks:

| Hook | Owns input? | Persists? |
|---|---|---|
| `useToolComputation` | no | no |
| `useToolInput` | single value | no |
| `useToolFields` | field bag | no |
| `useToolComputationPersisted` | single value | yes |
| `useToolFieldsPersisted` | field bag | yes |

The two persisted hooks were thin layers adding the same two concerns
(seed from localStorage once on mount; write back on change) plus a
mount autorun rule. They had drifted apart from their non-persisted
siblings:

- `useToolComputationPersisted` re-implemented `useToolInput`'s
  input-mirroring (its own `useState<I>` + two mirrored setters) instead
  of wrapping it, and so lacked `reset()` and recomputed from the
  pipeline's last input rather than the owned input.
- `useToolFieldsPersisted` passed the restored bag as `initial`, so its
  `reset()` restored the mount-time stored bag rather than the declared
  default — contradicting the documented contract on
  `UseToolFieldsOptions.initial` ("also the value `reset()` restores").
- Both wrote to localStorage from a `useEffect` on every input change:
  one `JSON.stringify` + `setItem` per keystroke, and an extra write of
  the seed on every mount.

The choice of hook was really a choice along two independent axes
(single vs bag; persisted vs not), encoded as four names.

## Decision

Persistence becomes an optional `storageKey` on `useToolInput` and
`useToolFields`. `useToolComputationPersisted`, `useToolFieldsPersisted`
and their option/result types are deleted; their eleven call sites pass
`storageKey` to the matching base hook. Vocabulary in CONTEXT.md:
[[Persisted tool input]].

With `storageKey`:

- The seed is read once in a lazy `useState` initializer
  (`readJsonStorage`).
- Writes go through a new `useDebouncedJsonWrite` primitive: trailing
  debounce on the pipeline's `debounceMs` (default 300ms) for
  `setInput` / `setFields`; immediate for the `*Immediate` setters and
  `reset()`; pending writes flushed on unmount and on `pagehide`.
  Writes happen in the setters, not in an effect, so the seed is no
  longer re-persisted on mount.
- Mount autorun is unchanged from the persisted hooks: it fires when
  `autorunOnMount === true` OR (`isEmpty` provided AND the restored value
  is non-empty). The `isEmpty` arm is gated on `storageKey` so
  non-persisted adopters keep their previous no-autorun behaviour.

`useInputLocalStorage` stays — it serves bespoke bags not driven by one
pipeline (ADR-0005's `ProtobufCodec`).

## Consequences

**Positive**

- Three pipeline hooks instead of five; persistence is a flag, not a
  fork. Fixes to `useToolInput` / `useToolFields` (e.g. the AbortSignal
  threading) reach persisted adopters automatically.
- localStorage writes drop from one per keystroke to one per debounce
  window, with no data loss on reload or navigation.

**Negative / behaviour changes**

- `reset()` on a persisted bag now restores `options.initial` instead of
  the mount-time stored bag. Only `DiffCheckerShell` calls `reset()` on a
  persisted hook; its Reset button now clears to empty as the label
  promises.
- The seed is not written back on mount. A Tool that never receives
  input leaves its key absent rather than holding the default.
- A write can be lost only if the tab is killed without `pagehide`
  firing (process crash) inside the ≤300ms window — accepted.

## Revisit when

- A third axis appears (e.g. sessionStorage, URL-state persistence) —
  at that point `storageKey` may want to become a `persist` strategy
  object rather than a string.
