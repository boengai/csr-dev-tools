# ADR 0025 — Image reductions resample on the CPU (Pillow-faithful Lanczos), not `drawImage`

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

A user reported that Image Resizer output (PNG 1000×1000 → WebP 150×150)
looked much worse than the same resize done with Python/Pillow.

`processImage` (and the favicon / splash generators) shrank images with a
single `ctx.drawImage(img, …, dw, dh)`. The HTML spec leaves the downscale
filter to the browser, and every engine samples a small fixed neighbourhood:

- Firefox: single-pass bilinear (2×2 taps), always — it has no
  `imageSmoothingQuality`.
- Chrome: at the default `imageSmoothingQuality = 'low'`, a bilinear
  pre-shrink to a mip level, then bilinear again; `'medium'`/`'high'` give
  trilinear mipmapping.
- Safari: CoreGraphics `kCGInterpolationLow` at the default.

At 6.67× that aliases (moiré, broken strokes, dropped 1px lines). Pillow's
`resize()` widens its kernel with the ratio so every source pixel
contributes. Against Pillow LANCZOS on a detail-heavy test image: GPU Chrome
17.4 dB, Firefox 13.3 dB, WebKit 13.5 dB. WebP encoding was not a factor (the
tool encodes at quality 1, which Chrome and Firefox write as lossless VP8L).

No browser-native option closes the gap everywhere: `imageSmoothingQuality =
'high'` reached 27.4 dB in Chrome and does nothing in Firefox; step-down
halving was worse than `'high'`; `createImageBitmap(…, {resizeQuality:
'high'})` matches Pillow only in Firefox.

## Decision

Reductions are resampled on the CPU by `src/utils/resample.ts`, a port of
Pillow's `Image.resize(size, LANCZOS, box, reducing_gap)`:
`libImaging/Resample.c` (separable Lanczos-3 with support scaled by the
ratio, 22-bit fixed-point weights, an 8-bit intermediate, Pillow's pass
order, float32 box edges), `libImaging/Reduce.c` (the integer box
pre-reduction, including its rounding and partial edge blocks), and the
`RGBA → RGBa → RGBA` premultiplied-alpha round trip. Unit tests assert exact
equality with Pillow-generated fixtures
(`src/test/fixtures/resample-pillow.gen.py`).

`src/utils/canvas.ts` connects it to canvases:

- `planScaledDraw` resamples whenever either axis shrinks. Enlargements and
  1:1 copies keep plain `drawImage` (unchanged pixels). Destination edges are
  rounded, not origin + size, so letterboxes stay centred.
- `createScaledDrawer(image)` reads the whole image once, at full resolution,
  in tiles of at most 4096×4096 (2²⁴ px — iOS Safari's canvas area limit;
  larger canvases silently draw nothing). Every tile draws the whole image
  with the 5-argument `drawImage`, offset by the tile position: the
  9-argument form mis-maps SVGs that only declare a `viewBox`, and Firefox
  draws such tiles blank. The single full-size buffer is premultiplied in
  place.
- Sources over 2²⁶ px (~67 MP) fall back to plain `drawImage` rather than
  buffer ~270 MB.
- Overhanging source rects are clipped to the image, and the target is
  clipped in proportion (`clipToImage`), as the spec's `drawImage` does.
- Resampled pixels are painted 1:1, so compositing over existing canvas
  content (JPEG / splash background fills) is unchanged.
- A drawer caches its read, `reduce()` results and its last resample. The
  favicon and splash generators share one drawer per batch.
- Reducing gap: 3 for the Image Resizer (Pillow documents ≥ 3 as
  indistinguishable from a full Lanczos pass in most cases);
  `THUMBNAIL_REDUCING_GAP = 2` (Pillow's `thumbnail()` default) for the
  generators, which render many sizes of one image.

`ImageToolShell` gains an opt-in `controlsDebounceMs`. Image Resizer uses
250 ms, so typing a size runs one resample instead of one per keystroke.
Seeding its controls from `<img onLoad>` calls `recompute()`, so the first
result is not delayed.

## Consequences

**Positive**

- Opaque output is byte-identical to Pillow run on the same decoded pixels, in
  Chrome, Firefox and WebKit, for sources up to 67 MP:
  `resize(…, reducing_gap=3)` for the Resizer and
  `reducing_gap=2` for favicons, PWA icons and splash screens. Alpha is exact.
  Semi-transparent pixels can differ by 1 level, because canvases store
  premultiplied alpha.
- Output no longer depends on the browser's filter choices. The original
  report's case went from 13–17 dB to identical.

**Negative / behaviour changes**

- Resampling is synchronous JavaScript on the main thread. Medians on an
  Apple M3 Pro, before → after, Chrome / Firefox:
  - Resizer 1000² → 150: 11 → 28 ms / 12 → 32 ms.
  - Resizer 4000×3000 → 150×113: 52 → 146 ms / 58 → 133 ms.
  - Resizer 6000×4000 → 3000×2000: 184 → 1284 ms / 149 → 1602 ms, as one
    block.
  - Resizer 6000×4000 → 5900×3933: 261 → 2287 ms / 238 → 2539 ms.
  - Favicons from a 4096 logo: 15 → 570 ms / 4 → 527 ms.
  - Splash + PWA assets from a 1024 logo: 0.73 → 1.87 s / 0.61 → 2.07 s.
  - Splash + PWA assets from a 4096 logo: 0.68 → 3.79 s / 0.59 → 4.16 s. The
    generator yields between assets; its longest block is 292 / 353 ms.
- Peak memory for a 64 MP source is about 0.8–0.9 GB over idle, against
  0.2–0.3 GB before.
- Sources over 67 MP keep the old `drawImage` aliasing.
- Image Resizer re-processes 250 ms after the last keystroke rather than
  immediately.
- Letterboxed icons snap to whole pixels. Very thin content can lose up to
  half a pixel per edge.
- Extreme reductions of opaque sources can produce alpha 254, as in Pillow.
- WebKit now clips overhanging `cover` crops as Chrome and Firefox do (it used
  to stretch them). Firefox now draws `viewBox`-only SVGs at full size on the
  1:1 conversion path (it used to draw them at half size).

## Revisit when

- Main-thread time matters on low-end devices, or for large photos at
  moderate ratios. Move `resamplePrepared` to a worker (the
  `createWorkerBridge` pattern) and, for batch generation, a worker pool.
- Browsers ship a ratio-scaled downscale filter for `drawImage` /
  `createImageBitmap` everywhere. Today only Firefox's `createImageBitmap`
  `resizeQuality: 'high'` qualifies.
