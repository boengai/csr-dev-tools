---
status: complete
phase: planning
inputDocuments:
  - product-brief-expansion-2026-02-17.md
  - epics.md (original)
  - architecture.md
  - ux-design-specification.md
---

# CSR Dev Tools — Expansion Epics (12–17)

## Overview

21 new tools across 6 epics, expanding CSR Dev Tools from 19 to 40 tools. All tools follow the established BMAD architecture patterns from Epics 1-11.

**Common Dependencies (all stories):**
- Epic 1: TOOL_REGISTRY
- Epic 2: ToolLayout, useToolError, CopyButton, OutputDisplay
- All libraries must be lazy-loaded (code-split) to maintain NFR8

**Common Acceptance Criteria (all stories):**
- Registered in TOOL_REGISTRY with complete metadata (key, name, category, emoji, description, seo, routePath, component)
- Uses ToolLayout wrapper with mode variants (card/page)
- Uses useToolError for inline error handling
- Uses CopyButton/OutputDisplay for output capture
- 100% client-side processing (zero network requests)
- Unit tests covering happy paths, edge cases, error states
- E2E test in `e2e/{tool-key}.spec.ts`
- WCAG 2.1 AA: aria-live on output, aria-label on icon buttons, role="alert" on errors
- Mobile responsive down to 375px viewport

---

## Epic 12: Code & Markup Formatters

Users can format, beautify, and minify code in HTML, CSS, JavaScript, SQL, and preview Markdown — all in the browser.

### Story 12.1: HTML Formatter/Beautifier

As a **user**,
I want **to paste HTML and see it formatted with proper indentation, or minified for production**,
So that **I can clean up messy HTML quickly**.

**Category:** Code | **Emoji:** 📄 | **Key:** `html-formatter`

**Acceptance Criteria:**

**Given** the user pastes valid HTML
**When** the value is entered
**Then** beautified HTML appears in real-time (debounced 300ms) with configurable indent (2/4 spaces or tab)

**Given** a "Minify" toggle is enabled
**When** HTML is entered
**Then** the output is minified (whitespace removed, attributes compressed)

**Given** invalid/malformed HTML
**When** entered
**Then** best-effort formatting is applied (HTML is forgiving) with a warning if tags are unclosed

**Library:** `js-beautify` (HTML beautifier) — lazy-loaded
**Unit tests:** Valid HTML, nested elements, self-closing tags, malformed HTML, empty input, large documents, minify mode

### Story 12.2: CSS Formatter/Minifier

As a **user**,
I want **to paste CSS and see it beautified or minified**,
So that **I can clean up stylesheets or prepare them for production**.

**Category:** Code | **Emoji:** 🎨 | **Key:** `css-formatter`

**Acceptance Criteria:**

**Given** the user pastes valid CSS
**When** the value is entered
**Then** beautified CSS appears with proper indentation and one-property-per-line

**Given** a "Minify" toggle is enabled
**When** CSS is entered
**Then** the output is minified (whitespace/comments removed)

**Given** invalid CSS
**When** entered
**Then** best-effort formatting with inline warning

**Library:** `js-beautify` (CSS beautifier) — lazy-loaded
**Unit tests:** Valid CSS, media queries, nested selectors, variables, minify mode, empty input, large stylesheets

### Story 12.3: JavaScript Minifier

As a **user**,
I want **to paste JavaScript and get a minified version**,
So that **I can quickly reduce JS file size for production**.

**Category:** Code | **Emoji:** ⚡ | **Key:** `javascript-minifier`

**Acceptance Criteria:**

**Given** the user pastes valid JavaScript
**When** the value is entered
**Then** minified JS appears in real-time (debounced 300ms)
**And** original size vs minified size is displayed (e.g., "2.4 KB → 890 B")

**Given** a "Beautify" toggle
**When** enabled
**Then** the output is formatted/beautified instead of minified

**Given** invalid JavaScript (syntax error)
**When** entered
**Then** an inline error shows the parse error location

