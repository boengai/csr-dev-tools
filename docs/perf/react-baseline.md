# React baseline

What the React site measures today, for [Record today's performance baseline](https://github.com/boengai/csr-dev-tools/issues/14). The method and how to repeat it are in [README.md](README.md).

## What was measured

- **Site**: `main` at `c3983f810d06d799be591180d30ae1b013b8d977`, from a clean clone. `develop` had the identical tree (`5ce9190a`). Production was still serving `3bb2029f`, from before the layout shells; it was not measured, because the migration freezes `main`.
- **Build**: `pnpm install --frozen-lockfile`, `pnpm build` with `wasm-opt` 129 (CI's version), rustc 1.100.0, wasm-pack 0.14.0, Node 24.13.1, then `rm dist/assets/ort-wasm-*.wasm` as the deploy workflows do. Building again gave a byte-identical `dist`.
- **When and where**: 2026-11-25 and 26, MacBook with Apple M3 Pro, AC power, Chromium 156.0.8078.4 (Playwright 1.64), Lighthouse 13.6.0.
- **Samples**: three separate runs of five rounds, so every timing is the median of 15 with the full range. No measurement failed. The raw results are in [runs/](runs/), and the tables are the output of `node e2e/perf/report.ts docs/perf/runs/react-c3983f81-{a,b,c}.json`.
- **The machine was not idle.** During run c other programs used 1.5 of 11 cores on average and 5.5 at most; runs a and b were not logged and the load average reached 19. Mobile medians hardly moved (see Noise). Single outliers, such as number-base-converter's 5,541 ms mobile FCP, are probably this.

| Page | Layout | Why it is here |
|------|--------|----------------|
| Home | | |
| Hash Generator | transformer | The spike builds it. MD5 loads WebAssembly. |
| Escaped JSON Stringifier | codec | The spike builds it. CodeMirror. |
| Image Converter | file-processor | The spike builds it. |
| UUID Generator | generator | Loads WebAssembly on open. No CDN code. |
| JSON Diff | comparator | The comparator the e2e journey drives. |
| Number Base Converter | custom | The nearest to the median of the 27 custom tools by first-load size among those with a WebAssembly step (382.6 kB against a median of 382.1). |

## What to know before using these numbers

1. **The loading emoji is 60% of a tool page's bytes.** While the code loads, a tool page shows an animated image from `fonts.gstatic.com` (621.9 kB; home has a different one, 340.6 kB). It competes with the JavaScript for the same bandwidth. With it removed, Hash Generator and Escaped JSON were ready 0.6 s sooner (5.6 to 5.0 s) and their LCP 0.8 and 0.5 s sooner; Image Converter did not change. A Dioxus build that drops or keeps this image will gain or lose that much for reasons unrelated to Dioxus. Budgets should either require it on both sides or measure both without it.
2. **Simulated Lighthouse cannot judge this migration.** Its FCP leaves out code that a script fetches. Padding first paint with 1.5 MB of WebAssembly moved the simulated FCP by 5 ms and the real one by 8.5 s. `lighthouserc.cjs` uses simulation. The numbers here apply the throttle for real.
3. **Desktop timings are too noisy for tight budgets on this machine.** See Noise.
4. **TBT is near zero everywhere** even at 4x CPU slowdown, because this machine is fast. It is a weak signal here; a slower CPU would be needed to make it a budget.
5. **CDN check.** The same measurement against `https://develop.csr-dev-tools.pages.dev` (same tree) gave Ready of 5.9 s for Hash Generator and Escaped JSON and 4.5 to 4.8 s for Image Converter, so the real CDN reads about 5% slower than the local server on two tools. Use one or the other for both builds, never a mix.
6. **LCP on tool pages is text, not the emoji**: the description paragraph, the empty-state text or a button.

## Noise

Largest difference between the three runs' medians, per metric, over all pages.

| | Mobile | Desktop |
|--|-------:|--------:|
| FCP | 1.9% | 22.7% |
| LCP | 5.0% | 27.1% |
| Speed Index | 1.1% | 13.6% |
| TBT | under 40 ms apart | 0 |
| Performance score | 1 point | 3 points |
| Ready | 0.9% | |
| First result | 1.8% | |
| Ready, repeat load | 4.8% | |
| Bytes and requests, own | none | |
| Bytes, third party | 3 bytes | |

## Results

### Lighthouse, mobile

| Page | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| home | 70 (70-72) | 100 | 100 | 100 | 3,125 (3,099-3,212) | 6,152 (5,569-6,207) | 3 (0-12) | 0.000 | 4,390 (4,189-4,453) |
| hash-generator | 71 (70-72) | 96 | 100 | 100 | 2,934 (2,889-2,997) | 5,973 (5,670-6,058) | 8 (3-31) | 0.000 | 4,430 (4,403-4,472) |
| escaped-json-stringifier | 71 | 96 | 100 | 100 | 2,929 (2,906-3,012) | 6,027 (5,991-6,077) | 20 (6-45) | 0.000 | 4,288 (4,255-4,359) |
| image-converter | 76 (75-77) | 100 | 100 | 100 | 2,912 (2,893-2,944) | 4,882 (4,563-4,931) | 0 | 0.000 | 3,907 (3,890-3,940) |
| uuid-generator | 69 (64-69) | 96 | 100 | 100 | 2,929 (2,898-3,763) | 6,992 (6,940-7,823) | 1 (0-15) | 0.000 | 4,479 (4,438-5,460) |
| json-diff-checker | 71 (70-72) | 96 | 100 | 100 | 2,918 (2,894-2,966) | 5,960 (5,625-6,060) | 27 (16-79) | 0.000 | 4,255 (4,039-4,316) |
| number-base-converter | 72 (59-73) | 100 | 100 | 100 | 2,914 (2,878-5,541) | 5,561 (5,480-8,139) | 0 (0-13) | 0.000 | 4,301 (4,273-7,002) |

### Lighthouse, desktop

| Page | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| home | 95 (91-96) | 100 | 100 | 100 | 753 (707-909) | 1,385 (1,320-1,892) | 0 | 0.000 | 1,222 (1,176-1,385) |
| hash-generator | 95 (92-96) | 96 | 100 | 100 | 711 (682-963) | 1,329 (1,296-1,572) | 0 | 0.000 | 1,215 (1,179-1,486) |
| escaped-json-stringifier | 96 (91-96) | 96 | 100 | 100 | 718 (677-885) | 1,333 (1,291-1,707) | 0 | 0.000 | 1,197 (1,169-1,389) |
| image-converter | 97 (90-98) | 100 | 100 | 100 | 714 (679-1,090) | 1,120 (994-1,688) | 0 | 0.000 | 1,018 (985-1,473) |
| uuid-generator | 93 (89-93) | 100 | 100 | 100 | 717 (678-966) | 1,635 (1,581-1,895) | 0 | 0.000 | 1,213 (1,169-1,472) |
| json-diff-checker | 96 (91-96) | 96 | 100 | 100 | 700 (684-881) | 1,322 (1,294-1,799) | 0 | 0.000 | 1,151 (1,125-1,341) |
| number-base-converter | 94 (79-96) | 100 | 100 | 100 | 719 (680-1,675) | 1,425 (1,297-2,272) | 0 | 0.000 | 1,171 (1,138-2,128) |

### Time to usable, ms

| Page | Ready | First result | Ready, repeat load |
| --- | --: | --: | --: |
| home | 5,757 (5,108-6,118) | 5,911 (5,240-6,303) | 1,074 (1,054-1,128) |
| hash-generator | 5,608 (5,252-5,963) | 7,851 (7,482-8,193) | 1,050 (1,027-1,130) |
| escaped-json-stringifier | 5,582 (5,165-9,532) | 6,004 (5,582-9,957) | 1,076 (1,052-1,128) |
| image-converter | 4,511 (4,225-4,544) | 4,727 (4,441-4,821) | 1,042 (1,030-1,077) |
| uuid-generator | 5,576 (5,525-5,641) | 6,898 (6,857-6,983) | 1,064 (1,042-1,108) |
| json-diff-checker | 5,519 (5,473-5,564) | 8,998 (8,927-9,115) | 1,072 (1,042-1,135) |
| number-base-converter | 5,422 (5,358-5,476) | 7,048 (6,988-7,113) | 1,032 (1,028-1,069) |

### First load, kB compressed / uncompressed

| Page | HTML | CSS | JS | WASM | Image and other | Own total | Own requests | Third party | Third-party requests |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| home | 1.4 / 5.1 | 12.2 / 69.6 | 391.3 / 1133.7 | 0.0 / 0.0 | 5.2 / 15.1 | 410.1 / 1223.4 | 83 | 351.1 / 355.2 | 3 |
| hash-generator | 1.5 / 4.8 | 12.2 / 69.6 | 375.8 / 1098.2 | 0.0 / 0.0 | 5.2 / 15.1 | 394.6 / 1187.7 | 67 | 642.0 / 646.1 | 4 |
| escaped-json-stringifier | 1.5 / 4.7 | 12.2 / 69.6 | 366.6 / 1075.2 | 0.0 / 0.0 | 5.2 / 15.1 | 385.4 / 1164.5 | 69 | 642.0 / 646.1 | 4 |
| image-converter | 1.5 / 4.8 | 12.2 / 69.6 | 235.5 / 675.3 | 0.0 / 0.0 | 5.2 / 15.1 | 254.3 / 764.8 | 62 | 632.5 / 636.5 | 3 |
| uuid-generator | 1.5 / 4.7 | 12.2 / 69.6 | 366.8 / 1076.9 | 14.1 / 29.9 | 5.2 / 15.1 | 399.8 / 1196.2 | 71 | 632.5 / 636.5 | 3 |
| json-diff-checker | 1.5 / 4.9 | 12.2 / 69.6 | 362.5 / 1067.5 | 0.0 / 0.0 | 5.2 / 15.1 | 381.3 / 1157.1 | 62 | 632.5 / 636.5 | 3 |
| number-base-converter | 1.4 / 4.7 | 12.2 / 69.6 | 359.2 / 1059.8 | 0.0 / 0.0 | 5.2 / 15.1 | 378.0 / 1149.2 | 55 | 632.5 / 636.5 | 3 |

### First load and first result, kB compressed / uncompressed

| Page | HTML | CSS | JS | WASM | Image and other | Own total | Own requests | Third party | Third-party requests |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| home | 1.4 / 5.1 | 12.2 / 69.6 | 391.3 / 1133.7 | 0.0 / 0.0 | 5.2 / 15.1 | 410.1 / 1223.4 | 83 | 351.1 / 355.2 | 3 |
| hash-generator | 1.5 / 4.8 | 12.2 / 69.6 | 377.9 / 1103.2 | 8.7 / 18.6 | 5.2 / 15.1 | 405.5 / 1211.3 | 71 | 642.0 / 646.1 | 4 |
| escaped-json-stringifier | 1.5 / 4.7 | 12.2 / 69.6 | 366.6 / 1075.2 | 0.0 / 0.0 | 5.2 / 15.1 | 385.4 / 1164.5 | 69 | 642.0 / 646.1 | 4 |
| image-converter | 1.5 / 4.8 | 12.2 / 69.6 | 235.5 / 675.3 | 0.0 / 0.0 | 5.2 / 15.1 | 254.3 / 764.8 | 62 | 973.0 / 977.1 | 4 |
| uuid-generator | 1.5 / 4.7 | 12.2 / 69.6 | 366.8 / 1076.9 | 14.1 / 29.9 | 5.2 / 15.1 | 399.8 / 1196.2 | 71 | 632.5 / 636.5 | 3 |
| json-diff-checker | 1.5 / 4.9 | 12.2 / 69.6 | 366.1 / 1076.6 | 72.5 / 146.1 | 5.2 / 15.1 | 457.4 / 1312.3 | 66 | 632.5 / 636.5 | 3 |
| number-base-converter | 1.4 / 4.7 | 12.2 / 69.6 | 360.6 / 1063.1 | 11.5 / 24.3 | 5.2 / 15.1 | 391.0 / 1176.8 | 57 | 632.5 / 636.5 | 3 |

## Output size and build time

`pnpm build` writes 60,790,536 bytes in 416 files. 26,861,777 of those are `ort-wasm-simd-threaded.asyncify`, which the deploy deletes. The deployed site is 33,928,759 bytes in 415 files, of which the PDF crate's WebAssembly is 21,858,158.

Seconds on the machine above, three builds each. "Quiet" followed two minutes of idle, with other programs averaging 96% of one core during the builds. The other rows show how much the same build varies with load.

| Conditions | Cold total | of which `wasm:build` | Warm total | of which `wasm:build` |
|------------|-----------:|----------------------:|-----------:|----------------------:|
| Quiet | 138.5 (137.7-145.8) | 135.7 | 37.9 (35.9-39.1) | 35.2 |
| Load not controlled; one cold build overlapped an install | 110.8 (107.6-132.6) | 107.0 | 29.4 (28.2-37.3) | 27.3 |
| Other programs busy | 187.8 (141.1-223.6) | 184.6 | 63.0 (54.7-69.3) | 59.8 |

`tsc -b` takes 1 to 2 seconds and `vite build` 1 to 4. Cold deletes all build output, warm keeps the compiler output; the exact steps are in the README.

GitHub Actions, the `Build` step of one run each (ubuntu-latest): 192 s with no Rust cache, 56 s and 63 s with it.

## First-load size across the site

One load of each of the 84 tools, kB compressed, own requests only. Measured before the final harness, with response headers included, so it reads 1 to 2% high. It was used to choose the custom tool; treat it as a map, not a baseline.

| Layout | Tools | Smallest | Median | Largest |
|--------|------:|---------:|-------:|--------:|
| transformer | 27 | 399.2 | 400.3 | 592.9 (mermaid-renderer) |
| codec | 12 | 388.5 | 389.0 | 391.0 |
| generator | 8 | 229.5 | 392.5 | 445.1 |
| file-processor | 8 | 240.6 | 247.8 | 400.0 |
| comparator | 2 | 386.0 | 386.5 | 386.5 |
| custom | 27 | 224.3 | 382.1 | 469.0 (db-diagram) |

On first load, WebAssembly loads on three of the 84: UUID Generator, Color Converter and Color Palette Generator.
