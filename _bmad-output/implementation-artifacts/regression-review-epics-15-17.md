# Regression Code Review — Epics 15-17

**Reviewer:** BMAD Adversarial Code Review  
**Date:** 2026-02-17  
**Scope:** 10 stories across Epics 15 (CSS & Design), 16 (Text Utilities), 17 (Image & Media)

---

## Epic 15: CSS & Design Tools

### Story 15.1: CSS Gradient Generator
**Issues:** 1 High, 2 Medium, 1 Low

#### 🔴 HIGH
1. **No validation on gradient stops array — empty array produces invalid CSS.** `generateGradientCss()` accepts an empty stops array and produces `linear-gradient(135deg, )` which is invalid CSS. Should validate minimum 2 stops or return a fallback.
   - File: `src/utils/gradient.ts:22`

#### 🟡 MEDIUM
2. **No angle clamping.** `handleAngleChange` accepts any numeric value (negative, >360) and passes it through. The `<FieldForm>` has min/max but those only constrain the range slider, not programmatic state. The util should clamp 0-360.
   - File: `src/components/feature/css/GradientGenerator.tsx:22`
3. **No position clamping.** Stop positions can be set outside 0-100 range via the util, producing invalid CSS like `linear-gradient(0deg, #ff0000 -50%)`.
   - File: `src/utils/gradient.ts:22-25`

#### 🟢 LOW
4. **Missing test for empty stops array.** No edge case test for `generateGradientCss('linear', 0, [])`.
   - File: `src/utils/gradient.spec.ts`

---

### Story 15.2: CSS Flexbox Playground
**Issues:** 1 High, 2 Medium, 1 Low

#### 🔴 HIGH
1. **Stale selectedItem index after removeItem causes potential crash.** `removeItem` checks `selectedItem >= items.length - 1` but reads from the pre-update `items` state. If selectedItem equals the last index, after `setItems` runs the next render accesses `items[selectedItem]` which may be undefined, causing `items[selectedItem].flexGrow` to throw.
   - File: `src/components/feature/css/FlexboxPlayground.tsx:52-56`

#### 🟡 MEDIUM
2. **Negative gap values not prevented in utility.** `generateFlexboxCss` happily generates `gap: -5px;` — invalid CSS. The component range slider has min=0, but the util has no guard.
   - File: `src/utils/flexbox.ts:37`
3. **No test for empty items array.** `generateFlexboxCss(DEFAULT_CONTAINER, [])` is never tested.
   - File: `src/utils/flexbox.spec.ts`

#### 🟢 LOW
4. **Array index as React key.** Both GradientGenerator and FlexboxPlayground use `key={index}` for dynamic lists, which causes reconciliation issues when items are reordered or removed.
   - File: `src/components/feature/css/FlexboxPlayground.tsx:157`

---

### Story 15.3: SVG Viewer & Optimizer
**Issues:** 2 High, 1 Medium, 1 Low

#### 🔴 HIGH
1. **XSS via `dangerouslySetInnerHTML` — sanitizeSvg is bypassable.** The sanitizer uses simple regex that can be bypassed with creative payloads. For example: `<svg><set attributeName="onload" to="alert(1)"/>` bypasses the `on\w+=` pattern since it's an attribute *value*, not an attribute on the tag. Also `<svg><a xlink:href="javascript:alert(1)">click</a></svg>` is not sanitized. Using `dangerouslySetInnerHTML` with user-provided SVG is inherently risky.
   - File: `src/utils/svg-optimize.ts:7-15`, `src/components/feature/image/SvgViewer.tsx:91`
2. **`javascript:` protocol in SVG href/xlink:href not stripped.** The sanitizer doesn't remove `javascript:` URIs from `href` or `xlink:href` attributes, which is a direct XSS vector.
   - File: `src/utils/svg-optimize.ts:7-15`

#### 🟡 MEDIUM
3. **Download allows downloading unsanitized content.** `handleDownload` uses `optimizeResult?.optimized ?? source` — the optimized version is NOT sanitized, only the preview SVG is. A user could optimize, download, and serve the file with malicious payloads intact.
   - File: `src/components/feature/image/SvgViewer.tsx:38-44`

#### 🟢 LOW
4. **No max input size limit.** No guard against extremely large SVG strings which could freeze the browser during regex-based optimization.
   - File: `src/components/feature/image/SvgViewer.tsx`

---

## Epic 16: Text Utilities

### Story 16.1: Text Case Converter
**Issues:** 0 High, 2 Medium, 2 Low

