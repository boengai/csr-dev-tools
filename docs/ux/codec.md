# Codec

Converts input to output in one of several directions: encode/decode,
JSON ↔ YAML, `.env` ↔ JSON. Built from `CodecShell`
(`src/components/common/codec/`).

It's a Codec only if **every direction takes the same kind of input**. If
one direction takes a file and the other takes text, make two Tools (e.g.
Image → Base64 and Base64 → Image).

```
Tile:   description                      [ JSON → YAML ]   ← one trigger, the active mode

┌ JSON → YAML ─────────────────────────────────────────────────── [×] ┐
│ Mode  [ JSON → YAML ]( YAML → JSON )                                  │
│ Controls (per mode, optional — e.g. ☐ Double escape)                  │
│ Status  ⚠ Invalid JSON: unexpected token at 1:2                        │
├───────────────────────────────┬──────────────────────────────────────┤
│ JSON Input                    │ YAML Output                     [⧉]  │
│ { "name": "John" }            │ name: John                           │
└───────────────────────────────┴──────────────────────────────────────┘
```

## Journey

```mermaid
journey
  title Convert in a Codec
  section Open
    Click the tile, or open /tools/<key>?mode=<mode>: 5: User
    Dialog opens in the saved (or linked) mode: 4: Shell
  section Convert
    Type or paste input: 5: User
    Output updates as you type (300 ms): 5: Shell
  section Bad input
    Input becomes invalid: 2: User
    Status slot shows why; output clears: 4: Shell
  section Switch direction
    Toggle the mode: 5: User
    That mode's last input comes back: 5: Shell
  section Leave
    Copy the output from its label: 5: User
    Closing (dialog or page) resets: input cleared, mode kept: 4: User
```

## Tools

- **On the shell:**
  - Base64, URL Encoder, HTML ↔ Markdown
  - JSON ↔ CSV / YAML / TOML / XML
  - Env File, Escaped JSON, HTML Entity
  - String Escape, AES (source not persisted)
- **Not Codecs** (ADR-0027 → Fit check): Bcrypt and Protobuf Codec are
  `custom`; Number Base, Color and px ↔ rem are `custom` (ADR-0019,
  N-mirror); Unix Timestamp and Timezone are Transformers.