**Library:** `js-beautify` for beautify, `terser` for minify — lazy-loaded
**Unit tests:** Valid JS, ES modules, arrow functions, async/await, template literals, syntax errors, empty input, size calculation

### Story 12.4: SQL Formatter

As a **user**,
I want **to paste SQL and see it formatted with proper indentation and keyword highlighting**,
So that **I can make complex queries readable**.

**Category:** Code | **Emoji:** 🗄️ | **Key:** `sql-formatter`

**Acceptance Criteria:**

**Given** the user pastes a SQL query
**When** the value is entered
**Then** formatted SQL appears with uppercase keywords, proper indentation, and one clause per line

**Given** dialect selection
**When** the user picks a dialect (Standard SQL, PostgreSQL, MySQL, SQLite, BigQuery)
**Then** formatting adapts to dialect-specific syntax

**Given** a configurable indent option
**When** changed (2/4 spaces or tab)
**Then** formatting updates accordingly

**Library:** `sql-formatter` — lazy-loaded
**Unit tests:** Simple SELECT, JOINs, subqueries, CTEs, INSERT/UPDATE/DELETE, dialect differences, empty input, invalid SQL

### Story 12.5: Markdown Preview

As a **user**,
I want **to write Markdown and see a live HTML preview side-by-side**,
So that **I can author READMEs and docs with instant feedback**.

**Category:** Code | **Emoji:** 📝 | **Key:** `markdown-preview`

**Acceptance Criteria:**

**Given** the user types Markdown in the left panel
**When** content changes
**Then** rendered HTML preview appears in the right panel in real-time (debounced 300ms)

**Given** the preview panel
**When** it renders
**Then** it supports: headings, bold/italic, links, images, code blocks (with syntax highlighting), tables, lists, blockquotes, horizontal rules

**Given** a "Copy HTML" button
**When** clicked
**Then** the rendered HTML source is copied to clipboard

**Given** mobile viewport
**When** < 768px
**Then** panels stack vertically (editor on top, preview below)

**Library:** `marked` + `highlight.js` (for code blocks) — lazy-loaded
**Unit tests:** All markdown elements, GFM (GitHub Flavored Markdown), XSS prevention (sanitized output), empty input, large documents

---

## Epic 13: Data & Number Converters

Users can convert between XML/JSON, TOML/JSON, HTML/Markdown, and number bases.

### Story 13.1: XML ↔ JSON Converter

As a **user**,
I want **to convert between XML and JSON formats**,
So that **I can transform data between these common formats for APIs and configuration files**.

**Category:** Data | **Emoji:** 📋 | **Key:** `xml-to-json-converter`

**Acceptance Criteria:**

**Given** tabs for XML→JSON and JSON→XML modes
**When** the user pastes valid XML in XML→JSON mode
**Then** the JSON equivalent appears in real-time (debounced 300ms)

**Given** JSON→XML mode
**When** the user pastes valid JSON
**Then** formatted XML output appears

**Given** invalid input in either mode
**When** parsing fails
**Then** an inline error describes the issue with line number if available

**Library:** `fast-xml-parser` — lazy-loaded
**Unit tests:** Simple elements, attributes, nested structures, arrays, CDATA, namespaces, empty elements, invalid XML/JSON

### Story 13.2: TOML ↔ JSON Converter

As a **user**,
I want **to convert between TOML and JSON formats**,
So that **I can work with Rust/Go config files and transform them to JSON and back**.

**Category:** Data | **Emoji:** ⚙️ | **Key:** `toml-to-json-converter`

**Acceptance Criteria:**

**Given** tabs for TOML→JSON and JSON→TOML modes
**When** the user pastes valid TOML
**Then** formatted JSON appears in real-time

**Given** JSON→TOML mode
**When** the user pastes valid JSON
**Then** TOML output appears

**Given** invalid input
**When** parsing fails
**Then** an inline error describes the issue

**Library:** `@iarna/toml` or `smol-toml` — lazy-loaded
**Unit tests:** Basic key-value, tables, arrays, nested tables, inline tables, dates, multiline strings, invalid input

