# Generator

Options in, output out, with no source text. Built from `GeneratorShell`
(`src/components/common/generator/`). It has two run modes, set with the
`run` prop:

- **`random`**: the output is random. It runs when the dialog opens, when
  an option changes, and on **Generate** (⌘/Ctrl+Enter). Used by UUID,
  Password and RSA.
- **`live`**: the same options always give the same output, so it runs
  when the dialog opens and on every option change, with no button. Used
  by Lorem Ipsum, Color Palette, Crontab, Markdown Table and Placeholder
  Image.

```
┌ Password Generator ───────────────────────────────────────────── [×] ┐
│ Status  ⚠ Pick at least one character set   ← errors and notices only │
├───────────────────────────────┬──────────────────────────────────────┤
│ Length  ──●────── 16          │ Passwords (3)                   [⧉]  │
│ Count   ●──────── 3           │ 1. k7#Qv…                       [⧉]  │
│ [ABC] [abc] [123] [!@#]       │ 2. P0x!d…                       [⧉]  │
│ [ Generate ]             ⌘↵   │ 3. a9$Lm…                       [⧉]  │
└───────────────────────────────┴──────────────────────────────────────┘
```

```
┌ Placeholder Image Generator ──────────────────────────────────── [×] ┐
│ Status  ⚠ Maximum dimension is 4096x4096    ← errors and notices only │
├───────────────────────────────┬──────────────────────────────────────┤
│ Width [5000]  Height [600]    │ Preview                              │
│ [Preset sizes ▾]              │ ┌──────────────────────────────────┐ │
│ Background ■ [#cccccc]        │ │ Enter a width and height to …    │ │
│ Text       ■ [#666666]        │ └──────────────────────────────────┘ │
│ Custom Text [        ]        │ (Download PNG / SVG once valid)      │
└───────────────────────────────┴──────────────────────────────────────┘
```

- **The Tool draws the options** (`renderOptions`). It gets two setters:
  `setOptions` regenerates at once (toggles, selects, sliders), and
  `setOptionsDebounced` waits for a 300 ms pause, so typing in a text
  option doesn't reroll on every keystroke.
- **Generate** is the primary button, under the options. The shell draws
  it, and the Tool only passes the label. `live` has no button.
- **Slow on purpose** (`slow: true`, RSA keygen): while it runs, the
  button shows a spinner and the elapsed time and is disabled, and the
  previous output is hidden. There's no numbered progress (ADR-0001).
- **Rich options are fine.** A cell grid (Markdown Table), five field
  editors (Crontab) or colour pickers are still options. A Tool that keeps
  a reducer (ADR-0008, ADR-0013) dispatches into the shell's options bag:
  `setOptions(reducer(options, action))`.
- **Output** comes in six named kinds. There is no free-form slot.
  - `text`: one value, with Copy in its label (Lorem Ipsum).
  - `list`: one value per row. Copy all is in the label, and each row has
    its own Copy (UUID, Password).
  - `files`: named text blocks, each with Copy in its label. Download
    buttons sit at the bottom of the pane, plus Download all when there
    is more than one (RSA public and private key).
  - `fields`: label/value rows, Copy per row unless a row opts out
    (Crontab: the expression copies; description and next runs don't).
  - `image`: a preview with its Download buttons at the bottom of the
    pane, and no Copy. The file is built when its button is clicked, so
    a PNG's canvas never slows the preview (Placeholder Image: PNG, SVG).
  - `swatches`: colour swatches. Clicking one copies its value, and Copy
    all sits in the label (Color Palette: a hex per swatch, the palette
    as CSS custom properties for all).
- **Errors**: options the Tool rejects show in the status slot, and the
  output clears. That covers typed options too (a bad hex, a width over
  4096). Nothing toasts except Copy and Download.
- **No "Generated N" toasts.** You can see the new output, so a toast
  repeats it. Toasts are for the outcome of an action (copied,
  downloaded).
- **Persistence**: with `storageKey`, the options are saved. The output
  is never saved.
- **Closing the dialog** drops the output (an RSA private key doesn't
  linger) and keeps the options. Reopening generates again.

## Journey

```mermaid
journey
  title Generate output
  section Open
    Click the tile: 5: User
    First result is generated with the saved options: 4: Shell
  section Generate
    Change an option: 4: User
    New result: 5: Shell
    Press Generate or ⌘↵ for another (random): 5: User
  section Bad options
    Saved options are corrupt: 2: User
    Status slot shows why; output clears: 4: Shell
  section Leave
    Copy the output from its label: 5: User
    Close: output dropped, options kept: 4: User
```

## Tools

- **On the shell:**
  - random: UUID, Password, RSA Key (`slow`)
  - live: Lorem Ipsum and Markdown Table (`text`), Crontab (`fields`),
    Placeholder Image (`image`), Color Palette (`swatches`)
- **Pending:** none.
