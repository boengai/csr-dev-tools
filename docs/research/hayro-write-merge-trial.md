# Trial: can hayro-write merge PDFs in place of pdf-lib?

This is the trial for GitHub issue [#43](https://github.com/boengai/csr-dev-tools/issues/43), the second of the three trials in ADR-0033.
- **Date and repo state:** 2026-11-27. The runs and the app build used `main` at `db2915ef`, and this branch is cut from `develop` at `df964fef`. The branch is never merged.
- **Same code on both:** `src/utils/combine-pdf.ts`, `src/utils/image-to-pdf.ts`, `src/components/common/pdf/` and the pdf-lib 1.17.1 lock entries are identical on `main` and `develop`.
- **Agreed before any run:** the corpus and the pass bar were written into #43 first, and the user approved them.

## Answer

**Fail.** Each candidate fails at least one check, so pdf-lib stays behind its engine bridge. The bridge has the facade ADR-0033 already specifies, `merge([{bytes, pages}]) -> bytes`.

| Check | A: hayro-write 0.9.0 | B: lopdf 0.47.0 |
|---|---|---|
| Interactive content | **fail**: every annotation is dropped (links, widgets, markup) | pass, and better: explicit GoTo links now resolve |
| Output size, ≤1.10× in total and no merge above 1.5× | 0.80× in total, but **fail**: 2.11× on `edge-std14-rotate-crop` (4,616 vs 2,192 B) | pass: 0.82× in total, worst merge 1.00× |
| Bytes, ≤ pdf-lib's 160,340 B brotli | pass: **131,335** (0.82×) | **fail: 283,447 (1.77×)** |
| No trap | pass | **fails the bar's own line** ("Locked … inputs land in `skipped`"): a file with a user password loads without error, its pages are dropped silently, and it never reaches `skipped`. pdf-lib doesn't skip it either (it writes a blank page), so against `main` this is a different failure rather than a clearly worse one. The verdict rests on bytes. |
| Encrypted inputs | pass, and better: decrypts where pdf-lib writes blank pages | pass, and better: the same |
| `qpdf --check` | pass | pass |
| Page geometry: count, order, MediaBox, CropBox, Rotate | pass (M6: see below) | pass (M6: see below) |
| Page fidelity, rendered | not run | not run |

**Not run: the render check.** The plan was pdf.js in GPU Chrome at 0.6, page by page. Both candidates had already failed, and a render diff could not turn either result into a pass, so the user chose to skip it (2026-11-27, recorded in #43). Two structural checks stand in for it, though neither replaces it:
- Page geometry matched pdf-lib's on every page of M1–M5.
- In M6, pdf-lib has one extra page: the blank page it writes for the locked file. `analyze.mjs` compares page i with page i, so `runs/analysis.txt` shows M6 as misaligned. That includes a false `lost={"Widget":23}` for B, which in fact keeps all 23 fw9 widgets. Without that blank page, M6 has the same pages in the same order. This is better than `main`, and it is recorded as a behaviour change.
- pdf.js text extraction of page 1 is identical for both candidates on every encrypted merge.

**A finding about `main` (a bug, separate from the trial).** combine-pdf writes **blank pages** for any input encrypted with an empty user password. That covers ISO 32000, RC4-128, AES-128 and AES-256.
- **Cause:** `PDFDocument.load(…, { ignoreEncryption: true })` copies the encrypted streams unchanged into an unencrypted file.
- **What pdf.js sees:** every page of those outputs has an empty operator list.
- **What qpdf sees:** `qpdf --check` reports thousands of inflate errors.
- **Why users miss it:** the thumbnails look right, because pdf.js decrypts the source. Only the downloaded file is blank.
- **Locked files:** pdf-lib does not skip them either. The locked file in M6 becomes a blank page instead of appearing in `skipped`.

## Bytes

How each candidate was built:
- From [`harness/merge-trial`](hayro-write-merge-trial/harness/merge-trial/), one cargo feature per candidate.
- `wasm-bindgen` 0.2.130 and Rust 1.100.
- Release profile: `opt-level = "z"`, fat LTO, `codegen-units = 1`.
- `wasm-pack build --target web --release`, then `wasm-opt -Oz --strip-debug` (binaryen 133). This is the pipeline `wasm/scripts/build.sh` uses.

Sizes are brotli quality 11 (Node `zlib`). Data: [`runs/bytes.txt`](hayro-write-merge-trial/runs/bytes.txt).

| File | Raw | Gzip | Brotli |
|---|---:|---:|---:|
| **pdf-lib and its dependencies, as shipped** | 419,847 | | **160,340** |
| the whole shared chunk `es-*.js` (also holds dnd-kit and `SortablePdfShell`) | 470,638 | 191,566 | 175,135 |
| A: `merge_trial_bg.wasm` (hayro-write) | 323,767 | 152,472 | 129,118 |
| A: `merge_trial.js` glue | 8,978 | 2,475 | 2,217 |
| B: `merge_trial_bg.wasm` (lopdf) | 789,104 | 361,081 | 281,097 |
| B: `merge_trial.js` glue | 9,528 | 2,635 | 2,350 |

**How pdf-lib's share was measured:**
- pdf-lib has no chunk of its own. Vite places it in a chunk shared by combine-pdf and image-to-pdf.
- The app was rebuilt with `--sourcemap`, which produced the same chunk file name and hash. That build's chunk is 40 bytes longer, at 470,678 raw and 175,188 brotli, only because of the `sourceMappingURL` comment.
- [`harness/attrib-chunk.cjs`](hayro-write-merge-trial/harness/attrib-chunk.cjs) assigned each byte to its source module through the sourcemap.
- It counted these modules: `pdf-lib` 217,207, `@pdf-lib/standard-fonts` 130,013, `pako` 45,451, `@pdf-lib/upng` 24,704 and `tslib` 2,403.
- Those bytes were then compressed together with brotli.
- **Why not a separate bundle:** a lib build of `export { PDFDocument } from 'pdf-lib'` came out larger, at 505,126 raw and 165,771 brotli, so it was not used.

**Where lopdf's bytes go.** Measured with `twiggy` on the build before `wasm-opt`:
- **The read-only data segment** is 331,451 B, against 61,511 B for hayro-write. Its contents were not attributed.
- **Code:** lopdf 127,801 B, `brotli_decompressor` 37,141 B, `miniz_oxide` 28,087 B, `sha2` 22,127 B, `aes` 16,339 B, `weezl` 16,453 B, `nom` 11,353 B.
- **Dependencies that can't be turned off:** with `default-features = false`, lopdf still depends on `encoding_rs`, `nom`, `aes`/`cbc`/`ecb`, `md-5`, `sha2`, `rand`, `brotli-decompressor`, `weezl` and `stringprep`. The whole decryption stack is among them, and pdf-lib has none of it.

## What each candidate does to a page

**A, hayro-write 0.9.0.** The source was read before the run, and the run confirmed it.
- `write_page` rebuilds each page from MediaBox, CropBox, Rotate, `/Group`, the content stream and `/Resources`, and nothing else. `/Annots` is never written, and 0.3.0, the version in our tree through Typst, behaves the same.
- **Content streams** are re-deflated, and the dependencies are copied through `hayro-syntax`, which decrypts them.
- **Several sources:** each `extract` call writes its own page-tree parent. So the harness makes one intermediate `/Pages` node for each run of consecutive pages from one source.
  - A source used in two runs has its fonts and images written twice. M2 has this case.
- **Output format:** pdf-writer writes a classic xref table with no object streams. That is why the small files grow, for example 2.11× on `edge-std14-rotate-crop`.

**B, lopdf 0.47.0.** This is the trial's own merge, in [`src/lib.rs`](hayro-write-merge-trial/harness/merge-trial/src/lib.rs).
- **Loading:** each source loads once, and its objects are renumbered into the output.
- **Inheritance:** MediaBox, CropBox, Rotate and Resources are pushed down onto each page.
- **What's dropped:** the old catalog and its page-tree nodes.
- **Unselected pages** become `null`, so nothing drags them in through `/Parent` or a link.
- **Saving:** with object streams (`save_modern`), as pdf-lib does.
- **What changes:** an explicit GoTo link to a page that is also in the output now resolves. pdf-lib leaves it pointing at a copied, orphaned page.
- **Locked files:** lopdf loads a file with a user password without error. `get_pages` then finds no pages, so its pages vanish without the file landing in `skipped`.
  - The wrapper could detect this case: an `/Encrypt` in the trailer that didn't decrypt. Bytes still fail, though.

**What pdf-lib keeps (the baseline):**
- **Kept:** every page annotation.
- **Dropped:** the whole catalog, meaning `/AcroForm`, `/Outlines`, `/Names` and `/Dests`.
- **Effect on GoTo links:**
  - Named GoTo links, as hyperref and the ISO spec write them, can't resolve in its output.
  - Explicit GoTo links point at orphaned copies of their target pages.
  - None of the 4,000+ GoTo links in the corpus works after a pdf-lib merge.
- **Effect on forms:** widgets keep their appearance, but the fields lose their `/AcroForm`.

## Results

Run in Node 24.13.1, one fresh wasm instance per candidate call, by [`harness/run-merges.mjs`](hayro-write-merge-trial/harness/run-merges.mjs). Structure from [`harness/analyze.mjs`](hayro-write-merge-trial/harness/analyze.mjs), using qpdf 12.4.2 JSON.

Data:
- [`runs/summary.json`](hayro-write-merge-trial/runs/summary.json): time, bytes, pages, skipped and wasm memory.
- [`runs/analysis.txt`](hayro-write-merge-trial/runs/analysis.txt) and [`runs/analysis.json`](hayro-write-merge-trial/runs/analysis.json): structure.
- [`runs/text-check.txt`](hayro-write-merge-trial/runs/text-check.txt): pdf.js text and operator counts.

Output size (bytes) and annotations kept, against pdf-lib:

| Merge | Pages | pdf-lib | A: hayro-write | B: lopdf | Annotations in pdf-lib's output | A keeps | B keeps |
|---|---:|---:|---:|---:|---|---|---|
| M1 arxiv | 15 | 2,850,662 | 1,915,781 | 1,778,603 | 18 URI, 95 named GoTo | 0 | all |
| M1 fw9 | 6 | 126,238 | 55,455 | 56,294 | 23 Widget | 0 | all |
| M1 f1040 | 2 | 223,885 | 56,261 | 111,649 | 199 Widget | 0 | all |
| M1 markup | 2 | 3,217 | 1,280 | 1,804 | Text, Highlight, FreeText, URI, 2 explicit GoTo (dangling) | 0 | all (GoTo now resolves) |
| M1 enc RC4 / AES-128 / AES-256 | 15 each | ~2.85–2.93 M, **blank pages** | 1,976,235 | 1,759,4xx | 18 URI, 95 named GoTo | 0 | all |
| M1 edge std14/rotate/crop | 3 | 2,192 | **4,616 (2.11×)** | 2,076 | none | | |
| M1 inherited attrs | 3 | 1,118 | 1,646 (1.47×) | 917 | none | | |
| M1 markdown-to-pdf / image-to-pdf / grid / combine-pdf | 1 / 3 / 1 / 4 | 25,385 / 337,747 / 351,776 / 437,618 | 1.00–1.12× | 0.99–1.00× | 1 URI; combine-pdf: 23 Widget, 3 named GoTo | 0 | all |
| M1 NACA scan | 40 | 31,854,385 | 30,770,254 | 31,828,651 | none | | |
| M1 IA scan (JBIG2, JPX) | 568 | 25,146,977 | 25,323,383 | 25,116,804 | none | | |
| M2 interleaved | 5 | 429,967 | 355,530 | 367,607 | 94 Widget, 7 links, 3 markup | 0 | all |
| M3 arxiv reversed subset | 5 | 843,235 | 628,839 | 586,581 | 4 URI, 22 named GoTo | 0 | all |
| M3 markup reversed (added: both GoTo directions between selected pages) | 2 | 3,223 | 1,280 | 1,805 | as M1 markup | 0 | all (GoTo now resolves) |
| M4 ISO 32000, all | 756 | 17,187,155, **blank pages** | 4,829,942 | 6,802,694 | 51 URI, 3,915 named GoTo | 0 | all |
| M5 encrypted mix | 24 | 3,692,078, **blank pages** | 2,575,201 | 2,336,816 | 21 URI, 210 named GoTo | 0 | all |
| **Total M1–M5** | | 92,224,745 | 73,614,454 (0.80×) | 75,421,257 (0.82×) | | | |

**Size without encrypted inputs.** pdf-lib's outputs from encrypted inputs are blank but not small. Without them, the totals are 0.96× for A and 0.97× for B.

**M6 (failure inputs mixed with good ones).** M6 mixes a locked file, a truncated file, a non-PDF, page 99 of a 15-page file and two good pages.
- **pdf-lib:** it outputs 3 pages. The locked file becomes a blank page, and `skipped` holds the truncated and non-PDF files.
- **A:** it outputs 2 pages, and `skipped` holds all three bad files.
- **B:** it outputs 2 pages, and `skipped` holds only the truncated and non-PDF files.
- **All three:** page 99 is ignored, and nothing trapped.

**Reading `runs/analysis.txt`:** in M1 markup and M3 markup, B shows `lost={"Link-GoTo-explicit-dangling":2}`. Those two links weren't lost: they now resolve, and they are counted as `Link-GoTo-explicit-ok`.

**No timeout, OOM or trap (pass for both, apart from B's locked-file case above):**
- **Speed:** no candidate merge took over 1.6 s. The slowest was lopdf on M5, at 1,582 ms. pdf-lib took 3,125 ms on M4.
- **Memory:** peak wasm memory was 195 MiB for A (on the NACA scan) and 228 MiB for B (on M5), both well under 1 GiB.
- **Timing caveat:** times come from one run on a shared machine, with a load average of 2–5. They are recorded for the 10 s ceiling only, and are not a speed comparison.

## Corpus

The corpus is not committed:
- **#42's files** are reused as they are. They are pinned by sha256 in [`docs/research/hayro-render-trial.md`](https://github.com/boengai/csr-dev-tools/blob/research/hayro-render-trial/docs/research/hayro-render-trial.md#corpus) on `research/hayro-render-trial`, and every hash was re-checked before the run.
- **Two files are new,** made by [`harness/make-extra-corpus.mjs`](hayro-write-merge-trial/harness/make-extra-corpus.mjs). The script is deterministic.

| #43 item | File | sha256 |
|---|---|---|
| 3 | `markup-annots.pdf`: 2 pages. Page 1 has a Text note, a Highlight and a FreeText, each with `/AP`, plus a URI link and an explicit GoTo. Page 2 has a GoTo back. | `21de06499d8384cab5a1b6d50b9a31156180e7f9c1a14979167ab9646d0b766b` |
| 5 | `inherited-attrs.pdf`: 3 pages under a nested page tree. MediaBox, Resources and Rotate are set only on `/Pages` nodes, and page 3 overrides MediaBox. | `bdf3ee087a8dbc9525692b15c92b55280e7152e683fc347081860cf17e233762` |

The real-world files contain the following:
- **`arxiv-attention.pdf`:** 113 links (18 URI and 95 named GoTo), plus `/Outlines` and `/Dests`.
- **`iso32000.pdf`:** 3,966 links and `/Outlines`.
- **`irs-fw9.pdf`:** 23 widgets.
- **`irs-f1040.pdf`:** 199 widgets.

**Deviations from the corpus in #43:**
- **CJK files not used:** #42's CJK files were left out, because #43's corpus doesn't list them.
- **ISO 32000 not in M1:** it appears only in M4, which is "M1 on ISO 32000", and in M5.

## How to reproduce

```sh
C=<corpusDir>   # #42's files (pinned by sha256), plus:
node docs/research/hayro-write-merge-trial/harness/make-extra-corpus.mjs $C
H=docs/research/hayro-write-merge-trial/harness
for f in hw lo; do
  wasm-pack build $H/merge-trial --target web --release --out-dir <pkg-$f> --no-typescript -- --features $f
  wasm-opt -Oz --strip-debug <pkg-$f>/merge_trial_bg.wasm -o <pkg-$f>/merge_trial_bg.wasm
done
node --max-old-space-size=8192 $H/run-merges.mjs $C <out> <pkg-hw> <pkg-lo>
node $H/analyze.mjs <out>                       # needs qpdf
node $H/text-check.mjs node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/legacy/build/pdf.mjs <out>/*/M5-encrypted.pdf
pnpm exec vite build --sourcemap --outDir <dist-sm>
node $H/attrib-chunk.cjs <dist-sm>/assets/es-*.js <dist-sm>/assets/es-*.js.map node_modules/.pnpm/source-map-js@*/node_modules/source-map-js
```

## Revisit when

- **For hayro-write:**
  - A release copies `/Annots`, with each annotation's `/P` and `/Parent` rewritten.
  - Its output fits the size bar on small files, for example by using object streams.
  - The trial would then need the render check to run.
- **For lopdf:**
  - Encoding and decryption become optional features, and its brotli size drops to 160,340 or below.
  - It returns `Err` for a file it cannot decrypt.
- **For the bridge:**
  - pdf-lib leaves only when combine-pdf's merge moves to Rust.
  - Its bytes would also count against image-to-pdf until that tool's pdf-lib half is replaced (krilla, "replace" in issue 9).
