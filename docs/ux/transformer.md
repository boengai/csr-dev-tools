# Transformer

Turns input into output in one direction. The same input always gives the
same output, so it runs as you type. Formatters, decoders, parsers,
previews. Built from `TransformerShell`
(`src/components/common/transformer/`).

```
┌ JSON Formatter ──────────────────────────────────────────────── [×] ┐
│ Controls  Indent ▾   ☐ Sort keys                                      │
│ Status    ⚠ Invalid JSON: unexpected end of input                      │
├───────────────────────────────┬──────────────────────────────────────┤
│ JSON Input                    │ Formatted JSON                  [⧉]  │
│ {"name":"John"}               │ {                                    │
│                               │   "name": "John"                     │
│                               │ }                                    │
└───────────────────────────────┴──────────────────────────────────────┘
```

**Output kinds** (`outputKind`; `compute` returns the matching shape):
- `text` (default): a code block with Copy in its label.
- `fields`: a label/value list with Copy on each row. A row can drop its
  Copy (`copy: false`) when it is a count to read, not a value to paste
  (Word Counter), or copy something other than what it shows
  (`copyValue`: JWT's payload shows readable timestamps, copies the raw
  JSON). A value keeps its line breaks, so a row can hold a JSON block
  or a list (Cron's next runs). `copyAll` adds a Copy in the label for
  all rows at once (JSONPath's matches as one JSON array).
- `markup`: HTML or SVG, sanitised by the shell, with Copy in its label.
  Copy takes the sanitised markup — exactly what is shown.
- `image`: a preview with Download at the bottom of the output. When the
  image also has a text form (QR code's SVG, `imageCopyLabel`), Copy and
  Download both sit in the label, Download as an icon button.

There's no free-form output slot. Each kind's empty value shows the
placeholder, and an error clears the output whatever the kind.

```
┌ Text Case Converter ─────────────────────────────────────────── [×] ┐
├───────────────────────────────┬──────────────────────────────────────┤
│ Source                        │ Results                              │
│ hello world                   │ camelCase                       [⧉]  │
│                               │ helloWorld                           │
│                               │ snake_case                      [⧉]  │
│                               │ hello_world                          │
└───────────────────────────────┴──────────────────────────────────────┘
```

```
┌ Mermaid Renderer ────────────────────────────────────────────── [×] ┐
│ Controls  Examples [Flowchart] [Sequence] [Class] …                   │
│ Status    ⚠ No diagram type detected     [ Auto-fix: add the type ]   │
├───────────────────────────────┬──────────────────────────────────────┤
│ Mermaid Syntax                │ Preview                   [⧉] [⤓][⤓] │
│ A --> B                       │ Write Mermaid syntax, or pick an     │
│                               │ example, to see the diagram          │
└───────────────────────────────┴──────────────────────────────────────┘
```

**Extras** (each optional):
- `downloads`: files the output can be saved as (SVG, PNG), as icon
  buttons in the label beside Copy.
- `secondSource`: a second required input under the first (JSON Schema
  Validator's schema). Blank shows the placeholder; Reset clears it too.
- `errorAction`: one button beside the error that fixes the input
  (Mermaid's Auto-fix).
- `prefill`: a handoff from another Tool, applied once on open.
- `markupBackground="light"`: for SVG drawn in dark ink.

**Controls** sit above the status slot. Selects and toggles recompute at
once; a text box there (HMAC secret key, JSON → TypeScript root name,
JSONPath expression) is debounced like the source. A control may also
set the source: Load sample (JWT, JSONPath), Use my UA, Cron presets. A second required input that is still blank
(HMAC's key) leaves the placeholder showing, not an error.

**Saving:** the source and controls are saved per Tool. A Tool with a
secret in its input (HMAC) saves nothing, and its secret is cleared on
close along with the source. Tokens, certificates and keys (JWT,
Certificate, SSH) are not saved either.

**Notices:** a valid result can still warrant a word above the work
area: an expired certificate or JWT decodes fine, and the status slot
says it has expired.

## Journey

```mermaid
journey
  title Transform input
  section Open
    Click the tile: 5: User
    Dialog shows the placeholder telling you what to paste: 4: Shell
  section Transform
    Paste input: 5: User
    Output updates as you type (300 ms): 5: Shell
    Change a control: 4: User
    Output updates at once: 5: Shell
  section Bad input
    Input becomes invalid: 2: User
    Status slot shows why; output clears: 4: Shell
  section Leave
    Copy the output from its label: 5: User
    Closing (dialog or page) resets: input cleared, controls kept: 4: User
```

## Tools

- **On the shell:**
  - `text`: CSS, HTML, SQL, YAML and JSON formatters, JavaScript
    minifier, Hash, HMAC, JSON → TypeScript, Sort/Dedupe, JSON Schema
    Validator.
  - `fields`: Text Case, Word Counter, Timezone, Unix Timestamp, User Agent
    Parser, URL Parser, JWT Decoder, Certificate Decoder, SSH Fingerprint,
    JSONPath, Cron Parser.
  - `markup`: Markdown Preview, SVG Viewer, Mermaid.
  - `image`: QR Code, Base64 → Image.
- **Pending:** none — every Transformer is on the shell.
