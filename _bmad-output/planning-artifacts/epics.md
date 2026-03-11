---
status: complete
reorganization: true
previousEpics: "5-27 (scattered by batch)"
newEpics: "5-16 (1 epic = 1 category)"
date: 2026-03-11
---

# CSR Dev Tools — Reorganized Epic Breakdown

## Reorganization Summary

Epics 5-27 have been consolidated into Epics 5-16, organized by ToolCategory. Each epic now maps 1:1 to a tool category in the codebase. This makes it straightforward to add new tools: find the category epic, add a story.

**Epics 1-4 remain unchanged:**
- Epic 1: Platform Navigation & Tool Discovery (foundation)
- Epic 2: Standardized Tool Experience (foundation)
- Epic 3: Existing Tool Baseline & Enhancement (foundation)
- Epic 4: Quality Infrastructure & Contributor Experience (foundation)

---

## Requirements Inventory

### Functional Requirements (Original)

FR1: Users can process any supported conversion/transformation entirely in the browser without server communication
FR2: Users can upload files (images, text) from their device for processing
FR3: Users can download or copy processed output to their clipboard or device
FR4: Users can see processing results within 500ms without page reload
FR5: Users can convert colors between HEX, RGB, and HSL formats
FR6: Users can input colors via text input or visual color picker
FR7: Users can copy converted color values to clipboard
FR8: Users can encode and decode Base64 strings
FR9: Users can encode and decode URLs
FR10: Users can decode JWT tokens to view header and payload
FR11: Users can convert images between PNG, JPG, WebP, GIF, BMP, and AVIF formats (where browser-supported)
FR12: Users can resize images with custom width and height dimensions
FR13: Users can compress JPEG and WebP images using a quality slider (1-100) and see the resulting file size before downloading
FR14: Users can crop images using freeform selection or common aspect ratio presets (16:9, 4:3, 1:1, 3:2)
FR15: Users can convert between Unix timestamps and human-readable dates
FR16: Users can convert between PX and REM units with configurable base font size
FR17: Users can format and validate JSON with syntax highlighting
FR18: Users can convert between JSON and YAML formats
FR19: Users can convert between JSON and CSV formats
FR20: Users can compare two text inputs and see line-by-line differences highlighted
FR21: Users can test regular expressions against sample text with live match highlighting
FR22: Users can generate UUIDs (single or bulk)
FR23: Users can generate random passwords with configurable length (8-128 characters) and toggle inclusion of uppercase, lowercase, digits, and symbols
FR24: Users can generate hash values (MD5, SHA-1, SHA-256, SHA-512) from text input
FR25: Users can visually generate CSS box-shadow values with live preview
FR26: Users can browse all available tools from a central dashboard
FR27: Users can navigate directly to any tool via unique URL
FR28: Users can search or filter tools by name or category
FR29: Users can access any tool on mobile devices down to 375px viewport width with touch-friendly layout
FR30: Users can customize their dashboard layout via drag-and-drop
FR31: Users can have their layout preferences persist across sessions
~~FR32: Users can switch between light and dark themes~~ — **NOT PLANNED:** Dark-only theme
FR33: Contributors can add a new tool by following the CONTRIBUTING guide, which documents the required file structure (component, route, constants, tests) and a PR checklist
FR34: Contributors can run the development environment locally with standard tooling
FR35: Contributors can run tests to validate their changes against existing tool regression stories
FR36: Developers can reference a documented feature spec for each existing tool covering inputs, outputs, supported formats, and edge cases
FR37: Developers can run regression test stories for each existing tool covering happy paths, edge cases, and error states
FR38: Users can see a one-line tool description and placeholder text or tooltips on each input field explaining accepted formats and values

### Functional Requirements (Expansion 3)

FR-E3-01: YAML Formatting & Validation
FR-E3-02: ENV File Conversion
FR-E3-03: Escaped JSON Stringification
FR-E3-04: HTML Entity Encoding/Decoding
FR-E3-05: Aspect Ratio Calculation
FR-E3-06: Color Palette Generation
FR-E3-07: Placeholder Image Generation
FR-E3-08: Data URI Generation
FR-E3-09: SSH Key Fingerprint Viewing
FR-E3-10: X.509 Certificate Decoding
FR-E3-11: Bcrypt Hashing & Verification
FR-E3-12: Chmod Permission Calculation
FR-E3-13: RSA Key Pair Generation
FR-E3-14: GraphQL Schema Viewing
FR-E3-15: Protobuf to JSON Conversion
FR-E3-16: TypeScript Playground
FR-E3-17: JSON Path Evaluation
FR-E3-18: Timezone Conversion
FR-E3-19: Mermaid Diagram Rendering
FR-E3-20: IP/Subnet Calculation

### Non-Functional Requirements

NFR1: Tool processing operations (color conversion, encoding, unit conversion) complete in under 100ms as measured by browser Performance API timing
NFR2: Image processing operations (resize, convert, compress) complete in under 3 seconds for files up to 10MB as measured by automated benchmark tests
NFR3: First Contentful Paint under 1.5 seconds on a 10 Mbps connection
NFR4: Largest Contentful Paint under 2.5 seconds
NFR5: Total Blocking Time under 200ms
NFR6: Cumulative Layout Shift under 0.1
NFR7: Lighthouse Performance score of 90+
NFR8: Adding new tools does not increase initial page load time
NFR9: Zero network requests for tool processing — all operations execute in the browser
NFR10: No cookies, localStorage tracking, or analytics scripts
NFR11: No third-party scripts that transmit user data
NFR12: File uploads are never persisted beyond the browser session and no upload data is transmitted externally
NFR13: All dependencies audited for known vulnerabilities via automated tooling
NFR14: WCAG 2.1 AA compliance across all tools and platform pages
NFR15: All interactive elements operable via keyboard alone
NFR16: Color contrast ratios meet AA minimums (4.5:1 text, 3:1 large text)
NFR17: Screen reader compatibility for all tool inputs, outputs, and error states
NFR18: Lighthouse Accessibility score of 90+
NFR19: Tool output correctness verified by automated regression tests
NFR20: All existing tools maintain 100% regression test pass rate before any release
NFR21: Application functions offline after initial load
NFR22: No runtime errors on supported browsers (Chrome, Firefox, Safari, Edge latest 2)
NFR23: Lighthouse SEO score of 90+
NFR24: Each tool page has unique title, meta description, and Open Graph tags
NFR25: Semantic HTML with proper heading hierarchy on all pages

New (Expansion 3):
- NFR-E3-01: Monaco Editor lazy-load with loading skeleton
- NFR-E3-02: Mermaid library lazy-load with loading skeleton
- NFR-E3-03: RSA 4096-bit generation progress indicator
- NFR-E3-04: Bcrypt hashing progress/elapsed time indicator

---

## Common Dependencies (all tool stories)

- Epic 1: TOOL_REGISTRY, route constants, RoutePath typing
- Epic 2: CopyButton
- Established patterns: per-tool layout, CopyButton
- All libraries must be lazy-loaded (code-split) to maintain NFR8

## Common Acceptance Criteria (all tool stories)

- Registered in TOOL_REGISTRY with complete metadata (key, name, category, emoji, description, seo, routePath, component)
- Uses inline error handling
- Uses CopyButton for output copying
- 100% client-side processing (zero network requests)
- Unit tests covering happy paths, edge cases, error states
- E2E test in `e2e/{tool-key}.spec.ts`
- WCAG 2.1 AA: aria-live on output, aria-label on icon buttons, role="alert" on errors
- Mobile responsive down to 375px viewport
- TypeScript strict mode, oxlint/oxfmt compliant
- Lazy-loaded route via lazyRouteComponent

---

## Epic 5: Encoding Tools

**Category:** Encoding | **Tools:** 5

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 5.1 | Base64 Encoder | base64-encoder | 🔤 | Baseline (Epic 3) |
| 5.2 | JWT Decoder | jwt-decoder | 🔑 | Old 5.2 |
| 5.3 | Number Base Converter | number-base-converter | 🔢 | Old 13.4 |
| 5.4 | URL Encoder/Decoder | url-encoder-decoder | 🔗 | Old 5.1 |
| 5.5 | URL Parser | url-parser | 🌐 | Old 19.2 |

### Story 5.1: Base64 Encoder/Decoder

> **Note:** This was a baseline tool (old Epic 3, Story 3.2) with its own refactor spec.

As a **user**,
I want **the Base64 tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably encode and decode Base64 strings with a consistent interface**.

**Category:** Encoding | **Emoji:** 🔤 | **Key:** `base64-encoder`

**Acceptance Criteria:**

**Given** the existing `EncodingBase64` component
**When** it is refactored
**Then** it uses `CopyButton` for output copying
**And** it is registered in `TOOL_REGISTRY`

**Given** a user pastes text into the encode input
**When** the value is entered
**Then** the Base64-encoded output appears in real-time (debounced 300ms)

**Given** a user pastes a Base64 string into the decode input
**When** the value is entered
**Then** the decoded plaintext appears in real-time

**Given** a user pastes an invalid Base64 string for decoding
**When** validation fails
**Then** an inline error appears: "Enter a valid Base64 string (e.g., SGVsbG8=)"

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: standard encoding, Unicode handling, empty input, whitespace handling, invalid decode input, and large string performance

### Story 5.2: JWT Decoder

As a **user**,
I want **to paste a JWT token and see the decoded header and payload**,
So that **I can quickly inspect token contents for debugging without using an external service**.

**Category:** Encoding | **Emoji:** 🔑 | **Key:** `jwt-decoder`

**Acceptance Criteria:**

**Given** the JWT Decoder tool registered in `TOOL_REGISTRY` under the Encoding category
**When** the user navigates to it
**Then** it renders with a single text input for the JWT token

**Given** a user pastes a valid JWT token (3 Base64URL-encoded segments separated by dots)
**When** the value is entered
**Then** the decoded header and payload are displayed as formatted JSON in separate sections
**And** each section has a `CopyButton`
**And** the signature section is shown but noted as "not verified" (client-side only, no secret)

**Given** the decoded payload contains standard claims
**When** the output renders
**Then** `exp` (expiration) and `iat` (issued at) timestamps are shown with human-readable date equivalents alongside the raw values

**Given** a user pastes an invalid JWT (wrong format, not 3 segments, invalid Base64URL)
**When** validation fails
**Then** an inline error appears: "Enter a valid JWT token (e.g., eyJhbG...)"

**Given** the tool implementation
**When** it processes a token
**Then** zero network requests are made — decoding is entirely client-side (Base64URL decode, JSON parse)
**And** unit tests cover: valid tokens, expired tokens, tokens with various claims, invalid formats, and malformed segments

