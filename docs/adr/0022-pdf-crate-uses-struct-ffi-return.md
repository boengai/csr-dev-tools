# ADR 0022 — `pdf` crate uses a `#[wasm_bindgen]` struct return, not a JSON string

- **Status:** Accepted
- **Date:** 2026-05-22

## Context

[[ADR 0018]] records the established WASM facade convention: each
crate's `#[wasm_bindgen]` exports return plain strings (most often JSON),
and the JS-side facade does `JSON.parse`. `loadWasm<T>(name)` memoises
per module; each facade body is one or two lines. The 2026-05-19
[[Certificate decoder WASM]] migration adopted the convention explicitly,
calling out the cost of `serde-wasm-bindgen` as a one-off-pattern problem.

The new `pdf` crate compiles Markdown to a Typst Document and emits both
per-page SVG strings *and* a PDF byte buffer (often 50 KB – 2 MB). A
single compile produces both outputs cheaply once the Document exists;
JS-side consumers need access to both.

The two convention-compatible shapes were considered and rejected:

1. **JSON-string return** — pack `{ svgs: string[], pdf_b64: string }`
   into one JSON string. Forces base64 encoding of the PDF bytes
   (Rust-side allocation, JS-side decode), inflates the payload ~33 %
   on the wire, and adds two more allocations per compile.
2. **Two separate WASM exports** — `compile_to_svg(md)` returning a
   JSON array of SVG strings + `compile_to_pdf(md)` returning the PDF
   bytes (as base64 or as `Vec<u8>`). Forces Typst to compile the
   document twice for every user keystroke.

Both options trade real cost for *uniformity with ADR 0018*. The third
option — `#[wasm_bindgen]` struct return with getter methods — sidesteps
both costs at the price of a single-crate exception.

## Decision

The `pdf` crate diverges from ADR 0018 and returns a
`#[wasm_bindgen] pub struct CompileResult` with getter methods:

```rust
#[wasm_bindgen]
pub struct CompileResult { /* internal */ }

#[wasm_bindgen]
impl CompileResult {
    #[wasm_bindgen(getter)] pub fn page_count(&self) -> usize;
    pub fn page_svg(&self, index: usize) -> Option<String>;
    #[wasm_bindgen(getter)] pub fn pdf(&self) -> Vec<u8>;
}

#[wasm_bindgen]
pub fn compile_markdown(md: &str) -> Result<CompileResult, JsError>;
```

The JS-side worker (`src/workers/pdf.worker.ts`) iterates the SVG
getters once and posts a structured-clone-friendly DTO across the
worker boundary:

```ts
type CompileResultDto = { svgs: Array<string>; pdf: Uint8Array }
```

The reasoning:

- **PDF bytes are multi-megabyte binary.** Base64-encoding them into a
  JSON string inflates the wire by ~33 % per compile and forces two
  allocations on each side that don't exist with `Vec<u8>`.

- **Compile happens once; output formats are cheap.** Typst's
  `compile()` produces a `PagedDocument`; `typst_pdf::pdf(&doc, …)` and
  `typst_svg::svg(&page)` are post-compile emit steps. A two-export
  shape would force re-compile per keystroke, which Typst doesn't
  cache for us.

- **ADR 0018's reasoning targets *facade body shape*, not WASM ABI.**
  The point of 0018 is that adopting `serde-wasm-bindgen` for one tool
  doesn't pay for itself; the JSON-string convention keeps facades
  flat. A `#[wasm_bindgen]` struct return still produces a flat
  facade — the body is still `await loadWasm(...)` plus one dispatch
  line; the struct just exposes getters that the worker iterates once
  before posting a structured-clone object across the boundary.

- **The asymmetry is scoped.** This is the only crate that exports a
  non-string return value. Future crates that fit the ADR 0018 shape
  (text-in, text-out) keep that shape.

## Consequences

**Positive**

- Single Typst compile per user keystroke. Live preview stays under
  the 300 ms debounce budget at typical document sizes.
- No base64 round-trip; PDF byte buffer crosses the worker boundary
  via structured clone (one copy total).
- `compile_markdown` remains a single function, one round-trip from
  the worker.

**Negative**

- The `pdf` facade reads the WASM result via getters
  (`result.page_count`, `result.page_svg(i)`, `result.pdf`) instead of
  `JSON.parse`. A reader scanning the facade family sees one outlier.
- `Vec<u8>` return values clone the byte buffer once at the FFI
  boundary. Acceptable at expected sizes (≤ a few MB); revisit if
  a future tool returns much larger blobs.

## Revisit when

- A second crate exports binary blobs or struct returns. At that point
  the exception becomes a second pattern and warrants its own ADR
  category (or extraction of a shared helper).
- The `wasm-bindgen` story for transferable buffers improves enough
  that we can move the PDF bytes without the `Vec<u8>` clone.
- A future Typst version exposes an API that lets us emit SVG / PDF
  lazily on demand, at which point a `compile_handle` pattern with
  separate emit calls could land without double-compiling.
