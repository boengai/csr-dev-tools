# Regression Code Review: Epics 12–14

**Reviewer:** BMAD Adversarial Code Review Agent
**Date:** 2026-02-17
**Stories Reviewed:** 11 (Epics 12, 13, 14)

---

## Epic 12: Code & Markup Formatters

### Story 12.1: HTML Formatter
**Issues:** 1 High, 2 Medium, 1 Low

#### 🔴 HIGH
1. **`minifyHtml` destroys `<pre>`/`<code>`/`<textarea>` content** — The regex `.replace(/\n\s*/g, '').replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><')` collapses all whitespace including inside preformatted elements. This silently corrupts user content. (`src/utils/html-format.ts:17-21`)

#### 🟡 MEDIUM
2. **No input size guard** — No limit on input length. A user pasting a multi-MB HTML document will freeze the browser during synchronous regex processing. All formatter utils share this issue.
3. **Tests don't cover `<pre>` preservation** — No test for whitespace-sensitive elements. (`src/utils/html-format.spec.ts`)

#### 🟢 LOW
4. **`minifyHtml` comment regex doesn't handle conditional comments** — `<!--[if IE]>` style comments will be stripped, which may be intentional but is worth noting.

---

### Story 12.2: CSS Formatter
**Issues:** 1 High, 1 Medium, 1 Low

#### 🔴 HIGH
1. **`minifyCss` breaks `calc()` and CSS custom properties** — `.replace(/\s*([{}:;,])\s*/g, '$1')` removes spaces around colons/commas inside values like `calc(100% - 20px)` → stays ok (no colon), but `font-family: "Helvetica Neue", sans-serif` loses spaces after commas → `font-family:"Helvetica Neue",sans-serif` (actually fine). Real issue: `.replace(/\s+/g, ' ')` after removing newlines would collapse `calc(100% - 20px)` correctly, but the issue is stripping spaces around `:` breaks `background: linear-gradient(...)` into `background:linear-gradient(...)` which actually works. **Revised**: The main problem is `.replace(/;\}/g, '}')` removes the last semicolon which is valid CSS, and the overall approach can break content inside string values in CSS (e.g., `content: "a { b }"` becomes corrupted). (`src/utils/css-format.ts:13-19`)

#### 🟡 MEDIUM
2. **No test for CSS with string values containing braces/semicolons** — Edge case `content: "hello { world }"` will be corrupted by the regex minifier but no test covers this.

#### 🟢 LOW
3. **Tab indent option could support tab-based minification consistency** — Minor UX gap.

---

### Story 12.3: JavaScript Minifier
**Issues:** 2 High, 2 Medium, 1 Low

#### 🔴 HIGH
1. **`minifyJs` is dangerously naive — breaks code** — The regex-based minifier removes `//` comments inside string literals (`"http://example.com"` → `"http:`), destroys regex literals (`/test/g` treated as comment start), and collapses whitespace inside template literals. This will silently produce broken JavaScript. (`src/utils/js-format.ts:14-22`)
2. **Story references `src/utils/js-minify.ts` but actual file is `src/utils/js-format.ts`** — The story file list is wrong. Component imports from `@/utils/js-format` which is correct, but story documentation is misleading.

#### 🟡 MEDIUM
3. **Size display (`new Blob()`) computed on every render** — `originalSize` and `resultSize` create Blob objects on every render cycle, not just when values change. Should be memoized. (`JavaScriptMinifier.tsx:56-58`)
4. **Tests are minimal** — Only 3 tests for minifyJs. No test for string-containing URLs, regex literals, template literals, or multi-line code.

#### 🟢 LOW
5. **"Savings" shows negative percentage when beautifying** — When beautifying, the output is larger than input, showing negative savings which is confusing UX.

---

### Story 12.4: SQL Formatter
**Issues:** 0 High, 2 Medium, 1 Low

#### 🟡 MEDIUM
1. **No tab indent option** — HTML and CSS formatters offer 2-space, 4-space, and tab indent. SQL formatter only offers 2 and 4 spaces — inconsistent UX across Epic 12.
2. **Tests are minimal** — Only 3 tests. No tests for complex queries (JOINs, subqueries, CTEs), edge cases, or different indent values.