### Story 13.3: HTML ↔ Markdown Converter

As a **user**,
I want **to convert HTML to Markdown and Markdown to HTML**,
So that **I can transform content between these formats for documentation and web publishing**.

**Category:** Data | **Emoji:** 🔄 | **Key:** `html-to-markdown-converter`

**Acceptance Criteria:**

**Given** tabs for HTML→Markdown and Markdown→HTML modes
**When** the user pastes valid HTML
**Then** Markdown equivalent appears in real-time

**Given** Markdown→HTML mode
**When** Markdown is entered
**Then** HTML output appears

**Given** complex HTML (tables, images, links)
**When** converted to Markdown
**Then** GFM table syntax and standard markdown elements are used

**Library:** `turndown` (HTML→MD), `marked` (MD→HTML) — lazy-loaded
**Unit tests:** Headings, paragraphs, links, images, tables, lists, code blocks, inline styles (stripped), empty input, malformed HTML

### Story 13.4: Number Base Converter

As a **user**,
I want **to convert numbers between binary, octal, decimal, and hexadecimal**,
So that **I can quickly work with different number representations for low-level programming**.

**Category:** Encoding | **Emoji:** 🔢 | **Key:** `number-base-converter`

**Acceptance Criteria:**

**Given** four input fields (Binary, Octal, Decimal, Hex)
**When** the user types in any field
**Then** all other fields update in real-time with the converted values

**Given** the user enters an invalid value for the selected base
**When** validation fails
**Then** an inline error appears (e.g., "Binary only allows 0 and 1")

**Given** large numbers
**When** entered
**Then** BigInt is used for precision beyond Number.MAX_SAFE_INTEGER

