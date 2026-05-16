# ADR 0005 — ProtobufCodec stays on `useInputLocalStorage` for its shared bag

- **Status:** Accepted
- **Date:** 2026-05-16

## Context

`ProtobufCodec` (`src/components/feature/code/ProtobufCodec.tsx`,
~514 lines) is the only Tool that combines **three** computation
pipelines around **one** shared persisted state bag:

```
top level:
  useState(action: 'encode' | 'decode')           transient
  useState(dialogOpen)                            transient
  useState(selectedMessageType)                   transient, derived from schema parse
  useInputLocalStorage<PersistedState>(...)       persisted 5-field bag:
                                                  { schema, encodeSource, encodeFormat,
                                                    decodeSource, decodeFormat }
  useToolComputation<string, SchemaParseOutput>   schema → messageTypes[]
  useMountOnce(() => setSchemaInputImmediate(persisted.schema))

children (one rendered at a time via `action`):
  <EncodeContent>: own useToolComputation<EncodeInput, string>
  <DecodeContent>: own useToolComputation<DecodeInput, string>
```

A 2026-05-16 architecture pass considered migrating the top-level
`useInputLocalStorage<PersistedState>` + `useToolComputation` for the
schema parse + `useMountOnce` into the documented
[[Persistent tool field bag]] (`useToolFieldsPersisted`) — the same
collapse that worked for `JsonDiffChecker` and `JsonSchemaValidator`.

On closer reading the framing did not fit:

- The bag has **five fields**; only **one** of them (`schema`) drives a
  compute. `useToolFieldsPersisted`'s `compute` re-fires on every
  `inputs` change. Migrating would cause `parseProtobufSchema` to re-run
  every time the user typed in `encodeSource` or toggled
  `decodeFormat` — wasted work the current shape avoids.
- `isEmpty` cannot fix this. It short-circuits when the bag is empty; it
  does not gate on which field changed.
- The alternative — splitting `schema` into its own
  `useToolComputationPersisted` and keeping the four
  source/format fields under `useInputLocalStorage` — would require two
  storage keys and a migration shim for existing users (whose data lives
  under one key today). Net change: 3 lines of `useMountOnce` saved
  against a split-key invariant + shim to maintain in perpetuity.

`useInputLocalStorage` is doing what it was designed for: persistence
of a JSON bag under one key, decoupled from any single compute pipeline.
The `useMountOnce` at lines 444-446 is doing what it was designed for:
firing a non-pipeline mount-time side effect (priming the schema parse
from restored input). Neither is reassembling pipeline invariants.

`ProtobufCodec`'s 514 lines come from `<EncodeContent>` and
`<DecodeContent>` being two substantial sibling UIs that share a parent
orchestrating the schema parse — not from hand-rolled persistence.

## Decision

`ProtobufCodec` will **not** migrate to
[[Persistent tool field bag]]. Its top-level
`useInputLocalStorage<PersistedState>` + top-level
`useToolComputation<string, SchemaParseOutput>` + `useMountOnce` stay
as-is. The two child `useToolComputation` calls inside
`<EncodeContent>` / `<DecodeContent>` also stay; they are not
candidates for the persisted variant because the inputs they compute
on are funneled in from the parent's bag, not owned per-component.

The smaller surgical alternative — splitting the schema field into a
dedicated `useToolComputationPersisted` to absorb the `useMountOnce` —
is also declined: the net change costs more invariants than it removes.

## Consequences

**Positive**

- `parseProtobufSchema` continues to run only when the schema changes,
  not on every source/format keystroke.
- One localStorage key continues to hold the entire bag — no migration
  shim needed for the existing user base.
- Future architecture passes will not re-suggest this migration; this
  ADR records why the bag-plus-one-pipeline shape isn't the same as the
  hand-rolled triad [[Persistent tool field bag]] absorbs.

**Negative**

- The `useInputLocalStorage` + `useMountOnce` pair stays in the
  top-level component. Readers scanning for "tools still using the old
  pattern" will land here and need this ADR to understand it's
  intentional rather than missed migration debt.
- `ProtobufCodec` remains the largest feature component without an
  adjacent `.spec.tsx`. The compute logic IS extracted (per ADR-0004:
  `src/wasm/parsers` + `src/utils/protobuf-codec.spec.ts`); the
  component itself is composition + JSX over three pipelines and stays
  untested at the Tool level. Acceptable.

## Revisit when

- A second Tool emerges with the same "shared persisted bag + multiple
  pipelines reading slices" shape. At two adapters the seam becomes
  real and a dedicated hook (something like
  `usePersistedBagWithSlicePipelines`) could earn its keep against two
  concrete callers.
- A field is added to `PersistedState` that DOES drive the top-level
  compute — at that point the bag truly has two compute-driving fields
  and the question reopens. Today, only `schema` drives compute.
- A future iteration eliminates one of the child pipelines (e.g., merges
  encode/decode into a single bidirectional pipeline). At that point
  [[Bidirectional converter]] becomes a real candidate and this ADR is
  superseded.