#### 🟡 MEDIUM
1. **`splitWords` doesn't handle numeric boundaries.** Input like `"abc123def"` stays as one word `"abc123def"` — most case converters would split at alpha/numeric boundaries. Similarly, `"XMLParser"` produces `["XM", "LParser"]` due to the regex, which results in `toCamelCase("XMLParser")` → `"xmLparser"` — likely wrong.
   - File: `src/utils/text-case.ts:4-9`
2. **No test for consecutive uppercase acronyms.** Missing tests for `"XMLParser"`, `"getHTTPResponse"`, `"IOError"` — common edge cases where the splitting regex may produce unexpected results.
   - File: `src/utils/text-case.spec.ts`

#### 🟢 LOW
3. **`onAfterClose` callback inconsistency.** `onAfterClose={onAfterDialogClose ?? handleReset}` — if `onAfterDialogClose` is provided, `handleReset` is NOT called, leaving stale state in the component.
   - File: `src/components/feature/text/TextCaseConverter.tsx:64`
4. **Debounce of 300ms may feel sluggish** for a text case converter which is typically instant. Consider 150ms or immediate computation given the lightweight transformations.
   - File: `src/components/feature/text/TextCaseConverter.tsx:47`

---

### Story 16.2: Word & Character Counter
**Issues:** 0 High, 2 Medium, 1 Low

#### 🟡 MEDIUM
1. **Sentence counting is inaccurate for abbreviations.** `text.split(/[.!?]+/)` splits on every period, so `"Dr. Smith went to Washington D.C. today."` counts as 4 sentences instead of 1. This is a known-hard problem but worth noting the limitation.
   - File: `src/utils/word-counter.ts:33`
2. **`readingTime` returns `"0 min"` for empty input but `"< 1 min"` for short text.** Inconsistent: empty → `"0 min"`, 1 word → `"< 1 min"`. The `formatTime` function handles `< 1` but the empty-string early return hardcodes `"0 min"`.
   - File: `src/utils/word-counter.ts:21,8`

#### 🟢 LOW
3. **No test for speaking time calculation.** Tests cover reading time but not speaking time (130 wpm).
   - File: `src/utils/word-counter.spec.ts`

---

### Story 16.3: Lorem Ipsum Generator
**Issues:** 1 High, 1 Medium, 2 Low

#### 🔴 HIGH
1. **Deterministic "random" output — `getRandomWord` is just modular indexing.** `getRandomWord(index)` returns `LOREM_WORDS[index % LOREM_WORDS.length]` which cycles through the same words in order every time. The output is identical on every call with the same parameters. While not a bug per se, calling it "random" is misleading and the output is predictable/repetitive for longer text. Users will see the same cycling pattern.
   - File: `src/utils/lorem-ipsum.ts:189-191`

#### 🟡 MEDIUM
2. **Duplicate word `'magna'` in LOREM_WORDS array.** The word `'magna'` appears at both index ~17 and index ~185, wasting a slot and causing slightly biased distribution.
   - File: `src/utils/lorem-ipsum.ts` (lines with `'magna'`)

#### 🟢 LOW
3. **`handleCountChange` allows 0 via direct input.** The range slider has min=1 but typing `0` in the input (if FieldForm allows) would pass through since only NaN is checked, not min bounds.
   - File: `src/components/feature/text/LoremIpsumGenerator.tsx:23-26`
4. **Initial output generated in useState initializer** means the first render shows content before user interaction, which is fine UX but the content never updates unless "Generate" is clicked — changing count/unit/checkbox doesn't auto-update.
   - File: `src/components/feature/text/LoremIpsumGenerator.tsx:18`

---

### Story 16.4: String Escape/Unescape
**Issues:** 1 High, 2 Medium, 1 Low