#### 🟢 LOW
3. **No minify mode** — HTML and CSS formatters offer both beautify and minify. SQL formatter is beautify-only. Not necessarily wrong but inconsistent.

---

### Story 12.5: Markdown Preview
**Issues:** 2 High, 1 Medium, 1 Low

#### 🔴 HIGH
1. **XSS via `javascript:` URI scheme** — `sanitizeHtml` in `markdown.ts` strips `<script>`, `<iframe>`, `<object>`, `<embed>`, and `on*` event handlers, but does NOT strip `javascript:` URLs. Input `[click me](javascript:alert(1))` renders as `<a href="javascript:alert(1)">click me</a>` and clicking executes code. Combined with `dangerouslySetInnerHTML`, this is exploitable. (`src/utils/markdown.ts:3-8`)
2. **XSS via `<img src=x onerror>` variants not fully covered** — The `onerror` regex handles `on\w+=` but SVG-based XSS vectors like `<svg><animate onbegin=alert(1)>` or `<math><mi xlink:href="javascript:alert(1)">` may bypass the regex. Regex-based sanitization is fundamentally insufficient — should use DOMPurify.

#### 🟡 MEDIUM
3. **No markdown.spec.ts test for `javascript:` URL sanitization** — AC5 requires XSS prevention but tests don't cover this critical vector.

#### 🟢 LOW
4. **CopyButton copies raw HTML, not rendered text** — May confuse users expecting to copy the visual text.

---

## Epic 13: Data & Number Converters

### Story 13.1: XML to JSON Converter
**Issues:** 1 High, 2 Medium, 1 Low

#### 🔴 HIGH
1. **Component missing `ToolComponentProps`** — `XmlToJsonConverter` doesn't accept `autoOpen` or `onAfterDialogClose` props, breaking the standard component interface. Signature is `() => { ... }` instead of `({ autoOpen, onAfterDialogClose }: ToolComponentProps) => { ... }`. (`src/components/feature/data/XmlToJsonConverter.tsx:12`)

#### 🟡 MEDIUM
2. **`getXmlParseError` uses synchronous DOMParser, not async fast-xml-parser** — Inconsistent with `xmlToJson` which lazy-loads fast-xml-parser. DOMParser may report different errors than fast-xml-parser, confusing users when validation passes but conversion fails.
3. **No test for `getXmlParseError`** — Function exists but has zero test coverage.

#### 🟢 LOW
4. **No error boundary for lazy import failures** — If `fast-xml-parser` fails to load, the error is caught generically but error message doesn't indicate the cause.

---

### Story 13.2: TOML to JSON Converter
**Issues:** 1 High, 1 Medium, 0 Low

#### 🔴 HIGH
1. **Component missing `ToolComponentProps`** — Same as 13.1: `TomlToJsonConverter` has no `autoOpen`/`onAfterDialogClose` props. (`src/components/feature/data/TomlToJsonConverter.tsx`)

#### 🟡 MEDIUM
2. **Race condition in error handling** — In the `catch` block, `getTomlParseError` is awaited after catching, but another `process` call could have started. The `session !== sessionRef.current` check after `getTomlParseError` mitigates this, but if the toast fires for the wrong session's error, it could confuse users.

---

### Story 13.3: HTML to Markdown Converter
**Issues:** 1 High, 2 Medium, 0 Low