### Story 5.3: Number Base Converter

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

### Story 5.4: URL Encoder/Decoder

As a **user**,
I want **to encode and decode URL strings in the browser**,
So that **I can quickly prepare or inspect URL-encoded values for web development**.

**Category:** Encoding | **Emoji:** 🔗 | **Key:** `url-encoder-decoder`

**Acceptance Criteria:**

**Given** the URL Encoder/Decoder tool registered in `TOOL_REGISTRY` under the Encoding category
**When** the user navigates to it
**Then** it renders with encode and decode modes (tabs or toggle)

**Given** a user pastes a plain string into the encode input (e.g., `hello world&foo=bar`)
**When** the value is entered
**Then** the URL-encoded output appears in real-time (debounced 300ms): `hello%20world%26foo%3Dbar`
**And** a `CopyButton` is adjacent to the output

**Given** a user pastes a URL-encoded string into the decode input
**When** the value is entered
**Then** the decoded plaintext appears in real-time

**Given** an invalid encoded string (e.g., `%ZZ`)
**When** decoding fails
**Then** an inline error appears: "Enter a valid URL-encoded string (e.g., hello%20world)"

**Given** the tool component
**When** it is implemented
**Then** it uses shared validation (`isValidUrl`), and all processing is 100% client-side
**And** unit tests cover: standard encoding, special characters, Unicode, empty input, already-encoded input, and double-encoding edge cases

### Story 5.5: URL Parser

As a **user**,
I want **to paste a URL and see it broken down into protocol, host, port, path, query parameters, and fragment**,
So that **I can inspect and debug URLs quickly**.

**Category:** Encoding | **Emoji:** 🌐 | **Key:** `url-parser`

**Acceptance Criteria:**

**Given** the user pastes a valid URL
**When** the value is entered
**Then** the URL is broken down into: protocol, host, port, path, query parameters (as key-value pairs), and fragment
**And** each component has a `CopyButton`

**Given** an invalid URL
**When** entered
**Then** an inline error appears with a description of the issue

**Given** the tool implementation
**When** it parses URLs
**Then** it uses the native `URL` API — no server calls
**And** unit tests cover: complete URLs, relative URLs, URLs with ports, query strings, fragments, special characters, and edge cases

---

## Epic 6: Data Tools

**Category:** Data | **Tools:** 14

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 6.1 | Data URI Generator | data-uri-generator | 📎 | Old 23.4 |
| 6.2 | DB Diagram | db-diagram | 🗄️ | Old 27 |
| 6.3 | ENV File Converter | env-file-converter | 📋 | Old 22.2 |
| 6.4 | Escaped JSON Stringifier | escaped-json-stringifier | 🪢 | Old 22.3 |
| 6.5 | HTML Entity Converter | html-entity-converter | 🏷️ | Old 22.4 |
| 6.6 | HTML to Markdown Converter | html-to-markdown-converter | 📝 | Old 13.3 |
| 6.7 | HTTP Status Codes | http-status-codes | 📡 | Old 19.4 |
| 6.8 | JSON Formatter | json-formatter | 📋 | Old 6.1 |
| 6.9 | JSON to CSV Converter | json-to-csv-converter | 📊 | Old 6.3 |
| 6.10 | JSON to TOML Converter | json-to-toml-converter | ⚙️ | Old 13.2 |
| 6.11 | JSON to XML Converter | json-to-xml-converter | 📄 | Old 13.1 |
| 6.12 | JSON to YAML Converter | json-to-yaml-converter | 🔄 | Old 6.2 |
| 6.13 | OG Preview | og-preview | 👁️ | Old 20.4 |
| 6.14 | YAML Formatter | yaml-formatter | 📝 | Old 22.1 |

### Story 6.1: Data URI Generator

As a **developer**,
I want **to convert files to data URIs and decode data URIs back to files**,
So that **I can embed small assets directly in HTML/CSS without extra HTTP requests**.

**Category:** Data | **Emoji:** 📎 | **Key:** `data-uri-generator`

**Acceptance Criteria:**

**Given** the user uploads a file (image, font, SVG, etc.)
**When** the file is loaded
**Then** a data URI is generated with correct MIME type and Base64 encoding, and file size is displayed

**Given** the user pastes a data URI
**When** "Decode" mode is active
**Then** the MIME type, encoding, and decoded size are shown, with a preview for images

**Given** an image file is uploaded
**When** the data URI is generated
**Then** both the data URI and an HTML `<img>` tag example are shown

**Given** a CSS-compatible file (image, font)
**When** the data URI is generated
**Then** a CSS `url()` example is also shown

**Given** a file larger than 30KB
**When** uploaded
**Then** a warning suggests using a regular file reference instead of data URI for performance

### Story 6.2: DB Diagram

As a **developer**,
I want **to define database schemas and see them rendered as entity-relationship diagrams**,
So that **I can visualize and document database structures**.

**Category:** Data | **Emoji:** 🗄️ | **Key:** `db-diagram`

**Acceptance Criteria:**

> Note: This tool was referenced as Epic 27 in the original planning but no detailed ACs were written. ACs to be defined during implementation planning.

**Given** the user enters a database schema definition
**When** the schema is parsed
**Then** an ER diagram is rendered showing tables, columns, and relationships

**Given** the rendered diagram
**When** the user clicks "Export"
**Then** the diagram can be downloaded as SVG or PNG

### Story 6.3: ENV File Converter

As a **developer**,
I want **to convert between .env format and JSON/YAML formats**,
So that **I can quickly transform configuration between different file formats**.

**Category:** Data | **Emoji:** 📋 | **Key:** `env-file-converter`

**Acceptance Criteria:**

**Given** the user pastes a .env file (KEY=value format)
**When** the user selects "To JSON" output format
**Then** a JSON object is generated with keys and values, handling quoted values and comments

**Given** the user pastes a .env file
**When** the user selects "To YAML" output format
**Then** equivalent YAML is generated

**Given** the user pastes JSON or YAML
**When** the user selects "To .env" output format
**Then** a .env file is generated with KEY=value pairs, quoting values with spaces/special chars

