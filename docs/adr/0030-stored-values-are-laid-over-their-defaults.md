# ADR 0030 — Stored values are laid over their defaults

- **Status:** Accepted; Decisions 4 and 5 are narrowed for the Dioxus
  build by ADR-0032
- **Date:** 2026-11-25

## Context

`readJsonStorage` parsed the stored JSON and cast it to the default's
type. Only absent or unparseable JSON fell back to the default. A bag of
another shape (`null`, a missing `source`, a number where text belongs)
reached the Tool as if it were valid, and could crash it on open. The two
Zustand stores and the DB Diagram store had the same gap.

A saved bag changes shape whenever a Tool gains or renames a field, so
this does not take a corrupted browser.

## Decision

1. **The default is the schema.** `restoreJson(stored, initial)`
   (`src/utils/restore-json.ts`) lays a stored value over its default. A
   value of the default's JSON type is kept; anything missing or of
   another type becomes the default. It recurses through objects by field
   and through lists by item. CONTEXT.md → [[Persisted tool input]] has
   the rule and its limits.
2. **It runs inside `readJsonStorage`**, so every reader gets it from the
   default it already passes. The `storageKey` surface of ADR-0024 is
   unchanged. `initial` becomes `Required<…>` on `useToolFields` and the
   Transformer and Generator shells, so a top-level field without a
   default is a type error.
3. **Not per-field readers.** A reader or schema per Tool would be a
   second list of each Tool's fields and allowed values. It can drift from
   the selects: an option added to the select but not to the reader would
   reset a valid saved value, with no type error.
4. **Types only, no domain checks.** An unknown enum value or an
   out-of-range number is kept. The Tool handles it, as it did before.
5. **One exception: a number default also keeps text.** `indent` is saved
   as `2` or `'tab'`, and a Generator reports a bad count itself. Without
   the exception a saved `'tab'` would be lost.
6. **Where the default can't show the shape**, the reader adds its own
   check:
   - A Codec's stored mode must be one of its modes, or the first mode
     opens.
   - A `feature_layout` slot may be `null` (a closed widget).
   - DB Diagram lists have no default content, so
     `src/diagram/codecs/restore.ts` restores them item by item. A
     relationship whose table is gone is dropped. One whose column is gone is
     kept: older versions could save it, and Mermaid still draws it. A diagram
     is kept as `unknown` until it is loaded.
   - Markdown Table checks its grid as one value.

## Consequences

- A damaged field no longer takes the rest of its bag with it.
- A field the default does not name is kept and written back, so rolling
  back a release does not lose a newer field.
- Reading never writes. After the next write the damaged parts are gone,
  and a partly readable diagram has no backup. A store without a
  `diagrams` object still goes to the backup key.
- Generators open with defaults, instead of an error, when a saved option
  is missing or of the wrong type. Text for a number still reaches them.
- The Timezone Converter migration is deleted: the rule reads the old bag.
- Repeated or reserved diagram ids (two tables with one id, an id of
  `__proto__`) are values, not shapes, and are not repaired.

## Revisit when

- A default needs to be `null`, or a list of objects needs to start empty.
  The rule can't restore either.
