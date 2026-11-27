# Tool UX

Every Tool is built from one of five **layout types**. Each layout type has a
shell in `src/components/common/`, and **the shell is the spec**. The pages
here are rough drawings and journeys that explain it. If a page and its shell
disagree, the shell wins; fix the page. ADR-0027 records why.

| Layout type | Shell | Page |
|---|---|---|
| Transformer | `TransformerShell` | [transformer.md](transformer.md) |
| Codec | `CodecShell` | [codec.md](codec.md) |
| Generator | `GeneratorShell` | [generator.md](generator.md) |
| File Processor | `FileProcessorShell` | [file-processor.md](file-processor.md) |
| Comparator | `ComparatorShell` | [comparator.md](comparator.md) |

A Tool declares its type as `layout` in `src/constants/tool-routes.ts`.
`custom` opts out, and `layoutOptOutAdr` must name the ADR that explains why.

## Layout order (all shells)

```
┌ Dialog ──────────────────────────────────────────────────────── [×] ┐
│ Title                                                                │
├──────────────────────────────────────────────────────────────────────┤
│ Mode      [ A → B ]( B → A )                         ← Codec only     │
│ Controls  indent ▾  dialect ▾  ☐ option                               │
│ Status    ⚠ Invalid JSON: unexpected token at 1:2   ← one fixed spot  │
├───────────────────────────────┬──────────────────────────────────────┤
│ Input label                   │ Output label                  [⧉]    │
│ ┌───────────────────────────┐ │ ┌──────────────────────────────────┐ │
│ │ source / options / upload │ │ │ result, or the placeholder:      │ │
│ │                           │ │ │ "Paste JSON to format it"        │ │
│ └───────────────────────────┘ │ └──────────────────────────────────┘ │
│ [ Generate ] / [ Process ]    │ [ Download ]                         │
└───────────────────────────────┴──────────────────────────────────────┘
  Mobile: the input stacks above the output.
```

## Where a Tool appears

The same shell renders in two places (ADR-0029):
- **Dashboard:** a tile opens the Tool in a full-screen dialog. Escape or
  the close dot closes it and resets the input.
- **Tool route** (`/tools/<key>`): the Tool renders inline in a full-width
  page card with its name as the heading. The card's close dot resets the
  input and goes home. Leaving any other way keeps the saved input.

## Rules the shells enforce

The shells enforce these, so a Tool can't choose differently.

- **Run timing**
  - Same input gives the same output, and it's fast: runs **as you type**
    (300 ms debounce).
  - Random output (UUID, password, RSA): a **Generate** button. Changing
    an option regenerates; typing in a text option waits for a pause.
  - Options-only output that is the same for the same options (Lorem
    Ipsum, Color Palette, Crontab, Markdown Table, Placeholder Image): the
    Generator's `live` mode reruns on every change, no button.
  - Slow on purpose (RSA keygen): the button shows a **busy state**
    (spinner and elapsed time). There's no numbered progress (ADR-0001).
- **Errors**
  - Bad input appears in the **status slot**, and the output is cleared.
    It never appears as a toast.
  - A Tool can add **notices**, messages about a valid result (e.g.
    "skipped 2 lines"). These sit in the same slot, and the output stays.
  - Toasts are only for the outcome of an action: copied, downloaded,
    file read failed.
- **Buttons**
  - The buttons that take the output away sit with the output: Copy in
    its label, Download at its bottom.
  - The button that creates output sits under the input: Generate,
    Process.
  - When a Tool has both (e.g. QR code SVG, Mermaid's SVG/PNG), both go
    in the output label, with Download as an icon button.
  - ⌘/Ctrl+Enter triggers Generate or Process while the dialog is open
    and the button is enabled; the key hint sits beside the button.
- **Empty state**
  - Text output: the output's placeholder is the empty state. It's
    required, and is phrased as an instruction ("Paste JSON to format
    it"), not a sample output. The source placeholder can show a sample
    input.
  - File Processor: before anything is uploaded, the upload area fills the
    work area, and the tile is a plain button (drag-and-drop works on the
    upload area).
  - `EmptyState` is only for lists and tables with no rows.
- **Modes (Codec)**
  - One trigger on the tile, and a toggle inside the dialog.
  - A mode toggle is offered only when every direction takes the same kind
    of input.
  - `/tools/<key>?mode=<mode>` opens straight into that mode.
- **Persistence**
  - Text input is saved per Tool (per mode for Codecs). Files are never
    saved.
  - **Reset** runs when the dialog closes, or when the tool page's close
    dot is used (there is no Reset button). It
    clears the input and keeps the controls.

## Checks

- `src/test/layout-guard.spec.ts` fails in three cases:
  - a migrated Tool doesn't render its shell
  - a migrated Tool builds its own dialog
  - an opt-out has no ADR
- `<Shell>.contract.dom.spec.tsx` runs the same UX checks over every
  migrated Tool of that layout, and `e2e/parity/layout-contract.spec.ts`
  runs them in a real browser. Each Tool can add a bad-input fixture to
  `e2e/parity/layout-fixtures.ts`, which both read, so the error path is
  checked too.
- A fixture is typed (`LayoutErrorFixture`): saved input seeded into
  `storage`, `steps` (click, select, type) run on the open dialog for
  Tools that save nothing, or `never: <reason>` when no input is invalid,
  reported as a `todo`.

## Migration

Tools tagged with a layout but not yet on its shell are listed in
`LAYOUT_MIGRATION_PENDING` (`src/test/layout-migration.ts`). To migrate a
Tool:

1. Rebuild it on its shell.
2. Delete its line from the pending list. The guard fails until you do.
3. Add an error fixture to `e2e/parity/layout-fixtures.ts`.
4. Reword its placeholder as an instruction.
5. Check it in a browser on the happy path and one error case.

Order: Codec → Transformer → Generator → File Processor. ADR-0027 lists the
Tools for each.
