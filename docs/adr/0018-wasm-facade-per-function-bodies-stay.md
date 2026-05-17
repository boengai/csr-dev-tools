# ADR 0018 — WASM facade per-function bodies stay

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

`src/wasm/` holds ~18 facade modules — one per Rust crate exposed
through `wasm-bindgen` — totalling ~46 exported async functions across
`color.ts`, `csv.ts`, `diff.ts`, `formatter.ts`, `hash.ts`, `hmac.ts`,
`json-tools.ts`, `markdown.ts`, `number-base.ts`, `parsers.ts`,
`qrcode.ts`, `uuid.ts`, `bcrypt.ts`, and others.

Each facade declares a `CsrModule` type listing the WASM exports, then
exports per-method wrapper functions. Almost every function body
follows the same shape:

```ts
export async function jsonToCsv(input: string): Promise<string> {
  const wasm = await loadWasm<CsrCsv>('csv')
  return wasm.json_to_csv(input)
}
```

`loadWasm` (`src/wasm/init.ts:20-27`) memoizes per module name, so the
per-call cost is one Map lookup. The repetition is in *notation*,
not *cost*.

On close reading the bodies sort into three return-shape variants
(plain dispatch · nullable error `?? null` · `JSON.parse(...) as T`)
plus genuine outliers that don't fit a generic shape:

- `formatter.ts` — every function does an `isEmpty(input)` short-circuit
  and translates `(number | 'tab')` into `(n, useTabs)` args
- `bcrypt.ts` — branches to a Web Worker in browsers, only uses
  `loadWasm` in Node
- `parsers.generateSampleJson` — wraps `generateSampleJsonFromSchema`
  with a schema-stringify step
- Arg-defaulting functions (`csvToJson(input, indent = 2)`,
  `formatJson(input, indent = 2)`, `jsonToTypeScript(json, opts?)`,
  ~5 others)

A 2026-05-17 architecture pass explored a `defineWasm<M>(name)`
seam exposing `m.fn(picker)`, `m.fnNullable(picker)`, `m.fnJson<T>(picker)`,
and an `m.load()` escape hatch. The honest migration scope was ~27 of
~46 functions; the other ~19 would keep hand-written bodies (outliers
above plus every function with arg defaults).

The candidate failed the deletion test. If `defineWasm` got removed:

- Each migrated function reverts to its 2-line `await loadWasm(...)` body.
- No load-bearing knowledge concentrates anywhere — the cache lifecycle
  was already in `loadWasm`, and the three return-shape variants are
  patterns a reader recognizes without help.
- The "variant catalog" names three things that have been stable since
  the WASM migration began; nothing in the codebase has drifted into a
  fourth variant or shown signs of doing so.

Compared to existing `src/wasm/` siblings the depth claim was thin:
`loadWasm` itself owns the per-module memoization + Node-vs-browser
WASM bootstrap branch — the load-bearing knowledge is already there.
A `defineWasm` builder on top would compress the dispatch line into
a declarative form, which is a tidying, not a deepening.

## Decision

WASM facade modules (`src/wasm/*.ts`) keep their per-function bodies
as-is. No `defineWasm` builder, no per-variant constructor functions,
no method-callback picker abstraction. Each export declares its own
`const wasm = await loadWasm<CsrModule>('name')` + dispatch line.

`loadWasm` (`src/wasm/init.ts`) remains the only shared abstraction
across the facade family.

## Consequences

**Positive**

- The facade family stays grep-able: search for `wasm.method_name` and
  every adopter is one line away from the WASM call. No indirection
  layer to step through.
- New facades follow an obvious template — type definition + per-export
  load+dispatch — without learning a builder's variant catalog.
- Each function's return shape (plain · nullable · JSON-parsed) is
  visible at the function body, not encoded in a constructor choice.
- Outliers (`formatter.ts` isEmpty, `bcrypt.ts` worker, arg-defaulting
  functions) live alongside the rest in their natural shape; no seam
  boundary forces them into an "escape hatch."

**Negative**

- ~30 functions repeat the `await loadWasm<T>(name)` line and the
  `?? null` / `JSON.parse(...) as T` post-processing. A reader skimming
  the family sees three return-shape variants that aren't named in code.
- A future architecture pass scanning for repeated patterns may
  re-suggest the builder. This ADR is the answer.

## Revisit when

- A fourth return-shape variant lands that can't be expressed by a
  one-line wrapper (e.g., a streaming/chunked WASM return, a typed
  panic-recovery shape, or a progress-emitting facade). A genuine new
  variant changes the "three stable variants" premise.
- A load-bearing invariant lands that has to apply across every facade
  — e.g., panic recovery, telemetry on which WASM modules got loaded,
  or a load-progress signal that callers must opt into. At that point
  the per-facade builder concentrates knowledge that doesn't exist
  today.
- WASM facade count grows past ~30 modules. The current ~18-module
  scale is the point where the per-export repetition stays mechanical;
  beyond ~30 the family may earn a builder by sheer scale.
- A change to `loadWasm` itself (cache eviction, retry, version
  pinning) makes every facade need an update in lockstep. That would
  be the signal that the per-function bodies are leaking what should
  be a single concern.
