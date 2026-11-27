# Can hayro render PDFs in place of pdf.js?

Trial for GitHub issue [#42](https://github.com/boengai/csr-dev-tools/issues/42), the first of the three trials in ADR-0033. Date: 2026-11-27. Repo state: `develop` at `bc2e3879`. React's PDF code (`src/utils/image-to-pdf.ts`, `src/utils/combine-pdf.ts`, `src/components/common/pdf/`, `wasm/crates/pdf`) is identical on `main` and `develop`. The corpus and pass bar were written into #42 before any run, and the user approved them.

## Answer

**Fail.** The bar needed all five checks to pass, and the bytes check fails by a wide margin.

| Build | Brotli bytes | Against pdf.js (417,068) |
|---|---:|---:|
| hayro 0.9.0, `embed-fonts` + `embed-cmaps`, the judged build | **1,358,095** | **3.26×** |
| the same, with `+simd128` (the hayro demo's SIMD variant) | 1,248,979 | 2.99× |
| hayro 0.9.0, no embeds | 833,817 | 2.00× |

Even the reading most favourable to hayro fails:
- Compare hayro's build without embeds (833,817) against pdf.js plus its two optional wasm decoders, `jbig2.wasm` and `openjpeg.wasm`, which `main` never ships.
- That pdf.js total is 517,422, still 1.61× smaller.

So pdf.js stays behind its engine bridge, with the facade ADR-0033 already specified. Read "If it fails" in #42 together with the facade finding below.

What the trial did:
- The bytes check, which decided the result.
- The "no timeout, OOM or trap" check, which needs no pdf.js baseline. It ran in Node, not a browser, over all 19 corpus files at scale 0.6 (see [No timeout, OOM or trap](#no-timeout-oom-or-trap)).

**Not run:** visual parity, render time and main-thread blocking. They need GPU Chrome, a Firefox noise floor and alternating sessions, and none of them could change a fail. The user chose to skip them once the bytes result was in (recorded in #42).

## Bytes

How each build was made:
- From [`harness/hayro-trial`](hayro-render-trial/harness/hayro-trial/), with hayro `=0.9.0`, `wasm-bindgen` 0.2.130 and Rust 1.100.
- Release profile: `opt-level = "z"`, fat LTO, `codegen-units = 1`.
- `wasm-pack build --target web --release`, then `wasm-opt -Oz --strip-debug` (binaryen 133). This is the same pipeline as `wasm/scripts/build.sh`.

Sizes are brotli quality 11 (Node `zlib`). Gzip -9 is shown for reference.

| File | Raw | Gzip | Brotli |
|---|---:|---:|---:|
| `pdf.min.mjs` (pdfjs-dist 6.4.299) | 458,904 | 132,108 | 109,477 |
| `pdf.worker.min.mjs` | 1,264,342 | 375,659 | 307,591 |
| **pdf.js as shipped on `main`** | 1,723,246 | 507,767 | **417,068** |
| `jbig2.wasm` (not shipped today) | 103,671 | | 32,806 |
| `openjpeg.wasm` (not shipped today) | 251,131 | | 67,548 |
| hayro, embeds on: `hayro_trial_bg.wasm` | 4,128,806 | 1,714,904 | 1,356,061 |
| hayro, embeds on: `hayro_trial.js` glue | 7,779 | 2,305 | 2,034 |
| hayro, embeds on, `+simd128` (wasm only) | 3,113,633 | | 1,246,945 |
| hayro, no embeds (wasm only) | 3,420,990 | 1,147,495 | 831,783 |

Where hayro's bytes go: the embed build before `wasm-opt` (5,080,120 bytes with the name section), rolled up per crate by `twiggy`.

| Part | Bytes | Share |
|---|---:|---:|
| Data segments: the standard-14 fonts, predefined CMaps and tables | 1,188,731 | 23.4% |
| `fearless_simd`: the scalar `Fallback` level, monomorphised per caller | 830,757 | 16.4% |
| Name section (removed by `wasm-opt`) | 597,034 | 11.8% |
| `vello_cpu` | 364,706 | 7.2% |
| `core` | 237,063 | 4.7% |
| `hayro_syntax` | 231,472 | 4.6% |
| `read_fonts` + `skrifa` (font parsing, hinting) | 343,727 | 6.8% |
| `hayro_jbig2` + `hayro_jpeg2000` + `zune_jpeg` | 402,789 | 7.9% |
| `hayro_interpret` | 154,812 | 3.0% |
| `moxcms` (ICC colour) | 112,754 | 2.2% |
| everything else | 616,275 | 12.1% |

Three things stand out:
- **The embeds cost 524,278 bytes brotli.** That is the difference between the two builds, and more than all of pdf.js.
  - pdf.js on `main` gets the same coverage nowhere. It is called without `standardFontDataUrl` or `cMapUrl`, so non-embedded standard fonts fall back to system fonts, and predefined CMaps don't load.
  - Turning the embeds off would make hayro worse than pdf.js on exactly those files, which "no worse than" forbids.
- **`fearless_simd` is linked twice.** hayro 0.9.0 and its JBIG2 and JPEG 2000 decoders use 1.3.0, while `vello_cpu` 0.3.0 (pinned by hayro 0.9.0) uses 0.7.0 (`cargo tree -d`). `vello_cpu` 0.4.0 was released on 2026-11-11.
- **Even its own decoders don't win.** Without embeds, hayro is still 2× the size of pdf.js, which also carries its own JBIG2 and JPEG 2000 decoders.

**Typst's copy doesn't offset this.** `wasm/crates/pdf` already resolves hayro 0.4.0 through `typst-svg`, but that is a different version in a different wasm module. Under ADR-0033 and ADR-0035, the Typst compile runs as its own Rust worker package, so a renderer on the tool's page shares no code with it.

## No timeout, OOM or trap

[`harness/no-trap.mjs`](hayro-render-trial/harness/no-trap.mjs) runs the judged embed build in Node 24.13.1:
- a fresh wasm instance for each file;
- every page rendered at scale 0.6.

A page fails if it takes over 10 s, the file fails if its linear memory ends over 1 GiB, and any `WebAssembly.RuntimeError` counts as a trap. The raw output is [`runs/no-trap-0.6.json`](hayro-render-trial/runs/no-trap-0.6.json).

| File | Opens | Pages rendered | Slowest page | Whole file | Linear memory | Trap |
|---|---|---:|---:|---:|---:|---|
| `arxiv-attention.pdf` | ok | 15/15 | 9,151 ms | 16,064 ms | 39 MiB | none |
| `cjk-kokugakuin-embedded.pdf` | ok | 37/37 | 1,240 ms | 7,015 ms | 31 MiB | none |
| `cjk-nonembedded-predefined-cmaps.pdf` | ok | 1/1 | 23 ms | 24 ms | 10 MiB | none |
| `edge-std14-rotate-crop.pdf` | ok | 3/3 | 50 ms | 96 ms | 5 MiB | none |
| `enc-aes-128-empty.pdf` | ok | 15/15 | 6,969 ms | 15,252 ms | 39 MiB | none |
| `enc-aes-256-empty.pdf` | ok | 15/15 | 3,323 ms | 8,343 ms | 39 MiB | none |
| `enc-rc4-128-empty.pdf` | ok | 15/15 | 4,292 ms | 8,478 ms | 39 MiB | none |
| `fail-locked-aes-256.pdf` | `Err`: decryption: PasswordProtected | 0/0 |  | 63 ms |  | none |
| `fail-not-a-pdf.pdf` | `Err`: invalid PDF | 0/0 |  | 1 ms |  | none |
| `fail-truncated.pdf` | `Err`: invalid PDF | 0/0 |  | 52 ms |  | none |
| `ia-origin-scan.pdf` | ok | 568/568 | 985 ms | 91,320 ms | 60 MiB | none |
| `irs-f1040.pdf` | ok | 2/2 | 257 ms | 441 ms | 8 MiB | none |
| `irs-fw9.pdf` | ok | 6/6 | 279 ms | 1,092 ms | 8 MiB | none |
| `iso32000.pdf` | ok | 756/756 | 311 ms | 40,859 ms | 57 MiB | none |
| `naca-scan.pdf` | ok | 40/40 | 310 ms | 8,113 ms | 90 MiB | none |
| `tool-combine-pdf.pdf` | ok | 4/4 | 96 ms | 229 ms | 36 MiB | none |
| `tool-image-to-pdf-grid.pdf` | ok | 1/1 | 44 ms | 45 ms | 8 MiB | none |
| `tool-image-to-pdf.pdf` | ok | 3/3 | 45 ms | 98 ms | 8 MiB | none |
| `tool-markdown-to-pdf.pdf` | ok | 1/1 | 12 ms | 12 ms | 4 MiB | none |

**Result: pass.**
- No file trapped, and no page went over 10 s.
- The largest linear memory was 90 MiB, on the NACA scan.
- The 756-page file and the 568-page JBIG2/JPX scan completed.
- Empty-password decryption works at R3 (the real ISO 32000 file and the RC4 variant), R4 (AES-128) and R6 (AES-256), whatever hayro's README says.
- The locked, truncated and non-PDF inputs return `Err` rather than trapping.

Limits of this result:
- **The margin on page time is thin.** The machine was shared with other sessions (load average about 18), so all times here are inflated, and they are not a render-time result.
  - Pages 13–15 of the arXiv paper are the attention-visualisation figures, which are vector-heavy. A separate re-run, with the JIT warm, timed them at 1.2–6.5 s each at 0.6.
  - The same paper took 3.3–9.2 s on its slowest page across the four encrypted and plain copies.
  - On a quiet machine these would be lower, but they were not measured against pdf.js.
- **"Rendered" means only that a pixmap of the right size came back.** Whether the pixels are right is the visual-parity axis, which was not run.
- **hayro rejects the truncated file entirely** (`invalid PDF`). How pdf.js handles it, for example by showing the first pages, was not checked.

## The facade

ADR-0033 specified the pdf.js facade as `page_count(bytes)` and `render_page(bytes, index, scale)`, which is stateless. The trial crate instead holds an opaque document handle: `Doc::new(bytes)`, then `page_count()` and `render_page(index, scale)`. It also keeps one `RenderCache` per document, through `self_cell`.

That is the shape pdf.js has too (`getDocument` and then `getPage`). The stateless form would re-parse the cross-reference table of a 22 MB, 756-page file for every page, and lose the font and glyph caches between pages.

This doesn't change the verdict, since pdf.js stays. But the bridge facade for pdf.js should take a handle (`open(bytes) -> Doc`, `page_count`, `render_page(index, scale)`, `close`). That way a later hayro win can still swap the implementation without touching tool code.

## Corpus

The corpus files are not committed. Downloaded files are pinned by sha256. Generated files are made by [`harness/make-corpus.mjs`](hayro-render-trial/harness/make-corpus.mjs), and their hashes change on every run, because pdf-lib stamps dates and qpdf draws fresh IDs and keys.

| # | File | Pages | Bytes | Source | sha256 |
|---|---|---:|---:|---|---|
| 1 | `naca-scan.pdf` | 40 | 31,869,028 | NASA NTRS [19930091906](https://ntrs.nasa.gov/api/citations/19930091906/downloads/19930091906.pdf), JPEG scans with a 436-byte MacBinary prefix before `%PDF-` | `125be2f8a3f67e2d946628e2016aaac518a791af87dfd8d090c36893fa18c351` |
| 1 | `ia-origin-scan.pdf` | 568 | 25,372,662 | Internet Archive [originofspecies00darwuoft](https://archive.org/download/originofspecies00darwuoft/originofspecies00darwuoft.pdf), JBIG2 + JPX | `6f04f39b2a590a7864c4e9d24fa17da24dea26f4e0a8b8cbc70fc11484c2aa3c` |
| 2 | `arxiv-attention.pdf` | 15 | 2,215,244 | [arXiv 1706.03762v7](https://arxiv.org/pdf/1706.03762v7), Type 1 and math fonts | `bdfaa68d8984f0dc02beaca527b76f207d99b666d31d1da728ee0728182df697` |
| 3 | `irs-fw9.pdf` | 6 | 140,815 | [IRS fw9.pdf](https://www.irs.gov/pub/irs-pdf/fw9.pdf), AcroForm | `2d420cbb4123dcf1fb82595b2359cfbb5d81f00b9df9d359fcc7af361d093f53` |
| 3 | `irs-f1040.pdf` | 2 | 220,237 | [IRS f1040.pdf](https://www.irs.gov/pub/irs-pdf/f1040.pdf), AcroForm | `3d31c226df0d189ced80e039d01cf0f8820c1019681a0f0ca6264de277b7e982` |
| 4, 5 | `iso32000.pdf` | 756 | 22,491,828 | [Adobe PDF32000_2008.pdf](https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf). Real-world RC4-128 (R3) with an empty user password, and non-embedded TrueType fonts | `9de0ca9e8570d6209e8bd48a355be8eb6ec376acfc3fc3ae97cd8730351417ff` |
| 4 | `enc-rc4-128-empty.pdf`, `enc-aes-128-empty.pdf`, `enc-aes-256-empty.pdf` | 15 each | | file 2 through qpdf 12.4.2 (R3, R4, R6), empty user password | generated |
| 6 | `cjk-kokugakuin-embedded.pdf` | 37 | 9,429,246 | [kokugakuin.ac.jp](https://www.kokugakuin.ac.jp/assets/uploads/2022/03/59559b225ee19507a25dc5cf7a5af29f.pdf), embedded MS Mincho/Gothic, Identity-H | `df51a35c487d18eb1ad8bfc6ec30e411366fc9129aff80843f1201ca4f742cfc` |
| 6 | `cjk-nonembedded-predefined-cmaps.pdf` | 1 | 3,574 | hand-written: non-embedded KozMinPr6N, STSong, MSung, HYSMyeongJo and Ryumin with UniJIS/UniGB/UniCNS/UniKS-UCS2-H and 90ms-RKSJ-H | generated |
| 7 | `tool-markdown-to-pdf.pdf` | 1 | | `compile_markdown` from `wasm/crates/pdf` (Typst 0.14.2) | generated |
| 7 | `tool-image-to-pdf.pdf`, `tool-image-to-pdf-grid.pdf` | 3, 1 | | `imagesToPdf` from `src/utils/image-to-pdf.ts`: a JPEG (Apollo 8 *Earthrise*, Wikimedia, sha256 `da22ac0b…333e0`), a PNG with alpha, and a page rotated 90° | generated |
| 7 | `tool-combine-pdf.pdf` | 4 | | `combinePdfPages` from `src/utils/combine-pdf.ts` over files 2, 3 and 7 | generated |
| 8 | `edge-std14-rotate-crop.pdf` | 3 | | pdf-lib: all 14 standard fonts unembedded, `/Rotate 90`, a CropBox | generated |
| 9 | `fail-locked-aes-256.pdf`, `fail-truncated.pdf`, `fail-not-a-pdf.pdf` | | | user password `secret`; the first half of file 2; the JPEG | generated |

**Deviations from the corpus in #42:**
- **No government CJK file.** Every Japanese PDF checked embedded its fonts. These were the kokugakuin.ac.jp and nihon-u.ac.jp files, moji.or.jp, and two from soumu.go.jp and mhlw.go.jp; the mhlw.go.jp one returned HTML.
  - Item 6 is therefore one real university file with embedded fonts, plus a hand-written file for the non-embedded, predefined-CMap case.
- **The NACA scan is not a clean PDF.** It carries a 436-byte prefix before `%PDF-`. It was kept as a real-world robustness case.
- **A second scan was added:** the Internet Archive file, so that JBIG2 and JPX are both covered.

## How to reproduce

```sh
brew install qpdf
bash wasm/scripts/build.sh --dev pdf
node docs/research/hayro-render-trial/harness/make-corpus.mjs <corpus> <photo.jpg>   # after downloading the pinned files into <corpus>
CARGO_TARGET_DIR=<tmp> wasm-pack build docs/research/hayro-render-trial/harness/hayro-trial \
  --target web --release --out-dir <pkg> --out-name hayro_trial
wasm-opt -Oz --strip-debug <pkg>/hayro_trial_bg.wasm -o <pkg>/hayro_trial_bg.wasm
node docs/research/hayro-render-trial/harness/no-trap.mjs <pkg> <corpus> <out.json> 0.6
```

Add `-- --no-default-features` to the `wasm-pack` line for the build without embeds. For the SIMD build, set `RUSTFLAGS="-C target-feature=+simd128"` and pass `--enable-simd` to `wasm-opt`.

## Revisit when

A hayro release (with its embeds, or a way to fetch them lazily) comes within 417,068 bytes brotli of pdf.js. Concretely, that means one or more of:
- A single `fearless_simd` version.
- The scalar fallback no longer monomorphised per caller.
- Standard fonts and CMaps loaded on demand from asset URLs, as pdf.js does, rather than compiled in.

The trial's bar would then need its three unmeasured axes run before it could pass.