**Library:** None — native JavaScript parseInt/toString + BigInt
**Unit tests:** All base conversions, zero, negative (two's complement display), large numbers, invalid characters, empty input, max safe integer boundary

---

## Epic 14: Crypto & Security Tools

Users can generate HMAC signatures and perform AES encryption/decryption — all client-side.

### Story 14.1: HMAC Generator

As a **user**,
I want **to generate HMAC signatures from a message and secret key**,
So that **I can verify API signatures and test webhook authentication locally**.

**Category:** Generator | **Emoji:** 🔏 | **Key:** `hmac-generator`

**Acceptance Criteria:**

**Given** inputs for message text, secret key, and algorithm selection (SHA-256, SHA-384, SHA-512)
**When** both message and key are provided
**Then** the HMAC signature appears in real-time (debounced 300ms) in hex encoding
**And** a toggle for hex/base64 output encoding is available

**Given** the output
**When** displayed
**Then** a CopyButton copies the HMAC value

**Given** empty key or message
**When** either is missing
**Then** output shows "—" (empty state)

**Library:** Web Crypto API (`crypto.subtle.importKey` + `crypto.subtle.sign`) — no external deps
**Unit tests:** Known HMAC test vectors (RFC 4231), all algorithms, empty inputs, Unicode key/message, hex vs base64 encoding

### Story 14.2: AES Encrypt/Decrypt

As a **user**,
I want **to encrypt and decrypt text using AES with a password**,
So that **I can quickly protect sensitive data without installing encryption tools**.

**Category:** Generator | **Emoji:** 🔐 | **Key:** `aes-encrypt-decrypt`

**Acceptance Criteria:**

**Given** tabs for Encrypt and Decrypt modes
**When** the user enters plaintext and a password in Encrypt mode
**Then** the AES-GCM encrypted output appears as a Base64 string (includes IV + ciphertext)

**Given** Decrypt mode
**When** the user pastes the encrypted Base64 string and the correct password
**Then** the original plaintext appears

**Given** a wrong password in Decrypt mode
**When** decryption fails
**Then** an inline error: "Decryption failed — incorrect password or corrupted data"

**Given** the encryption process
**When** it runs
**Then** it uses PBKDF2 for key derivation (100K iterations, random salt) and AES-256-GCM for encryption
**And** output format: Base64(salt + iv + ciphertext + authTag)

**Library:** Web Crypto API — no external deps
**Unit tests:** Encrypt/decrypt roundtrip, wrong password, empty input, Unicode text, large text, output format validation

---

## Epic 15: CSS & Design Tools

Users can visually create CSS gradients, explore flexbox layouts, and view/optimize SVGs.

### Story 15.1: CSS Gradient Generator

As a **user**,
I want **to visually build CSS gradients with multiple color stops and see a live preview**,
So that **I can design beautiful gradients and copy the CSS directly**.

**Category:** CSS | **Emoji:** 🌈 | **Key:** `css-gradient-generator`

**Acceptance Criteria:**

**Given** the gradient builder interface
**When** the user interacts with it
**Then** they can configure: gradient type (linear/radial), angle (for linear), color stops (add/remove/reposition), and each stop's color + position

**Given** any input change
**When** the user adjusts controls
**Then** the live preview updates in real-time
**And** the CSS output updates (e.g., `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)

**Given** the color stops
**When** the user interacts
**Then** they can add new stops (click on gradient bar), remove stops (min 2), drag to reposition, and pick color via color input

**Given** the CSS output
**When** CopyButton is clicked
**Then** the complete CSS property is copied (with vendor prefixes option)

**Library:** None — native CSS + DOM manipulation
**Unit tests:** CSS string generation, linear angles, radial shapes, multiple stops, color formats, vendor prefix output

### Story 15.2: CSS Flexbox Playground

As a **user**,
I want **to visually configure CSS flexbox properties and see the layout result**,
So that **I can learn and experiment with flexbox without writing code**.

**Category:** CSS | **Emoji:** 📐 | **Key:** `css-flexbox-playground`

**Acceptance Criteria:**

**Given** the flexbox playground
**When** the user views the interface
**Then** they see: a visual container with child items, and controls for container properties (flex-direction, justify-content, align-items, flex-wrap, gap)

**Given** the child items
**When** the user interacts
**Then** they can add/remove items (3-10) and configure per-item properties (flex-grow, flex-shrink, flex-basis, align-self, order)

**Given** any property change
**When** the user adjusts a control
**Then** the visual layout updates in real-time
**And** the CSS output for both container and items updates

**Given** the CSS output
**When** CopyButton is clicked
**Then** the complete CSS for the flexbox layout is copied

**Library:** None — native CSS + DOM
**Unit tests:** CSS generation for all property combinations, item count limits, reset behavior

### Story 15.3: SVG Viewer/Optimizer

As a **user**,
I want **to paste SVG code, see a live preview, and optimize the SVG**,
So that **I can inspect, debug, and reduce SVG file size**.

**Category:** Image | **Emoji:** 🖼️ | **Key:** `svg-viewer`

**Acceptance Criteria:**

**Given** the user pastes SVG code
**When** valid SVG is entered
**Then** a live preview renders the SVG
**And** file size is displayed

**Given** an "Optimize" button
**When** clicked
**Then** the SVG is optimized (remove metadata, comments, unnecessary attributes)
**And** original vs optimized size is shown (e.g., "4.2 KB → 2.1 KB (50% reduction)")

**Given** the optimized SVG
**When** CopyButton is clicked
**Then** the optimized SVG code is copied

**Given** invalid SVG
**When** entered
**Then** an inline error with description

**Library:** `svgo` (browser build) — lazy-loaded
**Unit tests:** Valid SVG rendering, optimization size reduction, invalid SVG handling, empty input, complex SVGs with metadata

---

## Epic 16: Text Utilities

Users can transform text case, count words/characters, generate lorem ipsum, and escape/unescape strings.

### Story 16.1: Text Case Converter

As a **user**,
I want **to convert text between different case formats**,
So that **I can quickly transform variable names and text for different coding conventions**.

**Category:** Text | **Emoji:** 🔤 | **Key:** `text-case-converter`

**Acceptance Criteria:**

**Given** the user enters text
**When** content is provided
**Then** all case conversions display simultaneously:
- camelCase
- PascalCase
- snake_case
- kebab-case
- CONSTANT_CASE
- Title Case
- UPPER CASE
- lower case
- Sentence case
- dot.case
- path/case

**Given** each output
**When** displayed
**Then** each has its own CopyButton

**Given** multi-word or mixed-case input
**When** entered
**Then** the converter intelligently splits on spaces, underscores, hyphens, and camelCase boundaries

**Library:** None — native JavaScript string manipulation
**Unit tests:** All case conversions, multi-word, single word, already-cased input, special characters, numbers, empty input, Unicode

### Story 16.2: Word/Character Counter

As a **user**,
I want **to paste text and see word count, character count, sentence count, paragraph count, and estimated reading time**,
So that **I can check text length for various requirements (tweets, blog posts, essays)**.

**Category:** Text | **Emoji:** 📊 | **Key:** `word-counter`

**Acceptance Criteria:**

**Given** the user enters text
**When** content changes
**Then** the following stats update in real-time:
- Characters (with and without spaces)
- Words
- Sentences
- Paragraphs
- Lines
- Reading time (avg 200 wpm)
- Speaking time (avg 130 wpm)

**Given** the stats display
**When** rendered
**Then** stats are shown in a clean grid/card layout using OutputDisplay variant: table

**Given** empty input
**When** nothing is entered
**Then** all stats show 0

**Library:** None — native JavaScript
**Unit tests:** Standard text, empty input, whitespace-only, single word, punctuation-heavy, Unicode, very long text

### Story 16.3: Lorem Ipsum Generator

As a **user**,
I want **to generate placeholder text with configurable length**,
So that **I can quickly get dummy content for designs and prototypes**.

**Category:** Text | **Emoji:** 📜 | **Key:** `lorem-ipsum-generator`

**Acceptance Criteria:**

**Given** the generator interface
**When** the user configures options
**Then** they can select: unit (paragraphs, sentences, words), count (1-100), and "Start with Lorem ipsum..." toggle

**Given** the user clicks "Generate" or adjusts a setting
**When** generation runs
**Then** the lorem ipsum text appears in the output
**And** a CopyButton copies the full text

**Given** paragraph mode
**When** generated
**Then** paragraphs are separated by blank lines and vary in length (3-7 sentences)

**Library:** None — embedded lorem ipsum word list (~200 words), shuffled for variety
**Unit tests:** Word count accuracy, paragraph count, sentence count, "Lorem ipsum" start toggle, empty/zero count edge case

### Story 16.4: String Escape/Unescape

As a **user**,
I want **to escape and unescape strings for different contexts (HTML, JavaScript, URL, JSON)**,
So that **I can safely embed content in different contexts**.

**Category:** Text | **Emoji:** 🔡 | **Key:** `string-escape-unescape`

**Acceptance Criteria:**

**Given** the tool interface
**When** the user selects an escape mode
**Then** modes available: HTML entities, JavaScript string, JSON string, URL encoding, XML entities, CSV

**Given** the user enters text in the input
**When** the value changes
**Then** escaped/unescaped output appears in real-time (debounced 300ms) based on selected mode and direction (escape/unescape)

**Given** HTML entities mode
**When** escaping `<script>alert("XSS")</script>`
**Then** output: `&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;`

**Library:** None — native JavaScript string manipulation
**Unit tests:** All escape modes (HTML, JS, JSON, URL, XML, CSV), roundtrip (escape then unescape), special characters, Unicode, empty input

---

## Epic 17: Image & Media Tools

Users can generate QR codes and convert between images and Base64 data URIs.

### Story 17.1: QR Code Generator

As a **user**,
I want **to generate QR codes from text or URLs and download them as images**,
So that **I can create QR codes for links, contact info, or any text without using external services**.

**Category:** Generator | **Emoji:** 📱 | **Key:** `qr-code-generator`

**Acceptance Criteria:**

**Given** the user enters text or a URL
**When** content is provided
**Then** a QR code is generated and displayed as a live preview in real-time (debounced 300ms)

**Given** configuration options
**When** the user adjusts them
**Then** they can configure: size (128-512px), error correction level (L/M/Q/H), foreground color, background color

**Given** the generated QR code
**When** the user clicks "Download"
**Then** the QR code downloads as PNG
**And** a "Copy as SVG" option copies SVG markup

**Given** empty input
**When** nothing is entered
**Then** no QR code is displayed (empty state)

**Library:** `qrcode` (npm) — lazy-loaded
**Unit tests:** Text encoding, URL encoding, size options, error correction levels, color customization, empty input, very long text (QR capacity limits)

### Story 17.2: Image to Base64

As a **user**,
I want **to upload an image and get the Base64 data URI**,
So that **I can embed images directly in HTML, CSS, or JSON without external files**.

**Category:** Image | **Emoji:** 🖼️ | **Key:** `image-to-base64`

**Acceptance Criteria:**

**Given** the user uploads an image (drag-and-drop or file picker)
**When** the file is loaded
**Then** the Base64 data URI is displayed in the output
**And** file info is shown: filename, dimensions, original size, Base64 string length

**Given** the output display
**When** rendered
**Then** three copyable outputs are available:
- Full data URI (`data:image/png;base64,...`)
- Base64 string only (no data URI prefix)
- HTML `<img>` tag with embedded data URI

**Given** a non-image file
**When** uploaded
**Then** an inline error: "Please upload an image file (PNG, JPG, WebP, GIF, BMP, SVG)"

**Library:** Native FileReader API
**Unit tests:** PNG, JPG, WebP, GIF, SVG conversion, data URI format, large files, invalid files, MIME type detection

### Story 17.3: Base64 to Image

As a **user**,
I want **to paste a Base64 string or data URI and see/download the image**,
So that **I can quickly preview and extract images from Base64-encoded data**.

**Category:** Image | **Emoji:** 🖼️ | **Key:** `base64-to-image`

**Acceptance Criteria:**

**Given** the user pastes a Base64 data URI or raw Base64 string
**When** the value is entered
**Then** the decoded image is displayed as a preview
**And** image info is shown: dimensions, format, estimated file size

**Given** the preview
**When** the user clicks "Download"
**Then** the image downloads with auto-detected format and filename `decoded-image.{ext}`

**Given** an invalid Base64 string
**When** decoding fails
**Then** an inline error: "Enter a valid Base64-encoded image (starts with data:image/ or is a valid Base64 string)"

**Given** raw Base64 without data URI prefix
**When** entered
**Then** the tool attempts to detect the image format from the magic bytes and renders accordingly

**Library:** Native Canvas API + FileReader
**Unit tests:** Data URI parsing, raw Base64 decoding, format detection, invalid input, large images, various image formats

---

## Implementation Priority

| Epic | Priority | Effort | Impact |
|------|----------|--------|--------|
| Epic 16: Text Utilities | 🥇 High | Low | High traffic, easy wins |
| Epic 17: Image & Media | 🥇 High | Medium | QR codes = massive SEO |
| Epic 13: Data Converters | 🥈 Medium | Medium | Completes the data story |
| Epic 12: Code Formatters | 🥈 Medium | Medium | High search volume |
| Epic 15: CSS & Design | 🥈 Medium | Medium-High | Visual, differentiating |
| Epic 14: Crypto Tools | 🥉 Lower | Medium | Niche but valuable |

## Recommended Implementation Order

1. Epic 16 (Text Utilities) — fastest to build, no external deps
2. Epic 17 (Image & Media) — high impact, one small library
3. Epic 13 (Data Converters) — natural extension of existing data tools
4. Epic 12 (Code Formatters) — high demand, several libraries
5. Epic 15 (CSS & Design) — visual tools, more complex UI
6. Epic 14 (Crypto Tools) — Web Crypto API, no external deps