#### 🔴 HIGH
1. **`markdownToHtml` has ZERO XSS sanitization** — Unlike `renderMarkdown` in `markdown.ts` (Story 12.5), `markdownToHtml` in `html-markdown.ts` calls `marked()` and returns raw HTML with no sanitization. If the result is ever rendered as HTML (and the component outputs it as a textarea value so it's currently safe), this is a latent vulnerability. However if a future dev uses this function with `dangerouslySetInnerHTML`, it becomes exploitable. (`src/utils/html-markdown.ts:8-12`)

#### 🟡 MEDIUM
2. **Component missing `ToolComponentProps`** — `HtmlToMarkdownConverter` has no `autoOpen`/`onAfterDialogClose` props.
3. **No round-trip test** — Unlike XML and TOML converters, there's no HTML→Markdown→HTML round-trip test.

---

### Story 13.4: Number Base Converter
**Issues:** 1 High, 1 Medium, 1 Low

#### 🔴 HIGH
1. **Output digit lookup limited to base 16 but input validates up to base 36** — `convertBase` uses `'0123456789abcdef'[digit]` (16 chars) for output but `'0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, fromBase)` (36 chars) for input validation. If `toBase > 16`, the output lookup returns `undefined`, producing a string like `"undefinedundefined3"`. The function accepts arbitrary `fromBase`/`toBase` as `number` with no range validation. (`src/utils/number-base.ts:22`)

#### 🟡 MEDIUM
2. **No negative number handling** — `convertBase` doesn't handle negative numbers or signed representations. Entering `-42` throws "Invalid character '-'" which is correct but could be more user-friendly.

#### 🟢 LOW
3. **`_props: ToolComponentProps` unused parameter** — Should destructure needed props or remove parameter entirely.

---

## Epic 14: Crypto & Security Tools

### Story 14.1: HMAC Generator
**Issues:** 0 High, 3 Medium, 1 Low

#### 🟡 MEDIUM
1. **Secret key displayed as `type="text"`** — The secret key input uses `type="text"`, displaying the secret in plain text. Should use `type="password"` with a show/hide toggle for security. (`HmacGenerator.tsx:100`)
2. **Component missing `ToolComponentProps`** — `HmacGenerator` has no `autoOpen`/`onAfterDialogClose` props, same pattern as other converter components.
3. **No test for empty key/message** — AC4 specifies empty state behavior but no test covers `generateHmac('', 'key', ...)` or `generateHmac('msg', '', ...)`.

#### 🟢 LOW
4. **Multiple refs for stale closure avoidance is complex** — `algorithmRef`, `encodingRef`, `messageRef`, `secretKeyRef` — 4 refs tracking state. Could use `useRef` with a single state object or `useLatest` pattern.

---

### Story 14.2: AES Encrypt/Decrypt
**Issues:** 1 High, 2 Medium, 1 Low

#### 🔴 HIGH
1. **No stale async protection** — Unlike `XmlToJsonConverter` and `TomlToJsonConverter` which use `sessionRef` to discard stale results, `AesEncryptDecrypt` has no guard against race conditions. Rapid typing triggers multiple async encrypt/decrypt calls; late-arriving results could overwrite correct newer results. (`AesEncryptDecrypt.tsx:27-52`)

#### 🟡 MEDIUM
2. **Password displayed as `type="text"`** — Same as HMAC: password input uses `type="text"` via FieldForm. Should be masked. (`AesEncryptDecrypt.tsx:102`)
3. **Component missing `ToolComponentProps`** — No `autoOpen`/`onAfterDialogClose` props.

#### 🟢 LOW
4. **`loading` state set but only used for placeholder text** — Could show a spinner or disable inputs during processing.

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 HIGH | 11 |
| 🟡 MEDIUM | 18 |
| 🟢 LOW | 10 |
| **Total** | **39** |

### Common Patterns

1. **Regex-based minification/sanitization is fundamentally fragile** (Stories 12.1, 12.2, 12.3, 12.5) — Regex cannot properly parse HTML, CSS, or JS. These approaches will corrupt valid input in edge cases. Consider using proper parsers or existing minification libraries.

2. **Missing `ToolComponentProps`** (Stories 13.1, 13.2, 13.3, 14.1, 14.2) — 5 components don't implement the standard component interface, breaking `autoOpen` and `onAfterDialogClose` support.

3. **XSS vulnerabilities** (Stories 12.5, 13.3) — Regex-based HTML sanitization misses `javascript:` URLs and exotic SVG/MathML vectors. Should use DOMPurify.

4. **Password/secret inputs shown as plain text** (Stories 14.1, 14.2) — Security-sensitive inputs should be masked by default.

5. **Minimal test coverage** — Most test files have 3-6 tests covering happy paths only, with few edge case or error path tests.
