# Trial: can tract-onnx run background removal in place of transformers.js?

This is the trial for GitHub issue [#44](https://github.com/boengai/csr-dev-tools/issues/44), the third of the three trials in ADR-0033.

- **Date and repo state:** 2026-11-27. This branch is cut from `develop` at `6301b1e3`, and it is never merged.
- **Same code on `main` and `develop`:** the background-removal worker, `src/utils/background-removal.ts` and the transformers.js and ONNX Runtime lock entries are identical on `main` (`481701bf`) and `develop`.
- **Agreed before any run:** the corpus and the pass bar were written into #44 first, and the user approved them.
- **Two rulings during the trial:**
  - **Version:** the agreed pin did not load the model. The user ruled to judge tract **0.23.10** (see Deviations).
  - **Memory:** the user ruled the memory finding a **pass with a port condition**.

## Answer

**Pass, with one port condition.** tract-onnx 0.23.10 runs MODNet's fp32 model in a Rust worker. It passes every judged check against transformers.js 4.3.1 on `main`.

| Check | Bar | Result (tract 0.23.10) |
|---|---|---|
| The model loads | — | pass on 0.23.10. **The agreed pin, 0.22.6, fails** (see Deviations). |
| Mask fidelity, final uint8 mask at original size | ≥ the floor, or ≥ 45 dB | **pass:** 59.7–96.4 dB on every image, max difference 1/255 |
| Cold start: worker spawn to first mask, model cached | ≤ 1.25× | **pass:** 1,411 vs 1,608 ms (**0.88×**), medians of 15 |
| Latency: warm, per image | ≤ 1.25× | **pass, narrowly:** 1.04–**1.23×** (worst: the animal photo, 1,210 vs 982 ms) |
| Bytes: brotli, wasm + glue + worker | ≤ transformers.js worker chunk + ORT `.mjs` + `.wasm` | **pass:** 2,301,198 vs 4,155,073 B (**0.55×**) |
| No trap | no image over 10 s, peak wasm memory under 1 GiB, bad input returns `Err` | **pass:** worst image 5.3 s (both engines take over 4.6 s on the panorama), peak **946 MiB**, 9 bad inputs all return `Err` |

**The port condition (memory).** tract's wasm memory grows with the model input's width, and a wasm memory never shrinks. The corpus peak of 946 MiB comes from its one panorama (4096×669, whose model input is 3104×512), which is close to the bar. Wider inputs, probed beyond the bar:

| Source | Model input | tract peak wasm memory | Outcome |
|---|---|---:|---|
| 4096×669 | 3104×512 | 913 MiB | ok |
| 6000×600 | 5120×512 | 1.40 GiB | ok |
| 8192×669 | 6240×512 | 1.69 GiB | ok |
| 12000×512 | 12000×512 | 2.62 GiB | ok |
| 16384×512 | 16384×512 | 3.55 GiB | ok on 0.23.10; **trapped (`unreachable`, out of memory) on 0.23.11**, where ORT finishes |

So the background-remover port must do two things:
1. **Cap the model input.** Return `Err` above a width ORT is known to handle on the same machine, or downscale so the longest edge stays within a limit. Either way, the limit must be written down, because a downscale changes the output and is therefore a parity question.
2. **Recycle the worker after a run that grew memory past a threshold,** so one wide image does not keep a worker of a gigabyte or more alive.

**The hosting question (fact only, the decision is the user's).** The fp32 `model.onnx` is 25,888,640 B. That is 325,760 B (1.2%) under Cloudflare Pages' 25 MiB per-file limit, so it can be self-hosted, but with little room. The model download is the same with either engine, so it does not count toward bytes.

**The `'unsafe-eval'` question.** Today's background-remover journey passes without `'unsafe-eval'`. The React app was built from `develop` and served by `vite preview`, with the CSP from `public/_headers` injected:

| CSP | Result |
|---|---|
| as shipped | result shown |
| minus `'unsafe-eval'` | **result shown** |
| control: minus jsdelivr | **no result**, which shows the injected header takes effect |

[`harness/no-eval.sh`](tract-bg-removal-trial/harness/no-eval.sh) scans the shipped JS:
- **The tract glue** has no `eval` or `Function(` call.
- **The transformers.js worker chunk** has one `Function(…)`: Emscripten embind's dynamic method caller. The journey never reached it. A port that keeps transformers.js would still carry it, so dropping `'unsafe-eval'` rests on that path staying unused.

Result: [`runs/no-eval.txt`](tract-bg-removal-trial/runs/no-eval.txt).

## Deviations from the agreed bar

- **The tract version.**
  - The bar pinned 0.22.6, because 0.23.11 was published on the day of the trial.
  - **0.22.6 cannot build MODNet's graph.** The error is `Building node Resize_190 … coordinate_transformation_mode: pytorch_half_pixel`, and support for that mode reached `tract-core` in 0.23.5.
  - Everything was first measured on 0.23.11. The user then chose to judge **0.23.10**, published 2026-11-05.
  - Both versions produce the same mask on the native probe. The 0.23.11 run is kept in [`runs/0.23.11/`](tract-bg-removal-trial/runs/0.23.11/).
  - On latency, 0.23.10 is 2–4% slower than 0.23.11, measured before the composite fix below.
- **The noise floor came from WebKit, not Firefox.** Neither Playwright's Firefox 157 nor Firefox.app 151 would launch on the trial machine, inside or outside the command sandbox ("Could not find profile folder"; `sandbox_extension_issue_file_to_process … Operation not permitted`).
  - Playwright's WebKit 27.2 stood in. That browser differs from Chrome end to end: the decoder, the canvas resampling and ORT's wasm runtime.
  - The floor decided nothing, because every image cleared the 45 dB arm. On `7-large.jpg`, tract's 60.4 dB is below WebKit's 64.7 dB floor, but above 45 dB.
- **Symbolic shapes.** tract cannot infer MODNet's scale-0.5 `Resize` over symbolic H and W. So the candidate keeps the parsed model and optimises a concrete plan per input size, caching the last plan.
  - A new size costs about 100 ms on its first run.
  - In the latency loop, `3-product.jpg` and `7-large.jpg` follow an image of the same model input size (768×512), so they reuse the plan. Their ratios, 1.10× and 1.04×, are cache hits.
  - The other six are misses. Those are the judged case, because a user usually changes the image, and they give the 1.14–1.23× range.
- **The tract worker first skipped the full-size output.** The code review caught it. The baseline's timed call builds the RGBA result (`clone` and `putAlpha`), but the first candidate stopped at the mask.
  - The candidate now builds the same full-size RGBA (source RGB with the mask as alpha) inside its timed path, and every number here comes from that build.
  - The superseded run is in [`runs/superseded-no-composite/`](tract-bg-removal-trial/runs/superseded-no-composite/). It gave 0.85–1.22×.
  - One re-run went **void**: the Mac moved to battery mid-run. It is kept in [`runs/void-battery/`](tract-bg-removal-trial/runs/void-battery/). The runner now refuses to start on battery and marks a run void if power changes.
- **ORT's memory was not measured.** The bar's memory line reads "no worse than transformers.js", but only tract's `memory.buffer` was read, so the 1 GiB figure is an absolute limit. ORT does finish the 16384×512 probe that traps tract on 0.23.11.
- **The bad-input cases ran in Node's V8,** on the same wasm build, not inside the browser worker. Only the 1×1 and 8000×8000 inputs ran in Chrome.
- **The build** is `opt-level = 3` with fat LTO, then `wasm-opt -Oz`. #42 and #43 used `opt-level = "z"`; here speed is judged.
- **Cold start ran on the vite dev server.** That means unminified transformers.js, and the tract wasm served locally with revalidation. The ORT wasm came from jsdelivr's HTTP cache, and the model from Cache Storage on both sides.

## Results

GPU Chrome 158.0.8127.37 (`channel: 'chrome'`, headless; WebGL renderer "ANGLE Metal Renderer: Apple M3 Pro") on AC power. `pmset -g log` shows no sleep or wake during the run.
- **The judged run** went from 23:53 to 00:03 local time on 2026-11-27/28.
- **Load average** was 4.7 / 3.2 / 3.5 at the start and 2.8 at the end. Other sessions shared the machine.
- **Spread:** the three per-run medians of every latency ratio agree within 0.04, except `7-large.jpg` (1.03 / 1.06 / 0.89). The miss-case images, which are judged, agree within 0.03.
- **Data:** [`runs/chrome.json`](tract-bg-removal-trial/runs/chrome.json).

### Mask fidelity

Both engines get the same decoded RGBA. PSNR is over the uint8 mask, peak 255.
- **Raw:** the engine alone. transformers.js's own input tensor runs through tract and through ORT, and the float outputs are compared (peak 1).
- **Edge band:** the mean absolute difference where either mask is between 8 and 247.

| Image | Size → model input | Mask PSNR | Max diff | Edge band | Raw PSNR | WebKit floor |
|---|---|---:|---:|---:|---:|---:|
| 1-portrait.jpg | 2448×3264 → 512×672 | 66.6 dB | 1 | 0.00013 | 128.7 dB | 47.9 dB |
| 2-group.jpg | 2048×1365 → 768×512 | 69.8 dB | 1 | 0.00163 | 112.6 dB | 29.7 dB |
| 3-product.jpg | 4419×2946 → 768×512 | 60.5 dB | 1 | 0.00074 | 118.2 dB | 28.5 dB |
| 4-animal.jpg | 1290×1689 → 512×640 | 59.7 dB | 1 | 0.00016 | 126.9 dB | 41.3 dB |
| 5-alpha.png | 421×576 → 512×672 | 74.2 dB | 1 | 0.00135 | 109.2 dB | 20.9 dB |
| 6-small.jpg | 330×220 → 768×512 | 61.6 dB | 1 | 0 | 135.7 dB | 46.5 dB |
| 7-large.jpg | 8256×5504 → 768×512 | 60.4 dB | 1 | 0.00010 | 134.5 dB | 64.7 dB |
| 8-panorama.jpg | 4096×669 → 3104×512 | 96.4 dB | 1 | 0.00189 | 122.9 dB | 31.5 dB |

No pixel differs by more than 1, so no image needed a check by eye. The few differences come from float order inside the engine, where a value lands on the other side of an integer before the `Uint8Array.from` truncation.

### Speed

Medians of 15: three runs of five rounds, alternating which engine goes first. Each time is measured inside the worker, from receiving the RGBA to the finished full-size RGBA output, with the mask as alpha.

| Image | transformers.js | tract | Ratio | Plan |
|---|---:|---:|---:|---|
| 1-portrait.jpg | 1,123 ms | 1,328 ms | 1.18 | miss |
| 2-group.jpg | 1,192 ms | 1,430 ms | 1.20 | miss |
| 3-product.jpg | 1,320 ms | 1,450 ms | 1.10 | hit |
| 4-animal.jpg | 982 ms | 1,210 ms | **1.23** | miss |
| 5-alpha.png | 1,007 ms | 1,229 ms | 1.22 | miss |
| 6-small.jpg | 1,156 ms | 1,385 ms | 1.20 | miss |
| 7-large.jpg | 1,769 ms | 1,834 ms | 1.04 | hit |
| 8-panorama.jpg | 4,651 ms | 5,313 ms | 1.14 | miss |
| **Cold start** (portrait) | 1,608 ms | 1,411 ms | 0.88 | — |

- **The margin is thin.** The worst miss is 1.23× against a 1.25× bar. A port that adds work in the timed path, such as a slower resize or an extra copy, could cross it, so the port PR must re-measure.
- **Large images narrow the gap (not profiled):** on the large photo, both engines run the same 768×512 inference. transformers.js also converts and clones the full-size image (`rgb()`, `clone`) before `putAlpha`, while the port builds the output once.
- **Cold start (also not profiled):** tract's lead is consistent with compiling a 13.6 MB wasm instead of ORT's 26.9 MB asyncify build.
- **A pre-check in Node (not judged):** at 512×672, with the same tensor, single-threaded, tract wasm took 1,040 ms and ORT web wasm 992 ms, a ratio of 1.05.

### Bytes

Every file was compressed with brotli quality 11 (Node `zlib`) on both sides. Data: [`runs/bytes.json`](tract-bg-removal-trial/runs/bytes.json).

| File | Raw | Brotli |
|---|---:|---:|
| `background-removal.worker-*.js` (transformers.js and our code, `pnpm build`) | 546,120 | 128,338 |
| `ort-wasm-simd-threaded.asyncify.mjs` (from jsdelivr) | 53,057 | 16,608 |
| `ort-wasm-simd-threaded.asyncify.wasm` (from jsdelivr) | 26,861,777 | 4,010,127 |
| **transformers.js total** | | **4,155,073** |
| tract `oz.wasm` (0.23.10, `wasm-opt -Oz`) | 13,552,438 | 2,296,845 |
| `tract_trial.js` glue | 12,499 | 2,780 |
| `tract.worker.ts` (unminified source; `protocol.ts` left out) | 4,239 | 1,573 |
| **tract total** | | **2,301,198** |

jsdelivr itself serves the ORT wasm at 4,704,500 B brotli, so the real saving is larger. The `-O3` build is 10 kB smaller in brotli. Its speed was not measured in the browser.

### No trap

Data: [`runs/err-path.json`](tract-bg-removal-trial/runs/err-path.json) and `failures` in `chrome.json`.
- **Bad input, run in Node on the wasm build:** garbage, empty and truncated model bytes; the published q8 model; a wrong-length RGBA buffer; a wrong-length tensor; a zero size; a zero width; and a 1×1 tensor straight into the engine. All nine return `Err`, and none traps.
  - A 1×1 *source* is fine, because it is scaled up to 512×512. A 1×1 *tensor* fails tract's analysis, which is caught.
  - A zero size made tract abort inside optimisation, so the candidate rejects it before calling tract.
- **1×1 and 8000×8000 sources:** both become a 512×512 model input. Both engines finish, and their masks are identical:

  | Source | transformers.js | tract |
  |---|---:|---:|
  | 1×1 | 822 ms | 967 ms |
  | 8000×8000 | 1,666 ms | 1,448 ms |

- **Peak wasm memory:** 946 MiB on the corpus, from the panorama. See the port condition above.
  - In `chrome.json`, the per-image `wasmMemoryHighWater` fields are one worker's running high-water mark, because the panorama runs during the warm-up. They are not each image's own use.

### Reported, not judged

- **The quantized 2×2.**
  - **tract does not load the published `model_quantized.onnx`.** The error is `Failed analyse for node #642 "1012_bias_add" Add … Impossible to unify Sym(batch_size) with Val(1)`, and it persists after resetting the declared output facts.
  - **ORT's q8 is unusable for this model.** Against ORT fp32, its masks score 5.4–43.1 dB (median 11.6). By eye, they lose most of the portrait's torso and the inside of both product shots, and the warm portrait is no faster (1,203 vs 1,123 ms).
  - So a dtype change is not an option, whichever engine runs it. The 6.6 MB file would save download size but break the output.
- **0.23.11, on the harness before the composite fix:**
  - latency 0.79–1.19×
  - cold start 0.87×
  - bytes 2,346,808 B brotli
  - peak 930 MiB on the corpus
  - and the trap at 16384×512.

## Corpus

[`harness/corpus.tsv`](tract-bg-removal-trial/harness/corpus.tsv) lists each file's name, sha256 and Wikimedia Commons URL. Every file was found under Commons' CC0 statement (`haswbstatement:P275=Q6938433`). No file is committed.

| # | File | Why it is in |
|---|---|---|
| 1 | `1-portrait.jpg`, 2448×3264 | a portrait, the model's target |
| 2 | `2-group.jpg`, 2048×1365 | several people |
| 3 | `3-product.jpg`, 4419×2946 | a non-portrait product shot |
| 4 | `4-animal.jpg`, 1290×1689 | an animal |
| 5 | `5-alpha.png`, 421×576 RGBA | a PNG with alpha (transparent RGB decodes as black) |
| 6 | `6-small.jpg`, 330×220 | under 512 px, so it is scaled up (a Commons thumbnail of 7) |
| 7 | `7-large.jpg`, 8256×5504 | over 4000 px |
| 8 | `8-panorama.jpg`, 4096×669 | rounding to 32 changes the shape: 3134 → 3104 |

The 1×1 and 8000×8000 failure inputs are synthetic and are made in the page.

## How the candidate works

[`harness/tract-trial`](tract-bg-removal-trial/harness/tract-trial/) is a standalone crate on Rust 1.100 with wasm-bindgen 0.2.130, built for `wasm32-unknown-unknown` with `+simd128` and no threads.
- **Load:** `Segmenter::new` parses the ONNX bytes.
- **Per call:** `segment(rgba, h, w)` takes the model-sized RGBA and returns the uint8 mask at model size. It runs three steps:
  1. **Pre-processing:** `rescale` and `normalize` with the same f64-then-f32 rounding that a JS `Float32Array` gets, laid out CHW.
  2. **Inference:** a concrete plan for the input size.
  3. **Post-processing:** a sigmoid only if the output leaves [0, 1], then `×255` and truncation, as `Uint8Array.from` does.

  Native tests pin both steps against numbers taken from transformers.js's arithmetic in Node.
- **Resizing:** both resizes run in the worker through OffscreenCanvas `drawImage`, as transformers.js does on `main`, and as ADR-0033's platform layer would. The 512 resize uses shortest edge 512 and floor to a multiple of 32. The mask is resized back as grey RGBA, then `grayscale()`.
- **The model** comes from Cache Storage after the first visit.
- **A cargo detail:** the `getrandom` `wasm_js` feature is needed only because `tract-onnx-opl` depends on `rand`.

## How to reproduce

From the repo root, on this branch:

```sh
pnpm install && pnpm build                       # the transformers.js worker chunk (bytes)
H=docs/research/tract-bg-removal-trial/harness
# corpus/ and models/ are not committed:
while IFS=$'\t' read n sha url; do curl -sfL "$url" -o "$H/corpus/$n"; done < "$H/corpus.tsv"
shasum -a 256 $H/corpus/*                        # must match corpus.tsv
curl -sL https://huggingface.co/Xenova/modnet/resolve/main/onnx/model.onnx -o $H/models/model.onnx
curl -sL https://huggingface.co/Xenova/modnet/resolve/main/onnx/model_quantized.onnx -o $H/models/model_quantized.onnx
$H/build-wasm.sh                                 # needs wasm-bindgen 0.2.130 and binaryen
cargo test --release --manifest-path $H/tract-trial/Cargo.toml --lib
pnpm exec vite --port 5199 --strictPort &        # serves the harness page
node $H/run-browser.mjs floor                    # WebKit floor masks
node $H/run-browser.mjs chrome                   # the judged run → runs/chrome.json (on AC power)
node $H/bytes.mjs > docs/research/tract-bg-removal-trial/runs/bytes.json
$H/no-eval.sh
node $H/err-path.mjs
node $H/memory-probe.mjs
pnpm exec vite preview --port 5198 --strictPort &
node $H/unsafe-eval.mjs with; node $H/unsafe-eval.mjs without; node $H/unsafe-eval.mjs control
```

- **The model's sha256 values** are `07c308cf…84df9` for fp32 and `92e49898…ffa5c` for q8. They match Hugging Face's LFS oids.
- **`node-precheck.mjs`** is the Node pre-check. Pass it the ORT `dist/` path with `realpath`, not `cd`.

## Revisit when

- **The port:** apply the memory condition above. Then measure the port against the budgets, because this trial measured a harness, not the Dioxus tool.
- **tract releases:** recheck whether a release keeps H and W symbolic through `Resize`, which would remove the ~100 ms plan rebuild per new size, or loads the published q8 file.
- **The model:** if `model.onnx` on Hugging Face changes, its size against the 25 MiB Pages limit must be checked again before self-hosting.
