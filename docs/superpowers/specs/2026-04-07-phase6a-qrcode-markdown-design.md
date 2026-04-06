# Phase 6a WASM Migration — csr-qrcode + csr-markdown

## Overview

Migrate QR code generation and Markdown conversion from npm dependencies to hand-written Rust compiled to WebAssembly. This is the first half of Phase 6; `csr-image` (C codec FFI) follows separately.

**Eliminates:** `qrcode` (60KB), `marked` (50KB), `turndown` (30KB), `turndown-plugin-gfm` (5KB) — **145KB total**

---

## Crate 1: `csr-qrcode`

### Rust Exports

```rust
#[wasm_bindgen]
pub fn generate_qr_png_data_url(data: &str, size: u32, fg: &str, bg: &str, ec: &str) -> Result<String, JsError>

#[wasm_bindgen]
pub fn generate_qr_svg_string(data: &str, size: u32, fg: &str, bg: &str, ec: &str) -> Result<String, JsError>
```

- `data`: text to encode (error on empty string)
- `size`: pixel width/height of output (e.g. 128, 256, 512)
- `fg`/`bg`: hex color strings (e.g. `#000000`, `#ffffff`)
- `ec`: error correction level — `"L"`, `"M"`, `"Q"`, or `"H"`

### Algorithm (all hand-written, no external Rust crates except `wasm-bindgen`)

**Data encoding:**
- Byte mode encoding (covers all UTF-8 input the tool accepts)
- Auto-select QR version 1-40 based on data length + EC level capacity

**Error correction:**
- Reed-Solomon over GF(256) with generator polynomials
- EC codeword generation per block, interleaving data + EC blocks

**Matrix construction:**
- Finder patterns (3 corners), alignment patterns (version-dependent)
- Timing patterns (row 6, col 6)
- Format information (EC level + mask, BCH encoded)
- Version information (versions 7+, BCH encoded)
- Data placement in upward/downward column pairs, skipping reserved areas

**Masking:**
- Evaluate all 8 mask patterns against penalty rules (adjacent, blocks, finders, balance)
- Select lowest-penalty mask

**PNG output (`generate_qr_png_data_url`):**
- Minimal PNG encoder: IHDR chunk, IDAT chunk (zlib/deflate), IEND chunk
- Scale QR modules to requested `size` (nearest-neighbor scaling)
- Apply fg/bg colors, 2-module quiet zone margin
- Return as `data:image/png;base64,<base64-encoded-png>`
- Use `flate2` crate for deflate compression (hand-writing deflate is not worth the effort)

**SVG output (`generate_qr_svg_string`):**
- Build SVG string with `<rect>` elements for dark modules
- Apply fg/bg as fill colors, viewBox scaled to `size`
- 2-module quiet zone margin

### Dependencies

- `wasm-bindgen` — JS bridge
- `flate2` — deflate compression for PNG IDAT chunk
- No other external crates

### Thread Strategy

Main thread. Typical inputs (<2000 chars) complete in <10ms.

---

## Crate 2: `csr-markdown`

### Rust Exports

```rust
#[wasm_bindgen]
pub fn markdown_to_html(md: &str) -> String

#[wasm_bindgen]
pub fn html_to_markdown(html: &str) -> String
```

### Markdown-to-HTML (CommonMark + GFM subset)

**Two-pass architecture:**

