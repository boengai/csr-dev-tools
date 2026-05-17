# ADR 0015 — Diagram operations keep `minters` in their signatures

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

The [[Entity ID minters]] consolidation (commits `baff62d` through `818316b`,
documented in CONTEXT.md) replaced module-local IIFE counters with a single
injectable seam. Every entity-id mint in the diagram domain now flows
through `EntityIdMinters` — whether interactive (editor → `addTable`,
`addColumn`, `addRelation`) or batch (DBML/SQL/JSON-Schema import codecs).

The recent `commitStructural` change (ADR-adjacent, recorded as invariant
6 in CONTEXT.md's `DiagramEditor` section) absorbed the editor-side
threading: every public mutator on `DiagramEditor` now goes through one
private channel, and `this.idMinters` no longer appears at any public
method body. The editor side of the minter concern is concentrated.

What remains is that 8 signatures across `src/diagram/operations/*` and
`src/diagram/codecs/*` still take `minters: EntityIdMinters` as a
parameter:

| Layer | Signature | Mints |
|---|---|---|
| Operation | `tableOps.addTable(doc, input, minters)` | 1 (table) + 1 (id column) |
| Operation | `columnOps.addColumn(doc, tableId, column, minters)` | 1 (column) |
| Operation | `relationOps.addRelation(doc, input, minters)` | 1 (relation) |
| Operation | `dbmlOps.applyDbmlNow(doc, minters)` | delegates to `parseDbml` |
| Operation | `importOps.importFromSql(doc, text, dialect, minters)` | delegates to `parseSqlDdl` |
| Operation | `importOps.importFromJsonSchema(doc, text, minters)` | delegates to `parseJsonSchema` |
| Codec | `parseDbml(text, minters)` | N (per parsed entity) |
| Codec | `parseSqlDdl(text, dialect, minters)` | N |
| Codec | `parseJsonSchema(schema, minters)` | N |

The natural next architectural question is: *can we lift `minters` out of
these signatures too?* Two alternatives were considered:

1. **Lift from creator ops**: change `addTable(doc, input & { id })` etc.,
   move minting to the editor's `commitStructural` callback. The op's
   signature stops mentioning minters.

   Apply the deletion test: the editor body grows by one line per
   creator method (`const id = m.table(); return tableOps.addTable(doc,
   { ...input, id })`). Each operation spec also grows (must mint
   before calling). The op's body still needs the id internally (to
   attach to the new entity AND to return). Nothing concentrates —
   the same knowledge moves from one place (the op) to two places
   (editor + every spec).

2. **Lift from codec ops**: change `parseDbml` to return a structure of
   "mint-this-shape" placeholders; have the import operation walk it
   again to substitute ids.

   Apply the deletion test: this doubles the traversal AND introduces a
   placeholder shape with no semantic value. The parser inherently
   knows it's emitting an entity; threading a minter is the natural
   place to assign its id. Lifting it loses locality at the parser and
   forces a meaningless second pass.

Both fail the deletion test. The minter parameter is shallow on a
per-signature reading but earns its keep when you look at where the
knowledge actually concentrates.

## Decision

`minters: EntityIdMinters` **stays in the signature** of every operation
and codec function that mints. The editor-side threading remains
absorbed by `commitStructural` (CONTEXT.md → `DiagramEditor`,
invariant 6).

No further refactor of the minter parameter at the operations or codecs
layer.

## Consequences

**Positive**

- Mint sites stay co-located with entity creation. A parser that emits
  an entity also assigns its id in the same scope — no two-step,
  no placeholder shape, no second traversal.
- The creator ops keep id minting atomic with the doc mutation that
  uses the id. The editor's `commitStructural` callback stays one
  line per public method.
- Operation specs construct entities directly: `addTable(doc, input,
  createSequentialIdMinters())` is one call, deterministic, exact-id
  assertable.

**Negative**

- Signature reading: 8 functions across `operations/` and `codecs/`
  surface `minters` as a parameter. A reader skimming `tableOps.addTable`
  sees the parameter and may wonder why the op needs it; the answer
  (mints one table id + one id-column id) is one line into the body.
- Future architecture passes scanning these files will see the same
  shape and may re-suggest lifting. This ADR is the answer.

## Revisit when

- A "batch parse session" concept emerges — e.g., a multi-file SQL
  import that needs sequential ids across files. At that point the
  current `EntityIdMinters` shape (three independent counters) may
  not fit, and a session-scoped variant could land. The operation
  and codec signatures would then naturally adapt to take that
  instead of the raw minter bag.
- The mint shape stops being three independent counters (e.g., adds
  per-entity randomness, or a "regenerate-on-conflict" loop). At
  that point the threading shape becomes more interesting and worth
  re-examining whether operations should own it or delegate.
- A non-diagram domain grows its own minter pattern (e.g., a future
  graph editor, a future entity manager). At two minter consumers
  the seam may want to abstract to a general `IdMinters<T>` shape,
  which would force a re-examination of how it's threaded.