#### 🔴 HIGH
1. **`unescapeJavaScript` order of operations causes incorrect results.** The backslash unescape (`\\\\ → \`) runs LAST, but it should run last. Actually, re-examining: `\\0` is replaced first, meaning `\\\\0` would become `\\\0` → then `\\` → `\` giving `\0` (null). The input `"\\\\0"` should unescape to `"\\0"` (literal backslash + zero) but instead produces `"\0"` (null character). The replacement order is wrong — `\\\\` should be processed FIRST.
   - File: `src/utils/string-escape.ts:55-62`

#### 🟡 MEDIUM
2. **`unescapeJson` is vulnerable to injection.** `JSON.parse(\`"${input}"\`)` — if input contains an unescaped `"`, the JSON parse could behave unexpectedly. For example, input `'", "injected": "value'` would cause a parse error, but more subtle inputs could cause issues. The error is caught, but the pattern is fragile.
   - File: `src/utils/string-escape.ts:70-75`
3. **`decodeURIComponent` throws on malformed sequences.** Input like `"%E0%A4%A"` (truncated) causes `decodeURIComponent` to throw `URIError`. The component catches this generically but the error message says "invalid sequences" which is vague.
   - File: `src/utils/string-escape.ts:82`

#### 🟢 LOW
4. **No test for error cases.** No tests verify that `unescapeJson` throws on invalid input or that `unescapeUrlString` throws on malformed percent-encoding.
   - File: `src/utils/string-escape.spec.ts`

---

## Epic 17: Image & Media Tools

### Story 17.1: QR Code Generator
**Issues:** 0 High, 2 Medium, 1 Low

#### 🟡 MEDIUM
1. **Story file says component at `src/components/feature/image/QrCodeGenerator.tsx` but actual location is `src/components/feature/generator/QrCodeGenerator.tsx`.** File list in story is inaccurate.
   - File: story `17-1-qr-code-generator.md`
2. **No input length validation.** QR codes have data capacity limits based on error correction level. Very long input will cause the `qrcode` library to throw, but there's no proactive validation or user-facing limit indicator.
   - File: `src/components/feature/generator/QrCodeGenerator.tsx`

#### 🟢 LOW
3. **`generate` function recreated via `useCallback` but depends on `toast`** which changes identity. Should be stable due to `useToast` likely returning a stable ref, but worth verifying.
   - File: `src/components/feature/generator/QrCodeGenerator.tsx:27`

---

### Story 17.2: Image to Base64
**Issues:** 1 High, 1 Medium, 1 Low

#### 🔴 HIGH
1. **XSS in generated HTML tag.** `imageFileToBase64` generates `<img src="${dataUri}" alt="${file.name}" ...>` — the `file.name` is not escaped. A file named `"><script>alert(1)</script>` would inject HTML. Users copy this HTML tag via CopyButton.
   - File: `src/utils/image-base64.ts:23`

#### 🟡 MEDIUM
2. **No file size limit.** `imageFileToBase64` accepts any file size. A 100MB image would create a massive base64 string, potentially crashing the browser tab. Should validate max size before processing.
   - File: `src/utils/image-base64.ts:16`

#### 🟢 LOW
3. **Test coverage is minimal.** Only `formatBase64Size` is tested. `imageFileToBase64` has zero test coverage (acknowledged as DOM-dependent but mock-based tests are possible with `vitest` and `jsdom`).
   - File: `src/utils/image-base64.spec.ts`

---

### Story 17.3: Base64 to Image
**Issues:** 1 High, 1 Medium, 2 Low

#### 🔴 HIGH
1. **Format detection defaults to PNG silently.** `detectFormatFromBase64` returns `'png'` when no magic bytes match. This means random/garbage base64 input gets a `data:image/png` prefix, which will fail to render but the format label shows "PNG" — misleading the user into thinking it's a valid PNG.
   - File: `src/utils/base64-image.ts:17`

#### 🟡 MEDIUM
2. **No input size validation.** Pasting a multi-megabyte base64 string triggers an Image decode which can freeze the browser. Should cap input length or show a warning.
   - File: `src/components/feature/image/Base64ToImage.tsx`

#### 🟢 LOW
3. **Test coverage is essentially zero.** The only test checks that the module exports a function — no actual behavior is tested.
   - File: `src/utils/base64-image.spec.ts`
4. **Hidden anchor element rendered unconditionally.** `<a className="hidden" download="" href="" ref={downloadAnchorRef} />` is always in the DOM even when no download is needed. Minor DOM pollution.
   - File: `src/components/feature/image/Base64ToImage.tsx:100`

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 HIGH | 8 |
| 🟡 MEDIUM | 16 |
| 🟢 LOW | 13 |
| **Total** | **37** |

### Common Patterns

1. **XSS/Security (3 stories):** SVG dangerouslySetInnerHTML with bypassable sanitizer, unescaped file names in HTML generation, JavaScript protocol URIs not stripped.
2. **Missing input validation (6 stories):** No size limits, no clamping of numeric values, no length caps on user input.
3. **Insufficient test coverage (5 stories):** Edge cases untested, error paths untested, DOM-dependent functions completely untested.
4. **Deterministic "randomness":** Lorem ipsum generator uses modular indexing instead of actual randomization.
5. **Incorrect escape/unescape ordering:** JavaScript string unescape processes replacements in wrong order causing data corruption.