**Given** the .env input contains comments (lines starting with #)
**When** converted to JSON/YAML
**Then** comments are stripped (with a note that comments cannot be preserved)

**Given** the .env input contains empty lines or malformed lines
**When** converted
**Then** empty lines are skipped and malformed lines show a warning

### Story 6.4: Escaped JSON Stringifier

As a **developer**,
I want **to escape JSON for embedding in strings (e.g., in code or config files) and unescape them back**,
So that **I can safely embed JSON in contexts that require string escaping**.

**Category:** Data | **Emoji:** 🪢 | **Key:** `escaped-json-stringifier`

**Acceptance Criteria:**

**Given** the user pastes valid JSON
**When** "Stringify" mode is active
**Then** the JSON is escaped as a string (quotes escaped, newlines as \n, etc.)

**Given** the user pastes an escaped JSON string
**When** "Parse" mode is active
**Then** the original JSON is reconstructed and pretty-printed

**Given** invalid input in either mode
**When** entered
**Then** a clear error message explains the issue

**Given** the user toggles "Double Escape"
**When** JSON is entered in Stringify mode
**Then** the output is double-escaped (for embedding in JSON within JSON)

### Story 6.5: HTML Entity Converter

As a **developer**,
I want **to encode text into HTML entities and decode HTML entities back to text**,
So that **I can safely handle special characters in HTML content**.

**Category:** Data | **Emoji:** 🏷️ | **Key:** `html-entity-converter`

**Acceptance Criteria:**

**Given** the user pastes plain text with special characters (<, >, &, ", ')
**When** "Encode" mode is active
**Then** characters are converted to HTML entities (&lt;, &gt;, &amp;, &quot;, &#39;)

**Given** the user pastes text with HTML entities
**When** "Decode" mode is active
**Then** entities are converted back to their character equivalents

**Given** the user selects "Named Entities" option
**When** encoding
**Then** named entities are used where available (e.g., &copy; instead of &#169;)

**Given** the user selects "Numeric Entities" option
**When** encoding
**Then** all entities use numeric format (&#60; instead of &lt;)

### Story 6.6: HTML to Markdown Converter

As a **user**,
I want **to convert HTML to Markdown and Markdown to HTML**,
So that **I can transform content between these formats for documentation and web publishing**.

**Category:** Data | **Emoji:** 📝 | **Key:** `html-to-markdown-converter`

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

### Story 6.7: HTTP Status Codes

As a **user**,
I want **to search and browse HTTP status codes with descriptions and common use cases**,
So that **I can quickly look up what a status code means**.

**Category:** Data | **Emoji:** 📡 | **Key:** `http-status-codes`

**Acceptance Criteria:**

**Given** the user navigates to the HTTP Status Codes tool
**When** the page loads
**Then** all HTTP status codes are displayed grouped by category (1xx, 2xx, 3xx, 4xx, 5xx) with name and description

**Given** a search input
**When** the user types a code number or keyword
**Then** results are filtered in real-time

**Given** each status code entry
**When** displayed
**Then** it shows: code number, name, description, and common use cases

**Library:** None — static embedded data
**Unit tests:** Search filtering, category grouping, all standard codes present

### Story 6.8: JSON Formatter/Validator

As a **user**,
I want **to paste JSON and see it formatted with syntax highlighting, or get clear validation errors**,
So that **I can quickly clean up and validate JSON for my development work**.

**Category:** Data | **Emoji:** 📋 | **Key:** `json-formatter`

**Acceptance Criteria:**

**Given** the JSON Formatter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders with a `TextAreaInput` for raw JSON and a code output area for formatted output

**Given** a user pastes valid JSON
**When** the value is entered
**Then** formatted, indented JSON with syntax highlighting appears in real-time (debounced 300ms)
**And** a `CopyButton` copies the formatted JSON

**Given** a user pastes invalid JSON
**When** validation fails
**Then** an inline error appears indicating the parse error location (e.g., "Invalid JSON: Unexpected token at position 42")

**Given** the formatted output
**When** the user copies it
**Then** the copied text is properly indented with 2-space indentation and no trailing whitespace

**Given** the tool implementation
**When** it processes JSON
**Then** all parsing and formatting uses native `JSON.parse` / `JSON.stringify` — no server calls
**And** unit tests cover: valid JSON (objects, arrays, nested), invalid JSON, empty input, large JSON, special characters, and Unicode

### Story 6.9: JSON to CSV Converter

As a **user**,
I want **to convert JSON arrays to CSV and CSV to JSON**,
So that **I can quickly transform data between formats for spreadsheets and APIs**.

**Category:** Data | **Emoji:** 📊 | **Key:** `json-to-csv-converter`

**Acceptance Criteria:**

**Given** the JSON↔CSV Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders with tabs or toggle for JSON-to-CSV and CSV-to-JSON modes

**Given** a user pastes a JSON array of objects
**When** the value is entered
**Then** a CSV output appears with headers derived from object keys
**And** a `CopyButton` and download option are available

**Given** a user pastes CSV text
**When** the value is entered
**Then** a JSON array of objects appears with keys from the CSV header row

**Given** the JSON input is not an array of flat objects
**When** conversion is attempted
**Then** an inline error explains: "JSON must be an array of objects (e.g., [{"name": "Alice"}])"

**Given** the tool implementation
**When** it processes data
**Then** CSV handling covers: quoted fields, commas within values, newlines within quoted fields, and header row detection
**And** unit tests cover: simple arrays, nested objects (flattened), empty arrays, single-row, special characters in values

### Story 6.10: JSON to TOML Converter

As a **user**,
I want **to convert between TOML and JSON formats**,
So that **I can work with Rust/Go config files and transform them to JSON and back**.

**Category:** Data | **Emoji:** ⚙️ | **Key:** `json-to-toml-converter`

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

### Story 6.11: JSON to XML Converter

As a **user**,
I want **to convert between XML and JSON formats**,
So that **I can transform data between these common formats for APIs and configuration files**.

**Category:** Data | **Emoji:** 📄 | **Key:** `json-to-xml-converter`

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

### Story 6.12: JSON to YAML Converter

As a **user**,
I want **to convert JSON to YAML and YAML to JSON**,
So that **I can quickly switch between configuration formats for different tools and platforms**.

**Category:** Data | **Emoji:** 🔄 | **Key:** `json-to-yaml-converter`

**Acceptance Criteria:**

**Given** the JSON↔YAML Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders with tabs or toggle for JSON-to-YAML and YAML-to-JSON modes

**Given** a user pastes valid JSON in JSON→YAML mode
**When** the value is entered
**Then** the YAML equivalent appears in real-time (debounced 300ms) in the output
**And** a `CopyButton` copies the YAML output

**Given** a user pastes valid YAML in YAML→JSON mode
**When** the value is entered
**Then** the JSON equivalent appears in real-time, formatted with 2-space indentation

**Given** invalid input in either mode
**When** parsing fails
**Then** an inline error appears describing the issue

**Given** the tool implementation
**When** it converts formats
**Then** a client-side YAML library is used (code-split, lazy-loaded — does not increase initial bundle)
**And** unit tests cover: simple objects, nested structures, arrays, special YAML features (anchors, multiline strings), and edge cases

### Story 6.13: OG Preview

As a **user**,
I want **to enter OG meta tag values (title, description, image URL, site name) and see a preview of how the link will appear on Twitter, Facebook, and LinkedIn**,
So that **I can design social sharing cards before deploying**.

**Category:** Data | **Emoji:** 👁️ | **Key:** `og-preview`

**Acceptance Criteria:**

**Given** input fields for og:title, og:description, og:image, og:site_name
**When** values are entered
**Then** live previews update showing how the link card will appear on Twitter, Facebook, and LinkedIn

**Given** the previews
**When** displayed
**Then** each platform's card layout accurately represents the platform's current rendering style

**Given** the og:image field
**When** a URL is entered
**Then** the image is loaded and displayed in the preview cards

**Given** meta tag output
**When** the user clicks CopyButton
**Then** the complete `<meta>` tag HTML is copied to clipboard

**Library:** None — CSS-based preview cards
**Unit tests:** Meta tag generation, character limits, image URL handling, empty fields

### Story 6.14: YAML Formatter/Validator

As a **developer**,
I want **to paste YAML and see it formatted with proper indentation, with validation errors highlighted**,
So that **I can clean up and validate YAML configuration files quickly**.

**Category:** Data | **Emoji:** 📝 | **Key:** `yaml-formatter`

**Acceptance Criteria:**

**Given** the user pastes valid YAML
**When** the value is entered
**Then** formatted YAML appears in real-time (debounced 300ms) with configurable indent (2/4 spaces)

**Given** the user pastes invalid YAML
**When** the value is entered
**Then** a clear error message shows the line number and nature of the syntax error

**Given** formatted YAML output
**When** the user clicks CopyButton
**Then** the formatted output is copied to clipboard

**Given** the user selects "Sort Keys" option
**When** YAML is entered
**Then** all object keys are sorted alphabetically in the output

---

## Epic 7: Text Tools

**Category:** Text | **Tools:** 8

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 7.1 | Lorem Ipsum Generator | lorem-ipsum-generator | 📜 | Old 16.3 |
| 7.2 | Regex Tester | regex-tester | 🔍 | Old 7.2 |
| 7.3 | String Escape/Unescape | string-escape-unescape | 🪄 | Old 16.4 |
| 7.4 | Text Case Converter | text-case-converter | 🔠 | Old 16.1 |
| 7.5 | Text Diff Checker | text-diff-checker | 📝 | Old 7.1 |
| 7.6 | Text Sort & Dedupe | text-sort-dedupe | 📋 | Old 18.5 |
| 7.7 | User Agent Parser | user-agent-parser | 🕵️ | Old 19.5 |
| 7.8 | Word Counter | word-counter | 🔢 | Old 16.2 |

### Story 7.1: Lorem Ipsum Generator

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

### Story 7.2: Regex Tester

As a **user**,
I want **to test a regular expression against sample text and see matches highlighted in real-time**,
So that **I can iterate on regex patterns quickly without switching to a terminal or external tool**.

**Category:** Text | **Emoji:** 🔍 | **Key:** `regex-tester`

**Acceptance Criteria:**

**Given** the Regex Tester tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it
**Then** it renders with a `TextInput` for the regex pattern, a `TextAreaInput` for the test string, and an output region for highlighted matches

**Given** a user enters a valid regex pattern and test string
**When** both fields have content
**Then** all matches are highlighted in the test string in real-time (debounced 300ms)
**And** a match count is displayed (e.g., "3 matches found")

**Given** the regex pattern input
**When** the user types
**Then** common flags are available via toggles: global (g), case-insensitive (i), multiline (m)

**Given** a user enters an invalid regex pattern
**When** the pattern cannot be compiled
**Then** an inline error appears: "Invalid regex pattern"

**Given** the match results
**When** the user views them
**Then** each match group is distinguishable (e.g., capture groups shown separately)
**And** a `CopyButton` copies all match results

**Given** the tool implementation
**When** it processes regex
**Then** it uses native JavaScript `RegExp` — no server calls
**And** unit tests cover: simple patterns, capture groups, flags, invalid patterns, no matches, Unicode, and patterns that could cause catastrophic backtracking (with timeout protection)

### Story 7.3: String Escape/Unescape

As a **user**,
I want **to escape and unescape strings for different contexts (HTML, JavaScript, URL, JSON)**,
So that **I can safely embed content in different contexts**.

**Category:** Text | **Emoji:** 🪄 | **Key:** `string-escape-unescape`

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

### Story 7.4: Text Case Converter

As a **user**,
I want **to convert text between different case formats**,
So that **I can quickly transform variable names and text for different coding conventions**.

**Category:** Text | **Emoji:** 🔠 | **Key:** `text-case-converter`

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

### Story 7.5: Text Diff Checker

As a **user**,
I want **to paste two text blocks and see line-by-line differences highlighted**,
So that **I can quickly identify changes between two versions of code or text**.

**Category:** Text | **Emoji:** 📝 | **Key:** `text-diff-checker`

**Acceptance Criteria:**

**Given** the Text Diff Checker tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it
**Then** it renders with two side-by-side `TextAreaInput` fields (stacked on mobile) for "Original" and "Modified" text

**Given** a user enters text in both input fields
**When** both fields have content
**Then** a line-by-line diff is computed and displayed below the inputs
**And** added lines are highlighted in green (`--color-success` tint)
**And** removed lines are highlighted in red (`--color-error` tint)
**And** unchanged lines are shown in default styling

**Given** the diff output
**When** the user clicks "Copy Diff"
**Then** the diff output is copied to clipboard in a standard unified diff format

**Given** the tool implementation
**When** it computes diffs
**Then** it uses a proven open-source diff library (code-split, lazy-loaded)
**And** processing completes within the 500ms target for typical text sizes
**And** unit tests cover: identical texts, completely different texts, single line changes, multiline changes, empty inputs, and large texts

### Story 7.6: Text Sort & Dedupe

As a **user**,
I want **to sort lines alphabetically, numerically, or by length, and optionally remove duplicates and empty lines**,
So that **I can quickly clean up lists, log files, and text data**.

**Category:** Text | **Emoji:** 📋 | **Key:** `text-sort-dedupe`

**Acceptance Criteria:**

**Given** the user pastes multi-line text
**When** the value is entered
**Then** lines can be sorted alphabetically (A-Z / Z-A), numerically, or by line length

**Given** a "Remove duplicates" toggle
**When** enabled
**Then** duplicate lines are removed from the output

**Given** a "Remove empty lines" toggle
**When** enabled
**Then** blank lines are stripped from the output

**Given** the sorted/deduped output
**When** displayed
**Then** a CopyButton copies the result and line count stats are shown (original count vs output count)

**Library:** None — native JavaScript array operations
**Unit tests:** All sort modes, deduplication, empty line removal, mixed content, Unicode, empty input, single line

### Story 7.7: User Agent Parser

As a **user**,
I want **to paste a user agent string and see it parsed into browser, OS, device, and engine details**,
So that **I can debug UA-related issues and understand client environments**.

**Category:** Text | **Emoji:** 🕵️ | **Key:** `user-agent-parser`

**Acceptance Criteria:**

**Given** the user pastes a user agent string
**When** the value is entered
**Then** parsed details are displayed: browser name & version, operating system & version, device type, and rendering engine

**Given** the tool loads
**When** the page renders
**Then** the current browser's user agent is pre-populated as a smart default

**Given** each parsed field
**When** displayed
**Then** each has its own CopyButton

**Library:** `ua-parser-js` or similar — lazy-loaded
**Unit tests:** Common browser UAs (Chrome, Firefox, Safari, Edge), mobile UAs, bot UAs, empty input, malformed UAs

### Story 7.8: Word/Character Counter

As a **user**,
I want **to paste text and see word count, character count, sentence count, paragraph count, and estimated reading time**,
So that **I can check text length for various requirements (tweets, blog posts, essays)**.

**Category:** Text | **Emoji:** 🔢 | **Key:** `word-counter`

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
**Then** stats are shown in a clean grid/card layout

**Given** empty input
**When** nothing is entered
**Then** all stats show 0

**Library:** None — native JavaScript
**Unit tests:** Standard text, empty input, whitespace-only, single word, punctuation-heavy, Unicode, very long text

---

## Epic 8: Generator Tools

**Category:** Generator | **Tools:** 3

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 8.1 | Password Generator | password-generator | 🔒 | Old 8.2 |
| 8.2 | QR Code Generator | qr-code-generator | 📱 | Old 17.1 |
| 8.3 | UUID Generator | uuid-generator | 🆔 | Old 8.1 |

> **Note:** Hash Generator (old 8.3) has been moved to Epic 13 (Security) as it is more closely aligned with cryptographic tools.

### Story 8.1: Password Generator

As a **user**,
I want **to generate random passwords with configurable length and character types**,
So that **I can quickly create secure passwords for development and testing**.

**Category:** Generator | **Emoji:** 🔒 | **Key:** `password-generator`

**Acceptance Criteria:**

**Given** the Password Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it
**Then** it renders with configuration options and a "Generate" button

**Given** the configuration options
**When** the user views them
**Then** they can set: length (8-128 characters via slider or input), and toggle inclusion of: uppercase letters, lowercase letters, digits, and symbols

**Given** the user clicks "Generate"
**When** a password is generated
**Then** it is displayed with a `CopyButton`
**And** it respects all selected configuration options

**Given** the user disables all character type toggles
**When** no character types are selected
**Then** at least one toggle remains enabled (prevent impossible state)

**Given** the tool loads
**When** the page renders
**Then** a password is pre-generated with smart defaults (16 chars, all types enabled)

**Given** the tool implementation
**When** passwords are generated
**Then** it uses `crypto.getRandomValues()` for cryptographically secure randomness — no `Math.random()`
**And** unit tests cover: length constraints, character type filtering, minimum 1 character of each enabled type, edge cases (length 8, length 128), and all-types-disabled prevention

### Story 8.2: QR Code Generator

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

### Story 8.3: UUID Generator

As a **user**,
I want **to generate UUIDs with a single click or in bulk**,
So that **I can quickly get unique identifiers for my development work**.

**Category:** Generator | **Emoji:** 🆔 | **Key:** `uuid-generator`

**Acceptance Criteria:**

**Given** the UUID Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it
**Then** it renders with a "Generate" button and an output region

**Given** the user clicks "Generate"
**When** a single UUID is requested
**Then** a valid v4 UUID is displayed with a `CopyButton`

**Given** the user selects bulk generation
**When** they specify a count (e.g., 10) and click "Generate"
**Then** the requested number of UUIDs are displayed, each on its own line with individual `CopyButton`s
**And** a "Copy All" secondary button copies all UUIDs

**Given** the tool loads
**When** the page renders
**Then** one UUID is pre-generated as a smart default so the output is immediately useful

**Given** the tool implementation
**When** UUIDs are generated
**Then** it uses `crypto.randomUUID()` (Web Crypto API) — no server calls
**And** unit tests cover: UUID v4 format validation, uniqueness across bulk generation, and bulk count limits

---

## Epic 9: CSS Tools

**Category:** CSS | **Tools:** 6

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 9.1 | Box Shadow Generator | box-shadow-generator | 🎨 | Old 9.1 |
| 9.2 | CSS Animation Builder | css-animation-builder | 🎬 | Old 20.3 |
| 9.3 | Border Radius Generator | css-border-radius-generator | ⬜ | Old 19.1 |
| 9.4 | Flexbox Playground | css-flexbox-playground | 📦 | Old 15.2 |
| 9.5 | Gradient Generator | css-gradient-generator | 🌈 | Old 15.1 |
| 9.6 | Grid Playground | css-grid-playground | 🔲 | Old 18.3 |

### Story 9.1: CSS Box Shadow Generator

As a **user**,
I want **to visually configure CSS box-shadow properties and see a live preview**,
So that **I can design box shadows interactively and copy the CSS code directly into my stylesheet**.

**Category:** CSS | **Emoji:** 🎨 | **Key:** `box-shadow-generator`

**Acceptance Criteria:**

**Given** the Box Shadow Generator tool registered in `TOOL_REGISTRY` under the CSS category
**When** the user navigates to it
**Then** it renders with input controls and a live preview region

**Given** the input controls
**When** the user adjusts them
**Then** the following properties are configurable: horizontal offset, vertical offset, blur radius, spread radius, color (with alpha), and inset toggle
**And** each property uses an appropriate input (sliders for numeric values, color input for color)

**Given** any input value changes
**When** the user adjusts a control
**Then** the live preview updates in real-time (debounced 300ms) showing a box with the configured shadow
**And** the CSS output string updates simultaneously (e.g., `box-shadow: 4px 4px 8px 0px rgba(0, 0, 0, 0.25)`)

**Given** the CSS output
**When** the user clicks `CopyButton`
**Then** the complete `box-shadow` CSS property value is copied to clipboard

**Given** the tool loads
**When** the page renders
**Then** a sensible default shadow is applied (e.g., `4px 4px 8px 0px rgba(0, 0, 0, 0.25)`) so the preview is immediately visible

**Given** the tool implementation
**When** it generates CSS
**Then** all processing is client-side — live DOM style manipulation for preview
**And** unit tests cover: CSS string generation for all property combinations, inset toggle, zero values, negative offsets, and color format output

### Story 9.2: CSS Animation Builder

As a **user**,
I want **to visually create CSS keyframe animations with multiple steps, timing functions, and live preview**,
So that **I can prototype animations without writing CSS from scratch**.

**Category:** CSS | **Emoji:** 🎬 | **Key:** `css-animation-builder`

**Acceptance Criteria:**

**Given** the animation builder interface
**When** the user interacts
**Then** they can define keyframe steps (0%, 25%, 50%, 75%, 100%) with CSS properties at each step

**Given** timing function options
**When** the user selects one
**Then** options include: ease, ease-in, ease-out, ease-in-out, linear, and custom cubic-bezier

**Given** animation properties
**When** configured
**Then** duration, delay, iteration count, direction, and fill mode can be set

**Given** a live preview
**When** any property changes
**Then** the animated element updates in real-time

**Given** the CSS output
**When** CopyButton is clicked
**Then** the complete `@keyframes` rule and animation shorthand are copied

**Library:** None — native CSS + DOM manipulation
**Unit tests:** Keyframe CSS generation, timing functions, animation shorthand, edge cases

### Story 9.3: CSS Border Radius Generator

As a **user**,
I want **to visually configure CSS border-radius with per-corner control and see a live preview**,
So that **I can design rounded corners without guessing pixel values**.

**Category:** CSS | **Emoji:** ⬜ | **Key:** `css-border-radius-generator`

**Acceptance Criteria:**

**Given** the border radius generator
**When** the user interacts
**Then** they can control each corner independently (top-left, top-right, bottom-right, bottom-left) via sliders or numeric inputs

**Given** a "Link corners" toggle
**When** enabled
**Then** changing one corner value updates all corners equally

**Given** any corner value change
**When** the user adjusts
**Then** a live preview box updates showing the border radius
**And** the CSS output updates (e.g., `border-radius: 10px 20px 30px 40px`)

**Given** the CSS output
**When** CopyButton is clicked
**Then** the complete `border-radius` CSS property is copied

**Library:** None — native CSS + DOM
**Unit tests:** CSS string generation, individual corners, linked corners, shorthand output, zero values

### Story 9.4: CSS Flexbox Playground

As a **user**,
I want **to visually configure CSS flexbox properties and see the layout result**,
So that **I can learn and experiment with flexbox without writing code**.

**Category:** CSS | **Emoji:** 📦 | **Key:** `css-flexbox-playground`

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

### Story 9.5: CSS Gradient Generator

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

### Story 9.6: CSS Grid Playground

As a **user**,
I want **to visually build CSS Grid layouts by adjusting columns, rows, gaps, and alignment**,
So that **I can experiment with grid properties and copy the resulting CSS**.

**Category:** CSS | **Emoji:** 🔲 | **Key:** `css-grid-playground`

**Acceptance Criteria:**

**Given** the grid playground interface
**When** the user interacts
**Then** they can configure: grid-template-columns, grid-template-rows, gap, justify-items, align-items

**Given** child grid items
**When** the user interacts
**Then** they can configure per-item placement (grid-column, grid-row, justify-self, align-self)

**Given** any property change
**When** the user adjusts a control
**Then** the visual grid layout updates in real-time
**And** the CSS output updates

**Given** the CSS output
**When** CopyButton is clicked
**Then** the complete CSS for the grid layout is copied

**Library:** None — native CSS + DOM
**Unit tests:** CSS generation for grid properties, fractional units, auto sizing, named areas, item placement

---

## Epic 10: Image Tools

**Category:** Image | **Tools:** 11

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 10.1 | Background Remover | background-remover | ✂️ | Old 21.1 |
| 10.2 | Base64 to Image | base64-to-image | 🖼️ | Old 17.3 |
| 10.3 | Favicon Generator | favicon-generator | ⭐ | Old 20.5 |
| 10.4 | Image Color Picker | image-color-picker | 🎨 | Old 18.4 |
| 10.5 | Image Compressor | image-compressor | 📦 | Old 10.1 |
| 10.6 | Image Converter | image-converter | 🔄 | Baseline (Epic 3) |
| 10.7 | Image Cropper | image-cropper | ✂️ | Old 10.2 |
| 10.8 | Image Resizer | image-resizer | 📐 | Baseline (Epic 3) |
| 10.9 | Image to Base64 | image-to-base64 | 🔤 | Old 17.2 |
| 10.10 | Placeholder Image Generator | placeholder-image-generator | 🖼️ | Old 23.3 |
| 10.11 | SVG Viewer | svg-viewer | 🔍 | Old 15.3 |

### Story 10.1: Background Remover

As a **user**,
I want **to upload an image and have its background automatically removed using an AI model running in my browser**,
So that **I can get transparent-background images without uploading to external services or paying for API calls**.

**Category:** Image | **Emoji:** ✂️ | **Key:** `background-remover`

**Acceptance Criteria:**

**Given** the user uploads an image
**When** the file is loaded
**Then** the AI model processes the image and produces a transparent-background result

**Given** the first time the tool is used
**When** the model needs to download (~25MB)
**Then** a download progress indicator is shown

**Given** the processed image
**When** displayed
**Then** a before/after slider or side-by-side comparison is shown

**Given** background output options
**When** the user selects one
**Then** they can choose: transparent, white, or custom background color

**Given** the processed image
**When** the user clicks "Download"
**Then** the image downloads as PNG

**Technical approach:**
- Use `@huggingface/transformers` with `Xenova/modnet` model (Apache 2.0 license)
- Pipeline: `pipeline('background-removal', 'Xenova/modnet', { dtype: 'fp32' })`
- Model downloads ~25MB on first use, cached by browser after
- WebGPU with WASM fallback for inference
- Dialog-based tool (needs space for before/after preview)

### Story 10.2: Base64 to Image

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

### Story 10.3: Favicon Generator

As a **user**,
I want **to upload an image and generate favicons in standard sizes (16x16, 32x32, 48x48, 180x180, 192x192, 512x512) with a downloadable zip**,
So that **I can quickly create all required favicon sizes for my website**.

**Category:** Image | **Emoji:** ⭐ | **Key:** `favicon-generator`

**Acceptance Criteria:**

**Given** the user uploads an image
**When** the file is loaded
**Then** favicons are generated in standard sizes: 16x16, 32x32, 48x48, 180x180, 192x192, 512x512

**Given** the generated favicons
**When** displayed
**Then** each size is shown as a preview with individual download buttons

**Given** a "Download All" button
**When** clicked
**Then** all favicons are packaged in a zip file and downloaded

**Given** the source image
**When** it is not square
**Then** the image is center-cropped to square before resizing

**Library:** Canvas API + JSZip (lazy-loaded)
**Unit tests:** Size generation, square cropping, zip packaging, format handling, invalid file types

### Story 10.4: Image Color Picker

As a **user**,
I want **to upload an image and click on it to extract colors in HEX, RGB, and HSL formats**,
So that **I can sample colors from designs, screenshots, or photos**.

**Category:** Image | **Emoji:** 🎨 | **Key:** `image-color-picker`

**Acceptance Criteria:**

**Given** the user uploads an image
**When** the image is loaded
**Then** it is displayed in a canvas element for interaction

**Given** the user clicks on a pixel in the image
**When** the click registers
**Then** the color at that pixel is extracted and displayed in HEX, RGB, and HSL formats
**And** each format has a CopyButton

**Given** a magnifier/loupe
**When** the user hovers over the image
**Then** a zoomed preview shows pixels around the cursor for precise selection

**Given** a color history
**When** multiple colors are picked
**Then** recently picked colors are shown as a palette strip for reference

**Library:** Native Canvas API
**Unit tests:** Color extraction accuracy, format conversions, edge pixels, transparent pixels

### Story 10.5: Image Compressor

As a **user**,
I want **to compress JPEG and WebP images using a quality slider and see the resulting file size before downloading**,
So that **I can optimize images for web use while controlling the quality-size tradeoff**.

**Category:** Image | **Emoji:** 📦 | **Key:** `image-compressor`

**Acceptance Criteria:**

**Given** the Image Compression tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it
**Then** it renders with a file upload zone, quality slider, and output region

**Given** a user uploads a JPEG or WebP image
**When** the file is loaded
**Then** the original file size and dimensions are displayed
**And** a quality slider (1-100) is shown with a default value of 80

**Given** a user adjusts the quality slider
**When** the value changes
**Then** a compressed preview is generated
**And** the estimated output file size is displayed next to the original size (e.g., "2.4 MB → 890 KB")

**Given** the user clicks "Download"
**When** the compressed image is ready
**Then** the file downloads with filename format `compressed-{original-name}.{ext}`
**And** a `ProgressBar` appears only if compression exceeds 300ms

**Given** a user uploads a non-JPEG/WebP image
**When** an unsupported format is detected
**Then** an inline error appears: "Image compression supports JPEG and WebP formats"

**Given** the tool implementation
**When** it compresses images
**Then** it uses the Canvas API for re-encoding at the specified quality — no server calls
**And** processing completes within 3 seconds for files up to 10MB
**And** unit tests cover: JPEG compression, WebP compression, quality range validation, file size reduction verification, and unsupported format handling

### Story 10.6: Image Converter

> **Note:** This was a baseline tool (old Epic 3, Story 3.3) with its own refactor spec.

As a **user**,
I want **the Image Converter tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably convert images between formats with a consistent interface**.

**Category:** Image | **Emoji:** 🔄 | **Key:** `image-converter`

**Acceptance Criteria:**

**Given** the existing `ImageConvertor` component
**When** it is refactored
**Then** it uses standardized file upload zone
**And** it is registered in `TOOL_REGISTRY`

**Given** a user uploads an image file
**When** the file is loaded
**Then** the filename and dimensions are displayed
**And** a format selection dropdown offers: PNG, JPG, WebP, GIF, BMP, AVIF (where browser-supported)

**Given** a user selects a target format and clicks "Convert"
**When** processing completes
**Then** the converted image is available for download
**And** a `ProgressBar` appears only if processing exceeds 300ms
**And** a toast confirms: "Downloaded {filename}"

**Given** a user uploads an unsupported file type
**When** validation fails
**Then** an inline error appears with accepted formats listed

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: supported format conversions, large file handling (up to 10MB), invalid file types, and mobile upload behavior

### Story 10.7: Image Cropper

As a **user**,
I want **to crop images using freeform selection or common aspect ratio presets**,
So that **I can quickly trim images to exact dimensions for different use cases**.

**Category:** Image | **Emoji:** ✂️ | **Key:** `image-cropper`

**Acceptance Criteria:**

**Given** the Image Cropping tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it
**Then** it renders with a file upload zone, cropping canvas, aspect ratio selector, and output region

**Given** a user uploads an image
**When** the file is loaded
**Then** the image is displayed in a cropping canvas with a draggable/resizable selection region

**Given** the aspect ratio selector
**When** the user views options
**Then** presets are available: Freeform, 16:9, 4:3, 1:1, 3:2
**And** selecting a preset constrains the selection region to that ratio

**Given** the user adjusts the crop selection
**When** they drag the selection handles or reposition the selection
**Then** the cropped preview updates in real-time

**Given** the user clicks "Crop & Download"
**When** the crop is applied
**Then** the cropped image downloads with filename format `cropped-{original-name}.{ext}`
**And** a `ProgressBar` appears only if processing exceeds 300ms

**Given** the tool on mobile
**When** the viewport is narrow
**Then** the cropping canvas is touch-friendly with minimum 44x44px handles
**And** pinch-to-zoom is not intercepted by the cropping interaction

**Given** the tool implementation
**When** it crops images
**Then** it uses the Canvas API for pixel-level cropping — no server calls
**And** unit tests cover: freeform crop dimensions, preset aspect ratio enforcement, edge cases (crop to full image, crop to minimum size), and mobile touch interaction

### Story 10.8: Image Resizer

> **Note:** This was a baseline tool (old Epic 3, Story 3.4) with its own refactor spec.

As a **user**,
I want **the Image Resizer tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably resize images with custom dimensions and a consistent interface**.

**Category:** Image | **Emoji:** 📐 | **Key:** `image-resizer`

**Acceptance Criteria:**

**Given** the existing `ImageResizer` component
**When** it is refactored
**Then** it uses standardized file upload zone
**And** it is registered in `TOOL_REGISTRY`

**Given** a user uploads an image
**When** the file is loaded
**Then** current dimensions (width x height) are displayed
**And** width and height input fields are pre-filled with current dimensions

**Given** a user enters target dimensions and clicks "Resize"
**When** processing completes
**Then** the resized image is available for download with filename format `resized-image.{ext}`
**And** a `ProgressBar` appears only if processing exceeds 300ms

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: upscale, downscale, aspect ratio behavior, large file handling, minimum dimensions, and mobile upload behavior

### Story 10.9: Image to Base64

As a **user**,
I want **to upload an image and get the Base64 data URI**,
So that **I can embed images directly in HTML, CSS, or JSON without external files**.

**Category:** Image | **Emoji:** 🔤 | **Key:** `image-to-base64`

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

### Story 10.10: Placeholder Image Generator

As a **developer**,
I want **to generate placeholder images with custom dimensions, colors, and text**,
So that **I can use them in mockups and development without external services**.

**Category:** Image | **Emoji:** 🖼️ | **Key:** `placeholder-image-generator`

**Acceptance Criteria:**

**Given** the user enters width and height (e.g., 800x600)
**When** values are entered
**Then** a placeholder image is rendered in a canvas with the specified dimensions

**Given** the user customizes background color and text color
**When** colors are changed
**Then** the preview updates in real-time

**Given** the user enters custom text (or uses default "{W}x{H}")
**When** text is entered
**Then** it's centered on the placeholder image

**Given** common size presets (thumbnail 150x150, banner 1200x630, avatar 200x200, hero 1920x1080)
**When** a preset is selected
**Then** dimensions are populated

**Given** the generated placeholder
**When** the user clicks "Download PNG" or "Download SVG"
**Then** the image is downloaded in the selected format

### Story 10.11: SVG Viewer/Optimizer

As a **user**,
I want **to paste SVG code, see a live preview, and optimize the SVG**,
So that **I can inspect, debug, and reduce SVG file size**.

**Category:** Image | **Emoji:** 🔍 | **Key:** `svg-viewer`

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

## Epic 11: Code Tools

**Category:** Code | **Tools:** 13

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 11.1 | CSS Formatter | css-formatter | 🎨 | Old 12.2 |
| 11.2 | GraphQL Schema Viewer | graphql-schema-viewer | 📊 | Old 25.1 |
| 11.3 | HTML Formatter | html-formatter | 📄 | Old 12.1 |
| 11.4 | JavaScript Minifier | javascript-minifier | ⚡ | Old 12.3 |
| 11.5 | JSON Schema Validator | json-schema-validator | ✅ | Old 20.1 |
| 11.6 | JSON to TypeScript | json-to-typescript | 🔷 | Old 18.1 |
| 11.7 | JSONPath Evaluator | jsonpath-evaluator | 🎯 | Old 25.4 |
| 11.8 | Markdown Preview | markdown-preview | 👁️ | Old 12.5 |
| 11.9 | Markdown Table Generator | markdown-table-generator | 📊 | Old 19.3 |
| 11.10 | Mermaid Renderer | mermaid-renderer | 🧜 | Old 26.2 |
| 11.11 | Protobuf to JSON | protobuf-to-json | 🔄 | Old 25.2 |
| 11.12 | SQL Formatter | sql-formatter | 🗃️ | Old 12.4 |
| 11.13 | TypeScript Playground | typescript-playground | 🟦 | Old 25.3 |

### Story 11.1: CSS Formatter/Minifier

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

### Story 11.2: GraphQL Schema Viewer

As a **developer**,
I want **to paste a GraphQL schema (SDL) and browse its types, fields, and relationships**,
So that **I can explore API schemas without running a GraphQL server**.

**Category:** Code | **Emoji:** 📊 | **Key:** `graphql-schema-viewer`

**Acceptance Criteria:**

**Given** the user pastes valid GraphQL SDL
**When** parsed
**Then** all types (Object, Input, Enum, Interface, Union, Scalar) are listed in a browsable sidebar/list

**Given** the user selects a type
**When** clicked
**Then** all fields, arguments, directives, and descriptions for that type are displayed

**Given** a field references another type
**When** the type name is displayed
**Then** it's clickable/linkable to navigate to that type's definition

**Given** invalid GraphQL SDL
**When** parsed
**Then** syntax errors are shown with line numbers

**Given** a loaded schema
**When** the user types in a search/filter box
**Then** types and fields are filtered by name

**Dependencies:** graphql package

### Story 11.3: HTML Formatter/Beautifier

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

### Story 11.4: JavaScript Minifier

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

### Story 11.5: JSON Schema Validator

As a **user**,
I want **to paste JSON data and a JSON Schema, then see validation results with specific error paths**,
So that **I can verify my JSON conforms to a schema without running external tools**.

**Category:** Code | **Emoji:** ✅ | **Key:** `json-schema-validator`

**Acceptance Criteria:**

**Given** two input areas — one for JSON data, one for JSON Schema
**When** both are provided
**Then** validation runs and results are displayed

**Given** the JSON conforms to the schema
**When** validated
**Then** a success message is shown: "Valid"

**Given** the JSON does not conform
**When** validated
**Then** each validation error is listed with: error path (e.g., `$.items[0].price`), error message, and expected vs actual values

**Given** invalid JSON or invalid schema
**When** either cannot be parsed
**Then** a clear parse error is shown for the relevant input

**Library:** `ajv` — lazy-loaded
**Unit tests:** Valid schemas, validation failures, nested paths, array validation, required fields, pattern matching, invalid JSON/schema

### Story 11.6: JSON to TypeScript

As a **user**,
I want **to paste JSON and get TypeScript interfaces or type aliases generated automatically**,
So that **I can quickly create type-safe code from API responses or data samples**.

**Category:** Code | **Emoji:** 🔷 | **Key:** `json-to-typescript`

**Acceptance Criteria:**

**Given** the user pastes valid JSON
**When** the value is entered
**Then** TypeScript type definitions are generated in real-time (debounced 300ms)

**Given** generation options
**When** the user configures them
**Then** they can choose: `type` vs `interface`, root type name, optional properties toggle, array type style

**Given** nested JSON objects
**When** converted
**Then** nested types are generated with descriptive names derived from the key path

**Given** the generated TypeScript
**When** CopyButton is clicked
**Then** the complete TypeScript code is copied

**Library:** `json-to-ts` or custom implementation — lazy-loaded
**Unit tests:** Simple objects, nested objects, arrays, mixed types, null values, empty objects, naming conventions

### Story 11.7: JSONPath Evaluator

As a **developer**,
I want **to paste JSON and evaluate JSONPath expressions against it**,
So that **I can test and debug JSONPath queries for API data extraction**.

**Category:** Code | **Emoji:** 🎯 | **Key:** `jsonpath-evaluator`

**Acceptance Criteria:**

**Given** the user pastes valid JSON in the input area
**When** JSON is entered
**Then** it's parsed and formatted

**Given** the user enters a JSONPath expression (e.g., $.store.book[*].author)
**When** the expression is entered
**Then** matching results are displayed in real-time

**Given** the JSONPath expression matches multiple values
**When** results are shown
**Then** each result shows its path and value

**Given** an invalid JSONPath expression
**When** entered
**Then** a clear error message is shown

**Given** no matches found
**When** evaluated
**Then** "No matches" is displayed

**Given** common JSONPath examples
**When** the user clicks a cheatsheet toggle
**Then** common patterns are shown ($.*, $..name, $[0], $[?(@.price<10)])

**Dependencies:** jsonpath-plus

### Story 11.8: Markdown Preview

As a **user**,
I want **to write Markdown and see a live HTML preview side-by-side**,
So that **I can author READMEs and docs with instant feedback**.

**Category:** Code | **Emoji:** 👁️ | **Key:** `markdown-preview`

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

### Story 11.9: Markdown Table Generator

As a **user**,
I want **to visually build a table by adding rows and columns, then copy the Markdown output**,
So that **I can create Markdown tables without memorizing the pipe syntax**.

**Category:** Code | **Emoji:** 📊 | **Key:** `markdown-table-generator`

**Acceptance Criteria:**

**Given** the table builder interface
**When** the user interacts
**Then** they can add/remove rows and columns, and edit cell content inline

**Given** column alignment options
**When** the user selects alignment (left, center, right)
**Then** the Markdown output uses the appropriate colon syntax (`:---`, `:---:`, `---:`)

**Given** the table content
**When** it changes
**Then** the Markdown output updates in real-time

**Given** the Markdown output
**When** CopyButton is clicked
**Then** the complete Markdown table is copied

**Given** an "Import CSV" option
**When** CSV is pasted
**Then** the table is populated from the CSV data

**Library:** None — native DOM + string formatting
**Unit tests:** Markdown generation, alignment syntax, special characters in cells, empty cells, import from CSV

### Story 11.10: Mermaid Diagram Renderer

As a **developer/technical writer**,
I want **to write Mermaid diagram syntax and see a live SVG preview**,
So that **I can create and iterate on diagrams without embedding them in markdown renderers**.

**Category:** Code | **Emoji:** 🧜 | **Key:** `mermaid-renderer`

**Acceptance Criteria:**

**Given** the tool loads
**When** Mermaid library initializes
**Then** a loading skeleton is shown until ready (NFR-E3-02)

**Given** the user types valid Mermaid syntax (flowchart, sequence, class, etc.)
**When** typing (debounced 500ms)
**Then** a live SVG preview is rendered

**Given** invalid Mermaid syntax
**When** entered
**Then** an error message from the parser is shown

**Given** a rendered diagram
**When** the user clicks "Export SVG"
**Then** the SVG is downloaded

**Given** a rendered diagram
**When** the user clicks "Export PNG"
**Then** the SVG is rasterized and downloaded as PNG

**Given** a syntax reference panel
**When** toggled
**Then** quick-reference examples are shown for flowchart, sequence, class, state, gantt, and pie diagram types

**Dependencies:** mermaid

### Story 11.11: Protobuf to JSON

As a **developer**,
I want **to paste .proto definitions and see corresponding JSON structures**,
So that **I can understand the JSON shape of Protobuf messages without running protoc**.

**Category:** Code | **Emoji:** 🔄 | **Key:** `protobuf-to-json`

**Acceptance Criteria:**

**Given** the user pastes a valid .proto file with message definitions
**When** parsed
**Then** all message types are listed

**Given** the user selects a message type
**When** selected
**Then** a sample JSON structure is generated with default values for each field type

**Given** nested messages or repeated fields
**When** JSON is generated
**Then** nested objects and arrays are correctly represented

**Given** invalid .proto syntax
**When** pasted
**Then** parsing errors are shown with line context

**Given** enum fields in the proto
**When** JSON is generated
**Then** the first enum value is used as default, with a comment listing all values

**Dependencies:** protobufjs

### Story 11.12: SQL Formatter

As a **user**,
I want **to paste SQL and see it formatted with proper indentation and keyword highlighting**,
So that **I can make complex queries readable**.

**Category:** Code | **Emoji:** 🗃️ | **Key:** `sql-formatter`

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

### Story 11.13: TypeScript Playground

As a **developer**,
I want **to write TypeScript in a browser-based editor with real-time type checking and JS output**,
So that **I can quickly experiment with TypeScript without setting up a project**.

**Category:** Code | **Emoji:** 🟦 | **Key:** `typescript-playground`

**Acceptance Criteria:**

**Given** the tool loads
**When** Monaco Editor initializes
**Then** a loading skeleton is shown until the editor is ready (NFR-E3-01)

**Given** the user types TypeScript code
**When** typing
**Then** real-time type checking runs with error squiggles and hover type info

**Given** valid TypeScript code
**When** entered
**Then** transpiled JavaScript output is shown in a secondary read-only editor pane

**Given** TypeScript with type errors
**When** errors exist
**Then** errors are listed below the editor with line numbers and messages

**Given** the user clicks "Copy JS"
**When** clicked
**Then** the transpiled JavaScript is copied to clipboard

**Dependencies:** @monaco-editor/react, typescript (via Monaco's built-in TS worker)

---

## Epic 12: Color Tools

**Category:** Color | **Tools:** 2

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 12.1 | Color Converter | color-converter | 🎨 | Baseline (Epic 3) |
| 12.2 | Color Palette Generator | color-palette-generator | 🌈 | Old 23.2 |

### Story 12.1: Color Converter

> **Note:** This was a baseline tool (old Epic 3, Story 3.1) with its own refactor spec.

As a **user**,
I want **the Color Converter tool to use the standardized layout with documented behavior and regression tests**,
So that **I can rely on consistent, tested color conversion between HEX, RGB, and HSL formats**.

**Category:** Color | **Emoji:** 🎨 | **Key:** `color-converter`

**Acceptance Criteria:**

**Given** the existing `ColorConvertor` component
**When** it is refactored
**Then** it uses `CopyButton` for output copying
**And** it is registered in `TOOL_REGISTRY` with complete metadata

**Given** a user inputs a valid HEX value (e.g., `#3B82F6`)
**When** the value is entered
**Then** RGB and HSL conversions appear in real-time (debounced 300ms) in the output region
**And** each output value has an adjacent `CopyButton`

**Given** a user inputs a color via the visual color picker
**When** a color is selected
**Then** all format outputs (HEX, RGB, HSL) update immediately

**Given** a user inputs an invalid color value
**When** validation fails
**Then** an inline error appears: "Enter a valid hex color (e.g., #3B82F6)"

**Given** a feature spec document
**When** a developer reads it
**Then** it covers: supported input formats (HEX 3/6/8-digit, RGB, HSL), output formats, edge cases (with/without #, shorthand hex, out-of-range values), and expected behavior

**Given** regression test stories in `src/utils/color.spec.ts`
**When** `pnpm test` runs
**Then** all happy paths, edge cases, and error states pass

### Story 12.2: Color Palette Generator

As a **designer/developer**,
I want **to generate harmonious color palettes from a base color**,
So that **I can quickly create consistent color schemes for my projects**.

**Category:** Color | **Emoji:** 🌈 | **Key:** `color-palette-generator`

**Acceptance Criteria:**

**Given** the user inputs a base color (HEX, RGB, or HSL)
**When** a harmony type is selected (complementary, analogous, triadic, split-complementary, monochromatic)
**Then** a palette of 5 harmonious colors is generated and displayed as swatches

**Given** a generated palette
**When** the user hovers over a color swatch
**Then** HEX, RGB, and HSL values are shown

**Given** a generated palette
**When** the user clicks a swatch
**Then** the HEX value is copied to clipboard

**Given** a generated palette
**When** the user clicks "Export CSS"
**Then** CSS custom properties are generated (--color-1: #xxx; etc.)

**Given** the user uses a color picker input
**When** the color changes
**Then** the palette updates in real-time

---

## Epic 13: Security Tools

**Category:** Security | **Tools:** 8

Includes crypto tools (AES, Hash, HMAC) moved from the former Generator category.

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 13.1 | AES Encrypt/Decrypt | aes-encrypt-decrypt | 🔐 | Old 14.2 |
| 13.2 | Bcrypt Hasher | bcrypt-hasher | 🔒 | Old 24.3 |
| 13.3 | Certificate Decoder | certificate-decoder | 📜 | Old 24.2 |
| 13.4 | Chmod Calculator | chmod-calculator | 🔐 | Old 24.4 |
| 13.5 | Hash Generator | hash-generator | #️⃣ | Old 8.3 |
| 13.6 | HMAC Generator | hmac-generator | 🔏 | Old 14.1 |
| 13.7 | RSA Key Generator | rsa-key-generator | 🔑 | Old 24.5 |
| 13.8 | SSH Key Fingerprint | ssh-key-fingerprint | 🔑 | Old 24.1 |

### Story 13.1: AES Encrypt/Decrypt

As a **user**,
I want **to encrypt and decrypt text using AES with a password**,
So that **I can quickly protect sensitive data without installing encryption tools**.

**Category:** Security | **Emoji:** 🔐 | **Key:** `aes-encrypt-decrypt`

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

### Story 13.2: Bcrypt Hasher

As a **developer**,
I want **to hash passwords with bcrypt and verify plaintext against bcrypt hashes**,
So that **I can generate and test password hashes during development**.

**Category:** Security | **Emoji:** 🔒 | **Key:** `bcrypt-hasher`

**Acceptance Criteria:**

**Given** the user enters a plaintext password
**When** "Hash" mode is active and a cost factor is selected (4-31, default 10)
**Then** a bcrypt hash is generated and displayed

**Given** bcrypt hashing is in progress (especially high cost factors)
**When** hashing
**Then** a progress indicator and elapsed time are shown (NFR-E3-04)

**Given** the user enters plaintext and a bcrypt hash
**When** "Verify" mode is active
**Then** the result shows "Match" or "No Match"

**Given** an invalid bcrypt hash format
**When** entered for verification
**Then** an error explains the expected format ($2a$/$2b$/$2y$ prefix)

**Dependencies:** bcryptjs

### Story 13.3: Certificate Decoder

As a **developer/devops engineer**,
I want **to paste a PEM-encoded X.509 certificate and see its decoded details**,
So that **I can inspect certificate properties without openssl CLI**.

**Category:** Security | **Emoji:** 📜 | **Key:** `certificate-decoder`

**Acceptance Criteria:**

**Given** the user pastes a PEM-encoded certificate (-----BEGIN CERTIFICATE-----)
**When** parsed
**Then** decoded details are shown: Subject, Issuer, Serial Number, Validity (Not Before/Not After), Public Key Algorithm & Size, Signature Algorithm

**Given** the certificate has extensions (SAN, Key Usage, etc.)
**When** decoded
**Then** extensions are listed with their values

**Given** the certificate validity dates
**When** displayed
**Then** a visual indicator shows if the certificate is currently valid, expired, or not yet valid

**Given** an invalid PEM or non-certificate PEM
**When** pasted
**Then** a clear error explains what was expected

**Dependencies:** asn1js + pkijs (or lightweight ASN.1 parser)

### Story 13.4: Chmod Calculator

As a **developer/devops engineer**,
I want **to convert between symbolic (rwxr-xr-x), octal (755), and visual (checkbox) chmod notations**,
So that **I can quickly determine correct file permissions**.

**Category:** Security | **Emoji:** 🔐 | **Key:** `chmod-calculator`

**Acceptance Criteria:**

**Given** the user enters an octal permission (e.g., 755)
**When** entered
**Then** the symbolic notation (rwxr-xr-x) and a 3x3 checkbox grid (owner/group/other x read/write/execute) are updated

**Given** the user toggles checkboxes in the visual grid
**When** a checkbox changes
**Then** both octal and symbolic notations update in real-time

**Given** the user types symbolic notation (e.g., rwxr-xr-x)
**When** entered
**Then** octal and checkbox grid update accordingly

**Given** common presets (644, 755, 777, 600, 400)
**When** selected
**Then** all three representations update

**Given** any notation
**When** displayed
**Then** a human-readable description is shown (e.g., "Owner: read, write, execute | Group: read, execute | Other: read, execute")

### Story 13.5: Hash Generator

As a **user**,
I want **to generate hash values from text input using common algorithms**,
So that **I can quickly compute checksums and hashes for verification and development**.

**Category:** Security | **Emoji:** #️⃣ | **Key:** `hash-generator`

**Acceptance Criteria:**

**Given** the Hash Generator tool registered in `TOOL_REGISTRY` under the Security category
**When** the user navigates to it
**Then** it renders with a `TextAreaInput` for text and algorithm selection (MD5, SHA-1, SHA-256, SHA-512)

**Given** a user enters text and selects an algorithm
**When** the input changes
**Then** the hash value is computed and displayed in real-time (debounced 300ms)
**And** a `CopyButton` copies the hex-encoded hash

**Given** multiple algorithms are available
**When** the user selects a different algorithm
**Then** the output updates immediately for the current input text

**Given** the tool loads with empty input
**When** no text is entered
**Then** the output shows dashes or "---" (empty state per UX pattern)

**Given** the tool implementation
**When** hashes are computed
**Then** SHA algorithms use the Web Crypto API (`crypto.subtle.digest`) — no server calls
**And** MD5 uses a lightweight client-side library (code-split, lazy-loaded)
**And** unit tests cover: known hash values for test vectors, empty input, Unicode text, large input, and all 4 algorithms

### Story 13.6: HMAC Generator

As a **user**,
I want **to generate HMAC signatures from a message and secret key**,
So that **I can verify API signatures and test webhook authentication locally**.

**Category:** Security | **Emoji:** 🔏 | **Key:** `hmac-generator`

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
**Then** output shows "---" (empty state)

**Library:** Web Crypto API (`crypto.subtle.importKey` + `crypto.subtle.sign`) — no external deps
**Unit tests:** Known HMAC test vectors (RFC 4231), all algorithms, empty inputs, Unicode key/message, hex vs base64 encoding

### Story 13.7: RSA Key Pair Generator

As a **developer**,
I want **to generate RSA key pairs entirely in the browser**,
So that **I can create keys for development without installing tools, knowing my private key never leaves the browser**.

**Category:** Security | **Emoji:** 🔑 | **Key:** `rsa-key-generator`

**Acceptance Criteria:**

**Given** the user selects a key size (2048 or 4096 bits)
**When** "Generate" is clicked
**Then** an RSA key pair is generated using Web Crypto API and displayed in PEM format

**Given** 4096-bit key generation (may take 1-3s)
**When** generating
**Then** a progress indicator is shown (NFR-E3-03)

**Given** generated keys
**When** displayed
**Then** public and private keys are shown in separate copyable fields

**Given** generated keys
**When** the user clicks "Download"
**Then** keys are downloaded as .pem files (public.pem, private.pem)

**Given** a security notice
**When** the tool loads
**Then** a banner confirms "Keys are generated entirely in your browser. No data is sent to any server."

**Dependencies:** Web Crypto API (native)

### Story 13.8: SSH Key Fingerprint Viewer

As a **developer/devops engineer**,
I want **to paste an SSH public key and see its fingerprint in standard formats**,
So that **I can verify SSH key identity without using the command line**.

**Category:** Security | **Emoji:** 🔑 | **Key:** `ssh-key-fingerprint`

**Acceptance Criteria:**

**Given** the user pastes a valid SSH public key (ssh-rsa, ssh-ed25519, ecdsa-sha2-*)
**When** the key is pasted
**Then** SHA256 and MD5 fingerprints are displayed, along with key type and bit size

**Given** the user pastes an OpenSSH authorized_keys line (with optional comment)
**When** parsed
**Then** the comment field is extracted and displayed alongside the fingerprint

**Given** an invalid or malformed key
**When** pasted
**Then** a clear error message indicates the key format is not recognized

**Given** fingerprint output
**When** the user clicks copy on either format
**Then** the fingerprint string is copied to clipboard (e.g., SHA256:xxx or MD5:xx:xx:xx...)

---

## Epic 14: Time Tools

**Category:** Time | **Tools:** 4

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 14.1 | Cron Parser | cron-expression-parser | ⏰ | Old 18.2 |
| 14.2 | Crontab Generator | crontab-generator | 📅 | Old 20.2 |
| 14.3 | Timezone Converter | timezone-converter | 🌍 | Old 26.1 |
| 14.4 | Unix Timestamp | unix-timestamp | ⏱️ | Baseline (Epic 3) |

### Story 14.1: Cron Expression Parser

As a **user**,
I want **to enter a cron expression and see a human-readable description plus the next scheduled run times**,
So that **I can understand and verify cron schedules without memorizing the syntax**.

**Category:** Time | **Emoji:** ⏰ | **Key:** `cron-expression-parser`

**Acceptance Criteria:**

**Given** the user enters a valid cron expression (e.g., `*/5 * * * *`)
**When** the value is entered
**Then** a human-readable description is shown (e.g., "Every 5 minutes")
**And** the next 5 scheduled run times are listed

**Given** an invalid cron expression
**When** entered
**Then** an inline error explains which field is invalid

**Given** a 5-field and 6-field (with seconds) format
**When** either is entered
**Then** both formats are supported

**Given** preset examples
**When** available
**Then** common cron patterns are shown as clickable presets (hourly, daily, weekly, monthly)

**Library:** `cronstrue` (human-readable) + `cron-parser` (next runs) — lazy-loaded
**Unit tests:** Common patterns, all fields, invalid expressions, edge cases (Feb 29, leap years), 6-field format

### Story 14.2: Crontab Generator

As a **user**,
I want **to visually build a cron expression by selecting minute, hour, day, month, and weekday values**,
So that **I can create correct cron schedules without memorizing the syntax**.

**Category:** Time | **Emoji:** 📅 | **Key:** `crontab-generator`

**Acceptance Criteria:**

**Given** the crontab generator interface
**When** the user interacts
**Then** they can select values for each cron field: minute, hour, day of month, month, day of week

**Given** each field
**When** the user configures it
**Then** they can choose: specific values, ranges, intervals (*/N), or wildcard (*)

**Given** any field change
**When** the user adjusts a value
**Then** the cron expression updates in real-time
**And** a human-readable description updates simultaneously

**Given** the generated cron expression
**When** CopyButton is clicked
**Then** the expression is copied to clipboard

**Given** common presets
**When** selected (hourly, daily at midnight, weekly on Monday, etc.)
**Then** the fields are populated accordingly

**Library:** None (generation) + `cronstrue` (description) — lazy-loaded
**Unit tests:** All field types, ranges, intervals, wildcards, preset accuracy

### Story 14.3: Timezone Converter

As a **developer working with distributed teams**,
I want **to convert date/times between different timezones**,
So that **I can coordinate meetings and understand timestamps across time zones**.

**Category:** Time | **Emoji:** 🌍 | **Key:** `timezone-converter`

**Acceptance Criteria:**

**Given** the user selects a source timezone and enters a date/time
**When** a target timezone is selected
**Then** the converted date/time is displayed, accounting for DST

**Given** multiple target timezones can be added
**When** the user adds timezones
**Then** all target times are shown simultaneously

**Given** the "Now" button
**When** clicked
**Then** the current date/time is populated in the source timezone

**Given** all IANA timezones
**When** the timezone picker is used
**Then** timezones are searchable by name, city, or abbreviation (e.g., "PST", "Tokyo", "America/New_York")

**Given** a favorites feature
**When** the user stars a timezone
**Then** it appears at the top of the list for quick access (persisted in localStorage)

### Story 14.4: Unix Timestamp Converter

> **Note:** This was a baseline tool (old Epic 3, Story 3.5) with its own refactor spec.

As a **user**,
I want **the Unix Timestamp tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably convert between timestamps and human-readable dates with a consistent interface**.

**Category:** Time | **Emoji:** ⏱️ | **Key:** `unix-timestamp`

**Acceptance Criteria:**

**Given** the existing `TimeUnixTimestamp` component
**When** it is refactored
**Then** it uses `CopyButton` for output copying
**And** it is registered in `TOOL_REGISTRY`

**Given** a user enters a Unix timestamp (e.g., `1700000000`)
**When** the value is entered
**Then** the human-readable date/time appears in real-time (debounced 300ms)

**Given** a user enters a human-readable date
**When** the value is entered
**Then** the corresponding Unix timestamp appears in real-time

**Given** an invalid timestamp input
**When** validation fails
**Then** an inline error appears: "Enter a valid Unix timestamp (e.g., 1700000000)"

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: seconds vs milliseconds, negative timestamps (pre-1970), current time, date-to-timestamp, edge cases (epoch 0, far future)

---

## Epic 15: Unit Tools

**Category:** Unit | **Tools:** 2

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 15.1 | Aspect Ratio Calculator | aspect-ratio-calculator | 📐 | Old 23.1 |
| 15.2 | PX to REM | px-to-rem | 📏 | Baseline (Epic 3) |

### Story 15.1: Aspect Ratio Calculator

As a **designer/developer**,
I want **to calculate dimensions while preserving aspect ratios and convert between common ratios**,
So that **I can quickly determine correct dimensions for responsive layouts and media**.

**Category:** Unit | **Emoji:** 📐 | **Key:** `aspect-ratio-calculator`

**Acceptance Criteria:**

**Given** the user enters a width and aspect ratio (e.g., 16:9)
**When** either value changes
**Then** the corresponding height is calculated and displayed in real-time

**Given** the user enters width and height
**When** values are entered
**Then** the simplified aspect ratio is calculated (e.g., 1920x1080 -> 16:9)

**Given** common preset ratios (16:9, 4:3, 1:1, 21:9, 9:16)
**When** the user selects a preset
**Then** the ratio is applied and dimensions recalculated

**Given** the user locks one dimension
**When** changing the ratio
**Then** only the unlocked dimension updates

### Story 15.2: PX to REM Converter

> **Note:** This was a baseline tool (old Epic 3, Story 3.6) with its own refactor spec.

As a **user**,
I want **the PX to REM tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably convert between PX and REM units with a consistent interface**.

**Category:** Unit | **Emoji:** 📏 | **Key:** `px-to-rem`

**Acceptance Criteria:**

**Given** the existing `UnitPxToRem` component
**When** it is refactored
**Then** it uses `CopyButton` for output copying
**And** it is registered in `TOOL_REGISTRY`

**Given** a user enters a PX value
**When** the value is entered
**Then** the REM equivalent appears in real-time (debounced 300ms)
**And** a configurable base font size (default 16px) is available

**Given** a user changes the base font size
**When** the base is adjusted
**Then** all conversions update immediately to reflect the new base

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: standard conversion (16px = 1rem), custom base sizes, decimal values, zero, negative values, and large values

---

## Epic 16: Network Tools

**Category:** Network | **Tools:** 1

| Story | Tool | Key | Emoji | Source |
|-------|------|-----|-------|--------|
| 16.1 | IP Subnet Calculator | ip-subnet-calculator | 🌐 | Old 26.3 |

### Story 16.1: IP/Subnet Calculator

As a **developer/devops engineer**,
I want **to input CIDR notation or IP+subnet mask and see calculated network details**,
So that **I can plan and verify network configurations without manual binary math**.

**Category:** Network | **Emoji:** 🌐 | **Key:** `ip-subnet-calculator`

**Acceptance Criteria:**

**Given** the user enters CIDR notation (e.g., 192.168.1.0/24)
**When** entered
**Then** the following are displayed: Network Address, Broadcast Address, Subnet Mask, Wildcard Mask, First Usable Host, Last Usable Host, Total Hosts, CIDR notation

**Given** the user enters IP and subnet mask separately
**When** both are entered
**Then** the same calculations are performed

**Given** IPv4 addresses
**When** calculated
**Then** a binary representation of the IP and mask is shown with network/host bit coloring

**Given** an invalid IP or mask
**When** entered
**Then** a clear error message explains the issue

**Given** the user enters a /32 or /31 CIDR
**When** calculated
**Then** correct special-case handling is shown (single host or point-to-point)

---

## Appendix A: Technical Debt (Old Epic 11)

> The following stories from old Epic 11 are cross-cutting concerns that apply across all tool epics. They are not a numbered category epic but are tracked here for reference.

### Old Story 11.1: WCAG Accessibility Audit & Fix

As a **user relying on assistive technology**,
I want **all tools to have proper ARIA attributes on interactive controls and dynamic output regions**,
So that **I receive screen reader announcements when results change and can navigate all controls meaningfully**.

**Acceptance Criteria:**

**Given** all tool components
**When** they render dynamic output
**Then** each has `aria-live="polite"` on its primary output container

**Given** icon-only interactive controls (buttons, toggles)
**When** they render
**Then** each has `aria-label` describing its purpose

**Given** tool output containers
**When** they represent distinct content regions
**Then** they have `role="region"` with an `aria-label`

**Given** error message containers
**When** they render
**Then** all tools consistently use `role="alert"`

### Old Story 11.2: Async State Guard Hardening

As a **user interacting with tools that process input asynchronously**,
I want **all async/debounced tools to discard stale results when my input changes during processing**,
So that **I always see results that match my current input, never outdated results from a previous operation**.

**Acceptance Criteria:**

**Given** all tools using `useDebounceCallback` or async processing
**When** they are audited
**Then** each is classified as: guarded (has sessionRef), needs guard (async risk without protection), or no guard needed (synchronous API)

**Given** tools classified as "needs guard"
**When** session guards are added
**Then** the `sessionRef` generation counter pattern prevents stale state updates

**Given** the Hash Generator's multi-trigger pattern
**When** verified
**Then** all race conditions (text change, algorithm change, simultaneous change) are handled correctly

**Given** all image tools
**When** a new file is uploaded or input is rejected
**Then** ALL related state (source, result, metadata, error) is cleared

### Old Story 11.3: Input Validation Consistency

As a **user entering whitespace-only or edge-case input into text-based tools**,
I want **consistent behavior across all tools when my input is empty or whitespace-only**,
So that **I get clear, predictable feedback rather than confusing error messages or silent failures**.

**Acceptance Criteria:**

**Given** `JsonFormatter` empty-input detection
**When** the user enters whitespace-only input
**Then** it uses `val.trim().length === 0` consistent with `JsonToCsvConverter` and `JsonToYamlConverter`

**Given** encoding tools (`EncodingBase64`, `UrlEncoder`)
**When** whitespace is entered
**Then** they intentionally treat whitespace as valid input (no trim) — confirmed correct

**Given** the `ProgressBar` component
**When** imported by consumers
**Then** it is available via `@/components/common` barrel export

**Given** the `DiffChange` type
**When** imported
**Then** it is co-located in `src/types/` (not `src/utils/`)

---

## Previous Epic Mapping

For reference, this is how tools from the old epics (5-27) map to the new structure:

| Old Epic | New Epic(s) |
|----------|-------------|
| 5 (Encoding & Decoding) | 5 (Encoding) |
| 6 (Data & Format) | 6 (Data) |
| 7 (Text Analysis) | 7 (Text) |
| 8 (Generator) | 8 (Generator), 13 (Security) |
| 9 (CSS Visual) | 9 (CSS) |
| 10 (Advanced Image) | 10 (Image) |
| 11 (Tech Debt) | Retired — cross-cutting, see Appendix A |
| 12 (Code Formatters) | 11 (Code) |
| 13 (Data Converters) | 6 (Data), 5 (Encoding) |
| 14 (Crypto & Security) | 13 (Security) |
| 15 (CSS & Design) | 9 (CSS), 10 (Image) |
| 16 (Text Utilities) | 7 (Text) |
| 17 (Image & Media) | 10 (Image), 8 (Generator) |
| 18 (Dev Productivity) | 11 (Code), 14 (Time), 9 (CSS), 10 (Image), 7 (Text) |
| 19 (Dev Reference) | 9 (CSS), 6 (Data), 5 (Encoding), 7 (Text), 11 (Code) |
| 20 (Advanced Dev) | 11 (Code), 6 (Data), 14 (Time), 9 (CSS), 10 (Image) |
| 21 (AI Image) | 10 (Image) |
| 22 (Data Format) | 6 (Data) |
| 23 (Design & Visual) | 12 (Color), 10 (Image), 15 (Unit) |
| 24 (Security & Crypto) | 13 (Security) |
| 25 (Code & Schema) | 11 (Code) |
| 26 (Time & Diagram) | 14 (Time), 11 (Code), 16 (Network) |
| 27 (DB Diagram) | 6 (Data) |

## Adding New Tools

To add a new tool:
1. Identify which category it belongs to (matches `ToolCategory` type)
2. Add a new story to the corresponding epic (e.g., new CSS tool -> Epic 9, next story number)
3. If the tool doesn't fit any existing category, create a new epic (Epic 17+) with the new category