**Pass 1 — Block parsing:**
- ATX headings (`# ` through `###### `)
- Paragraphs (consecutive non-blank lines)
- Fenced code blocks (``` and ~~~, with optional language tag)
- Indented code blocks (4-space indent)
- Blockquotes (`> ` prefix, nestable)
- Ordered lists (`1. `) and unordered lists (`- `, `* `, `+ `)
- Thematic breaks (`---`, `***`, `___`)
- HTML blocks (passed through with sanitization)
- GFM tables (`| col | col |` with `| --- | --- |` separator)
- GFM task lists (`- [ ] ` / `- [x] `)

**Pass 2 — Inline parsing (within each block's text content):**
- Emphasis (`*italic*`, `_italic_`) and strong (`**bold**`, `__bold__`)
- Inline code (`` ` ``)
- Links (`[text](url)` and `[text](url "title")`)
- Images (`![alt](src)`)
- Autolinks (`<https://...>`)
- Hard line breaks (trailing `  ` or `\`)
- GFM strikethrough (`~~text~~`)

**HTML sanitization (built into emitter):**
- Strip: `<script>`, `<iframe>`, `<embed>`, `<object>`, `<form>`, `<base>`, `<meta>`, `<svg>`
- Strip: `on*` event handler attributes (including `/on*` variant)
- Neuter: `javascript:` and `data:` URIs in `href`/`src`/`action` attributes → `href="#"`

### HTML-to-Markdown (tag-to-syntax mapper)

**Simple recursive descent HTML parser:**
- Not a full HTML5 spec parser — handles well-formed HTML (matching open/close tags, self-closing tags, attributes)
- Sufficient for the converter's use case (users paste reasonably well-formed HTML)

**Tag mapping:**
- `<h1>`–`<h6>` → `#`–`######` (ATX headings)
- `<p>` → double newline separated text
- `<strong>`/`<b>` → `**text**`
- `<em>`/`<i>` → `_text_` (underscore style, matches existing test expectations)
- `<a href="url">` → `[text](url)`
- `<img src="url" alt="text">` → `![text](url)`
- `<code>` → `` `code` ``
- `<pre><code>` → fenced code block
- `<ul><li>` → `- item`
- `<ol><li>` → `1. item`
- `<blockquote>` → `> text`
- `<br>` → hard line break
- `<hr>` → `---`
- `<del>`/`<s>` → `~~text~~`
- `<table>` → GFM table syntax (`| col | col |` with separator row)
- `<input type="checkbox">` → `[ ]` / `[x]` (task lists)

### Dependencies

- `wasm-bindgen` — JS bridge
- No other external crates (all parsing hand-written)

### Thread Strategy

Main thread for typical inputs. TS wrapper routes to Web Worker when input exceeds 10,000 lines (consistent with design spec).

---

## TypeScript Integration

### `src/wasm/csr-qrcode.ts`

```typescript
import { loadWasm } from './init'

type CsrQrcode = {
  generate_qr_png_data_url: (data: string, size: number, fg: string, bg: string, ec: string) => string
  generate_qr_svg_string: (data: string, size: number, fg: string, bg: string, ec: string) => string
}

export const generateQrCodeDataUrl = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { size = 256, foreground = '#000000', background = '#ffffff', errorCorrectionLevel = 'M' } = options
  const wasm = await loadWasm<CsrQrcode>('csr-qrcode')
  return wasm.generate_qr_png_data_url(text, size, foreground, background, errorCorrectionLevel)
}

export const generateQrCodeSvgString = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { size = 256, foreground = '#000000', background = '#ffffff', errorCorrectionLevel = 'M' } = options
  const wasm = await loadWasm<CsrQrcode>('csr-qrcode')
  return wasm.generate_qr_svg_string(text, size, foreground, background, errorCorrectionLevel)
}
```

### `src/wasm/csr-markdown.ts`

```typescript
import { loadWasm } from './init'

type CsrMarkdown = {
  markdown_to_html: (md: string) => string
  html_to_markdown: (html: string) => string
}

export const renderMarkdown = async (md: string): Promise<string> => {
  if (md.trim().length === 0) return ''
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.markdown_to_html(md)
}

export const markdownToHtml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.markdown_to_html(input)
}

export const htmlToMarkdown = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.html_to_markdown(input)
}
```

### Migration in `src/utils/`

**`src/utils/qr-code.ts`** — Replace `import QRCode from 'qrcode'` with imports from `@/wasm/csr-qrcode`. Functions become thin re-exports.

**`src/utils/markdown.ts`** — Replace `import { marked } from 'marked'` with import from `@/wasm/csr-markdown`. Note: `renderMarkdown` changes from sync to async (callers already handle this via the component's async pattern).

**`src/utils/html-markdown.ts`** — Replace `turndown` + `marked` imports with imports from `@/wasm/csr-markdown`.

### Signature Change: `renderMarkdown`

Current `renderMarkdown` is synchronous. WASM loading requires it to become async. The component (`MarkdownPreview.tsx`) already calls it inside an async effect, so this is a non-breaking change at the component level. The spec test mocks will need a minor update to handle the async return.

---

## Util File Changes

### `src/utils/qr-code.ts` (after migration)

```typescript
import type { QrCodeOptions } from '@/types/utils/qr-code'
import { generateQrCodeDataUrl, generateQrCodeSvgString } from '@/wasm/csr-qrcode'

export { generateQrCodeDataUrl, generateQrCodeSvgString }
export type { QrErrorCorrectionLevel } from '@/types/utils/qr-code'
```

### `src/utils/markdown.ts` (after migration)

```typescript
import { renderMarkdown } from '@/wasm/csr-markdown'

export { renderMarkdown }
```

Note: `renderMarkdown` becomes `async (md: string) => Promise<string>`.

### `src/utils/html-markdown.ts` (after migration)

```typescript
import { htmlToMarkdown, markdownToHtml } from '@/wasm/csr-markdown'

export { htmlToMarkdown, markdownToHtml }
```

---

## Package Removals

Remove from `package.json`:
- `qrcode`
- `@types/qrcode`
- `marked`
- `turndown`
- `@types/turndown`
- `turndown-plugin-gfm`

---

## Testing Strategy

### Rust Unit Tests

**`csr-qrcode`:**
- QR encoding correctness (known data → known module matrix for small versions)
- Reed-Solomon encoding (known input → known EC codewords)
- PNG output starts with PNG magic bytes
- SVG output contains `<svg` and `</svg>`
- Empty input returns error
- All 4 EC levels produce different outputs for same data

**`csr-markdown`:**
- Block parsing: headings, paragraphs, code blocks, lists, blockquotes, tables, thematic breaks
- Inline parsing: emphasis, strong, code, links, images, strikethrough
- Sanitization: script/iframe/form stripped, event handlers stripped, javascript: URIs neutered
- HTML-to-markdown: round-trip verification for all supported tag types
- GFM: tables, task lists, strikethrough in both directions

### Existing Vitest Specs (unchanged)

- `src/utils/qr-code.spec.ts` — validates WASM produces correct PNG data URLs and SVG strings
- `src/utils/markdown.spec.ts` — validates `renderMarkdown` output (will need async adjustment)
- `src/utils/html-markdown.spec.ts` — validates bidirectional conversion

### Benchmarks

| Crate | Small Input | Large Input |
|---|---|---|
| `csr-qrcode` | 20 chars | 2,000 chars |
| `csr-markdown` | 100 lines | 10,000 lines |

---

## Expected Performance

| Crate | Expected Speedup | Why |
|---|---|---|
| `csr-qrcode` | 2-4x | Matrix math + Reed-Solomon in compiled code |
| `csr-markdown` | 2-5x | Block + inline parsing, no GC pressure |
