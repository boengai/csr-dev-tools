# ADR 0032 — Saved inputs are read where they are

- **Status:** Accepted
- **Date:** 2026-11-27
- **Narrows:** ADR-0030 Decisions 4 and 5, for the Dioxus build only

## Context

The map ([issue 5](https://github.com/boengai/csr-dev-tools/issues/5))
requires that a returning visitor's saved inputs still load after the
Dioxus cutover. [How do saved inputs survive
cutover?](https://github.com/boengai/csr-dev-tools/issues/23) decided how,
in conversation on 2026-11-27.

- **What is stored.** [Issue 15](https://github.com/boengai/csr-dev-tools/issues/15)
  lists 74 `localStorage` keys across 44 tools, two `sessionStorage`
  entries (TanStack Router's scroll positions and reload guard) and one
  Cache Storage entry. It was read at `c3983f81`, before #30. It also lists what is awkward to read from
  Rust: keys that cannot be derived from tool keys, `indent` as a number
  or `"tab"`, numbers stored as text, the Zustand envelope, unchecked
  enums, all diagrams in one value, and a lone UTF-16 surrogate that
  `serde_json` refuses.
- **What production runs.** Production is still `3bb2029f`, deployed by
  hand on 2026-11-03. It writes the older shape of four tools. `main` has
  since gained three per-tool migrations (Mermaid and JSON Schema
  Validator first, JSONPath in #30) and, in #30, the restore rule of
  [ADR-0030](0030-stored-values-are-laid-over-their-defaults.md). It has
  not been deployed.
- **The first-party Dioxus storage crate cannot read any of it.** It
  stores compressed CBOR ([issue 10](https://github.com/boengai/csr-dev-tools/issues/10)).
- **The spike** read one key through the browser's `JSON.parse`. None of
  its code is kept ([ADR-0031](0031-migrate-to-dioxus.md)).

## Decision

1. **Rollback must lose nothing.** After cutover, the React build must
   still read whatever the Dioxus build wrote. The rollback target is
   React `main` as it stands before the cutover merge, which includes #30.
   A rollback to `3bb2029f` would not see input the migrations below have
   moved. So the Dioxus build:
   - reads the existing keys and shapes where they are. There is no
     one-time migration into a new format;
   - writes back the same keys, spelled as today (the `csr-dev-tools-`
     prefix on all but `feature_layout` and `settings`), in the same JSON
     shapes;
   - keeps fields its types do not name and writes them back with the
     value;
   - keeps the Zustand envelope `{state, version}` at version 2 for
     `feature_layout` and 0 for `settings`.
2. **`main` after #30 is the reference.** The Dioxus build reads exactly
   what `main` reads: every current key, and the four older shapes `main`
   migrates (below). Issue 15 lists nine keys that shipped once and that
   nothing read. Since #30, `main` migrates one of them,
   `…-jsonpath-evaluator`. The other eight (`…-json-formatter-source` and
   the rest) stay unread.
3. **The four migrations are ported as `main` runs them.**
   - Three run once, when their tool opens:
     - `…-mermaid-renderer-code` to `…-mermaid-renderer`, when the new key
       is absent, deleting the old key;
     - JSON Schema Validator's `{jsonData, jsonSchema}` to
       `{source, schema}`, in place;
     - `…-jsonpath-evaluator` to `…-jsonpath-evaluator-v2`, when the new
       key is absent and the old value is neither junk nor the default. It
       deletes the old key and puts it back if the new write fails.
   - The layout store's runs when it loads, at app start on any page. A
     layout at version 1 or older goes through the rules of
     `migrateLayoutValue`. Any stored version other than 2 is written back
     as version 2.

   These and the Mermaid handoff key, which is deleted once read, are the
   only reads that write. Timezone Converter's older shape needs no
   migration: `source` takes its default, and `sourceTz` and `targetTzIds`
   are kept.
4. **A damaged part takes its default; the rest survives.** ADR-0030's rule
   carries over: a stored value is laid over the tool's default, part by
   part. Nothing crashes, and apart from Decision 3, reading never writes.
   Two points narrow it for the Dioxus build:
   - **Strict by type.** A part that does not decode into its Rust type
     takes its default. An unknown enum value, such as a mode of `"zzz"`
     or an unknown tool key in a layout slot, is not kept. Neither is text
     in a number field. Real alternatives are modelled as types, such as
     `Indent::Spaces(n) | Tab`. ADR-0030 kept these values to avoid a
     second list of each tool's options, which could drift. In Rust the
     enum is that list. Fields the type does not name are still kept
     (Decision 1).
   - **Half an emoji becomes U+FFFD.** A Rust `String` cannot hold a lone
     surrogate, so it cannot round-trip. A pure-Rust pass before
     `serde_json` rewrites an unpaired `\uD800`–`\uDFFF` escape to
     `�`. It leaves an escaped backslash (`\\ud83d`) alone. The rest
     of the value is kept.

   The special readers of ADR-0030 stay:
   - a Codec's mode must be one of its modes;
   - a layout slot may be `null`;
   - DB Diagram is restored item by item, with its corrupt backup key;
   - Markdown Table checks its grid as one value.
5. **The persistence API stays one `storage_key` option.**
   - A tool turns saving on by passing `storage_key` to its shell. A
     bespoke bag passes the same option to the equivalent hook.
   - The saved type is the tool's own fields struct, with serde and
     `Default`. Its default value is the schema. There is no per-tool
     reader beyond the special readers above.
   - Keys are written out literally, never derived from the tool key
     (`json-diff-checker` saves under `json-diff`). Every tool's keys can
     be listed by code: its fields key, or a Codec's mode key and source
     prefix. Where the key table lives is
     [issue 20](https://github.com/boengai/csr-dev-tools/issues/20)'s
     choice.
   - The restore path runs without a browser and is tested natively. That
     covers the surrogate pass, laying a value over its default, the typed
     decode, keeping unnamed fields, and the migrations. Only a thin adapter
     touches `localStorage`. This is a requirement on issue 20.
6. **Timing and first render copy React.** As in CONTEXT.md →
   [[Persisted tool input]] for Fields and Input, and issue 15's read and
   write table for the rest:
   - The saved value is there on the first render, with no flash of
     defaults. Fields and Input are read once, on mount, and a non-empty
     restore runs the tool. The Codec re-reads a mode's source when the
     mode switches. DB Diagram reads its store on mount and before every
     write.
   - Fields and Input write 300 ms after typing stops, at once for
     controls, and flush on unmount and `pagehide`. The Codec, Value
     (`useInputLocalStorage`), settings and layout write at once. DB
     Diagram saves 3 s after the last edit; rename and delete save at
     once.
   - Reset restores the declared default and saves it. Each tool keeps its
     own close behaviour.
   - There is no sync between tabs, as today.
7. **A failed write never panics.** It is swallowed and the tool keeps
   working. DB Diagram keeps its storage status. Two React behaviours are
   not copied: the Zustand setter that throws after updating its state,
   and the Mermaid handoff that throws. A failed handoff becomes an error
   in DB Diagram's status.
8. **The stored-value contract is what both builds are tested against.**
   It has two parts, committed as data:
   - **The key list:** every key and key pattern the site may write: the
     issue 15 table brought up to `main` after #30, so it includes
     `…-jsonpath-evaluator`, which the JSONPath migration can write back.
     A Dioxus test fails if the build can write a key that is not on it.
     This stops a tool that saves nothing today from starting to save:
     hash, HMAC, JWT, certificate, SSH fingerprint, URL parser, QR code,
     Markdown preview, Base64 to image, SVG viewer, Unix timestamp, and
     AES text and password.
   - **Golden values:** captured from the React build on `main`, not typed
     by hand. For each key, the raw stored text of the current shape, each
     older shape, and the damaged values from issue 15, with the restored
     value expected. The expected value is what React `main` restores
     (`restoreJson`, or that key's special reader or migration), except
     where Decision 4 differs on purpose; those entries are written by hand
     and marked.

   Native Rust tests run every golden value through the restore path. One
   Playwright journey per saving tool is written against React first and
   must pass unchanged on Dioxus. It seeds a React-written value, checks
   the saved input shows, edits it, and checks the stored text still has
   React's shape. That journey is the rollback proof. This is a
   requirement on [issue 24](https://github.com/boengai/csr-dev-tools/issues/24).
   A fix on `main` that changes a stored shape must update the contract.
9. **Cutover keeps the origin.** `localStorage` belongs to one scheme, host
   and port. Serving the Dioxus build from another hostname or Pages
   project would lose every saved input. This goes to the map's Cutover
   item.
10. **Not carried over:**
    - TanStack Router's scroll positions and reload guard in
      `sessionStorage`. They last one session, and the router goes. The
      cost is one lost scroll position on the first reload after cutover.
    - The background-removal model in Cache Storage
      (`transformers-cache`, about 53 MB). Whoever replaces that engine
      decides whether to delete it.
    - No cleanup pass. The Dioxus build deletes nothing beyond what the
      ported migrations and the handoff delete.

## Considered options

- **Migrate once into a Rust-native format on first load.** Easier to
  read from Rust. A rollback would need a reverse migration, and a tool
  never opened would still need the old readers.
- **Mirror React's leniency** (an `Other(String)` case on every enum,
  number-or-text on every number). It keeps values the UI cannot produce,
  at the cost of a wider type on every field.
- **Read-only legacy fallbacks** instead of migrations that write. Purer,
  but the old keys would stay in storage for good, and a rollback would
  find a different state from the one React's own migration leaves.
- **Parse through the browser's `JSON.parse`.** `JSON.parse` keeps the
  lone surrogate, and converting the result to a Rust `String` replaces
  it with U+FFFD. The result is the same, but the restore path could then
  only be tested in a browser.
- **Default a value holding a lone surrogate.** Loses the whole value for
  one character.

## Consequences

- The Dioxus build carries React's key names, shapes and envelope versions
  for as long as rollback matters, even where Rust would choose others.
- A saved value the React UI could not produce (an unknown mode, text in a
  count) is replaced by its default on the next write. React would have
  kept it. A layout slot naming a tool this build does not know takes
  that slot's default.
- A lone surrogate is saved back as U+FFFD.
- The four migrations stay indefinitely. Nothing tells us when the last
  older value is gone.
- The stored-value contract must exist before the first port that saves
  input: [Capture the stored-value contract from
  React](https://github.com/boengai/csr-dev-tools/issues/38).

## Revisit when

- Rollback to React is no longer possible. The shapes may then change,
  through a migration of their own.
- A future change needs a shape the restore rule cannot read. ADR-0030's
  own limits still apply: a `null` default, or a list of objects that
  starts empty.
