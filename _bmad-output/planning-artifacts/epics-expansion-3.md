---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
inputDocuments:
  - prd-expansion-2026-02-18.md
  - product-brief-expansion-2026-02-18.md
  - architecture.md
  - ux-design-specification.md
  - project-context.md
---

# CSR Dev Tools — Expansion Epics (22–26)

## Overview

20 new tools across 5 epics, expanding CSR Dev Tools from 55 to 75 tools. All tools follow the established BMAD architecture patterns from Epics 1-21.

**Common Dependencies (all stories):**
- Epic 1: TOOL_REGISTRY, route constants, RoutePath typing
- Established patterns: per-tool layout, useToolError, CopyButton
- All libraries must be lazy-loaded (code-split) to maintain NFR8

**Common Acceptance Criteria (all stories):**
- Registered in TOOL_REGISTRY with complete metadata (key, name, category, emoji, description, seo, routePath, component)
- Uses useToolError for inline error handling
- Uses CopyButton for output copy
- 100% client-side processing (zero network requests)
- Unit tests covering happy paths, edge cases, error states
- E2E test in `e2e/{tool-key}.spec.ts`
- WCAG 2.1 AA: aria-live on output, aria-label on icon buttons, role="alert" on errors
- Mobile responsive down to 375px viewport
- TypeScript strict mode, oxlint/oxfmt compliant
- Lazy-loaded route via lazyRouteComponent

## Requirements Inventory

### Functional Requirements

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

Inherited from base PRD:
- NFR1/NFR2: <100ms text tools, <3s image/heavy tools
- NFR8: No increase to initial page load (code-split per tool)
- NFR9: Zero network requests for processing
- NFR14-NFR18: WCAG 2.1 AA
- NFR23-NFR25: Per-tool SEO

New:
- NFR-E3-01: Monaco Editor lazy-load with loading skeleton
- NFR-E3-02: Mermaid library lazy-load with loading skeleton
- NFR-E3-03: RSA 4096-bit generation progress indicator
- NFR-E3-04: Bcrypt hashing progress/elapsed time indicator

### Additional Requirements (Architecture)

- Follow existing tv() styling pattern with tailwind-variants
- Use Radix UI primitives for dialogs, selects, tabs
- Import from `motion/react` for animations
- Use `@/` path alias for all src imports
- Named exports for components, default exports for pages
- `type` over `interface`, `Generic<T>` over `T[]`

## FR Coverage Map

FR-E3-01 → Epic 22, Story 22.1 (YAML Formatter)
FR-E3-02 → Epic 22, Story 22.2 (ENV File Converter)
FR-E3-03 → Epic 22, Story 22.3 (Escaped JSON Stringifier)
FR-E3-04 → Epic 22, Story 22.4 (HTML Entity Converter)
FR-E3-05 → Epic 23, Story 23.1 (Aspect Ratio Calculator)
FR-E3-06 → Epic 23, Story 23.2 (Color Palette Generator)
FR-E3-07 → Epic 23, Story 23.3 (Placeholder Image Generator)
FR-E3-08 → Epic 23, Story 23.4 (Data URI Generator)
FR-E3-09 → Epic 24, Story 24.1 (SSH Key Fingerprint)
FR-E3-10 → Epic 24, Story 24.2 (Certificate Decoder)
FR-E3-11 → Epic 24, Story 24.3 (Bcrypt Hasher)
FR-E3-12 → Epic 24, Story 24.4 (Chmod Calculator)
FR-E3-13 → Epic 24, Story 24.5 (RSA Key Pair Generator)
FR-E3-14 → Epic 25, Story 25.1 (GraphQL Schema Viewer)
FR-E3-15 → Epic 25, Story 25.2 (Protobuf to JSON)
FR-E3-16 → Epic 25, Story 25.3 (TypeScript Playground)
FR-E3-17 → Epic 25, Story 25.4 (JSON Path Evaluator)
FR-E3-18 → Epic 26, Story 26.1 (Timezone Converter)
FR-E3-19 → Epic 26, Story 26.2 (Mermaid Renderer)
FR-E3-20 → Epic 26, Story 26.3 (IP/Subnet Calculator)

## Epic List

### Epic 22: Data Format Tools
Users can format, validate, and convert between configuration file formats and data interchange formats entirely in the browser.
**FRs covered:** FR-E3-01, FR-E3-02, FR-E3-03, FR-E3-04

### Epic 23: Design & Visual Tools
Users can calculate layout dimensions, generate color palettes, create placeholder assets, and encode files as data URIs for front-end development.
**FRs covered:** FR-E3-05, FR-E3-06, FR-E3-07, FR-E3-08

### Epic 24: Security & Crypto Tools
Users can inspect SSH keys and certificates, hash passwords with bcrypt, calculate file permissions, and generate RSA key pairs — all client-side for maximum privacy.
**FRs covered:** FR-E3-09, FR-E3-10, FR-E3-11, FR-E3-12, FR-E3-13

### Epic 25: Code & Schema Tools
Users can visualize GraphQL schemas, convert Protobuf definitions to JSON, experiment with TypeScript, and evaluate JSONPath queries.
**FRs covered:** FR-E3-14, FR-E3-15, FR-E3-16, FR-E3-17

### Epic 26: Time & Diagram Tools
Users can convert times between timezones, render Mermaid diagrams to SVG, and calculate IP subnet details.
**FRs covered:** FR-E3-18, FR-E3-19, FR-E3-20

---

## Epic 22: Data Format Tools

Users can format, validate, and convert between configuration file formats and data interchange formats entirely in the browser.

### Story 22.1: YAML Formatter/Validator

As a **developer**,
I want **to paste YAML and see it formatted with proper indentation, with validation errors highlighted**,
So that **I can clean up and validate YAML configuration files quickly**.

**Category:** Data | **Emoji:** 📋 | **Key:** `yaml-formatter`
**FRs:** FR-E3-01
**Dependencies:** js-yaml (already in project)

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

### Story 22.2: ENV File Converter

As a **developer**,
I want **to convert between .env format and JSON/YAML formats**,
So that **I can quickly transform configuration between different file formats**.

**Category:** Data | **Emoji:** 🔄 | **Key:** `env-file-converter`
**FRs:** FR-E3-02

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

### Story 22.3: Escaped JSON Stringifier

As a **developer**,
I want **to escape JSON for embedding in strings (e.g., in code or config files) and unescape them back**,
So that **I can safely embed JSON in contexts that require string escaping**.

**Category:** Data | **Emoji:** 🔤 | **Key:** `escaped-json-stringifier`
**FRs:** FR-E3-03

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

### Story 22.4: HTML Entity Converter

As a **developer**,
I want **to encode text into HTML entities and decode HTML entities back to text**,
So that **I can safely handle special characters in HTML content**.

**Category:** Data | **Emoji:** 🏷️ | **Key:** `html-entity-converter`
**FRs:** FR-E3-04

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

---

## Epic 23: Design & Visual Tools

Users can calculate layout dimensions, generate color palettes, create placeholder assets, and encode files as data URIs for front-end development.

### Story 23.1: Aspect Ratio Calculator

As a **designer/developer**,
I want **to calculate dimensions while preserving aspect ratios and convert between common ratios**,
So that **I can quickly determine correct dimensions for responsive layouts and media**.

**Category:** Design | **Emoji:** 📐 | **Key:** `aspect-ratio-calculator`
**FRs:** FR-E3-05

**Acceptance Criteria:**

**Given** the user enters a width and aspect ratio (e.g., 16:9)
**When** either value changes
**Then** the corresponding height is calculated and displayed in real-time

**Given** the user enters width and height
**When** values are entered
**Then** the simplified aspect ratio is calculated (e.g., 1920×1080 → 16:9)

**Given** common preset ratios (16:9, 4:3, 1:1, 21:9, 9:16)
**When** the user selects a preset
**Then** the ratio is applied and dimensions recalculated

**Given** the user locks one dimension
**When** changing the ratio
**Then** only the unlocked dimension updates

### Story 23.2: Color Palette Generator

As a **designer/developer**,
I want **to generate harmonious color palettes from a base color**,
So that **I can quickly create consistent color schemes for my projects**.

**Category:** Design | **Emoji:** 🎨 | **Key:** `color-palette-generator`
**FRs:** FR-E3-06

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

### Story 23.3: Placeholder Image Generator

As a **developer**,
I want **to generate placeholder images with custom dimensions, colors, and text**,
So that **I can use them in mockups and development without external services**.

**Category:** Design | **Emoji:** 🖼️ | **Key:** `placeholder-image-generator`
**FRs:** FR-E3-07

**Acceptance Criteria:**

**Given** the user enters width and height (e.g., 800×600)
**When** values are entered
**Then** a placeholder image is rendered in a canvas with the specified dimensions

**Given** the user customizes background color and text color
**When** colors are changed
**Then** the preview updates in real-time

**Given** the user enters custom text (or uses default "{W}×{H}")
**When** text is entered
**Then** it's centered on the placeholder image

**Given** common size presets (thumbnail 150×150, banner 1200×630, avatar 200×200, hero 1920×1080)
**When** a preset is selected
**Then** dimensions are populated

**Given** the generated placeholder
**When** the user clicks "Download PNG" or "Download SVG"
**Then** the image is downloaded in the selected format

### Story 23.4: Data URI Generator

As a **developer**,
I want **to convert files to data URIs and decode data URIs back to files**,
So that **I can embed small assets directly in HTML/CSS without extra HTTP requests**.

**Category:** Data | **Emoji:** 🔗 | **Key:** `data-uri-generator`
**FRs:** FR-E3-08

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

---

## Epic 24: Security & Crypto Tools

Users can inspect SSH keys and certificates, hash passwords with bcrypt, calculate file permissions, and generate RSA key pairs — all client-side for maximum privacy.

### Story 24.1: SSH Key Fingerprint Viewer

As a **developer/devops engineer**,
I want **to paste an SSH public key and see its fingerprint in standard formats**,
So that **I can verify SSH key identity without using the command line**.

**Category:** Security | **Emoji:** 🔑 | **Key:** `ssh-key-fingerprint`
**FRs:** FR-E3-09

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

### Story 24.2: Certificate Decoder

As a **developer/devops engineer**,
I want **to paste a PEM-encoded X.509 certificate and see its decoded details**,
So that **I can inspect certificate properties without openssl CLI**.

**Category:** Security | **Emoji:** 📜 | **Key:** `certificate-decoder`
**FRs:** FR-E3-10
**Dependencies:** asn1js + pkijs (or lightweight ASN.1 parser)

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

### Story 24.3: Bcrypt Hasher

As a **developer**,
I want **to hash passwords with bcrypt and verify plaintext against bcrypt hashes**,
So that **I can generate and test password hashes during development**.

**Category:** Security | **Emoji:** 🔒 | **Key:** `bcrypt-hasher`
**FRs:** FR-E3-11
**Dependencies:** bcryptjs

**Acceptance Criteria:**

**Given** the user enters a plaintext password
**When** "Hash" mode is active and a cost factor is selected (4-31, default 10)
**Then** a bcrypt hash is generated and displayed

**Given** bcrypt hashing is in progress (especially high cost factors)
**When** hashing
**Then** a progress indicator and elapsed time are shown (NFR-E3-04)

**Given** the user enters plaintext and a bcrypt hash
**When** "Verify" mode is active
**Then** the result shows "Match ✅" or "No Match ❌"

**Given** an invalid bcrypt hash format
**When** entered for verification
**Then** an error explains the expected format ($2a$/$2b$/$2y$ prefix)

### Story 24.4: Chmod Calculator

As a **developer/devops engineer**,
I want **to convert between symbolic (rwxr-xr-x), octal (755), and visual (checkbox) chmod notations**,
So that **I can quickly determine correct file permissions**.

**Category:** Security | **Emoji:** 🛡️ | **Key:** `chmod-calculator`
**FRs:** FR-E3-12

**Acceptance Criteria:**

**Given** the user enters an octal permission (e.g., 755)
**When** entered
**Then** the symbolic notation (rwxr-xr-x) and a 3×3 checkbox grid (owner/group/other × read/write/execute) are updated

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

### Story 24.5: RSA Key Pair Generator

As a **developer**,
I want **to generate RSA key pairs entirely in the browser**,
So that **I can create keys for development without installing tools, knowing my private key never leaves the browser**.

**Category:** Security | **Emoji:** 🔐 | **Key:** `rsa-key-generator`
**FRs:** FR-E3-13
**Dependencies:** Web Crypto API (native)

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

---

## Epic 25: Code & Schema Tools

Users can visualize GraphQL schemas, convert Protobuf definitions to JSON, experiment with TypeScript, and evaluate JSONPath queries.

### Story 25.1: GraphQL Schema Viewer

As a **developer**,
I want **to paste a GraphQL schema (SDL) and browse its types, fields, and relationships**,
So that **I can explore API schemas without running a GraphQL server**.

**Category:** Code | **Emoji:** 📊 | **Key:** `graphql-schema-viewer`
**FRs:** FR-E3-14
**Dependencies:** graphql package

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

### Story 25.2: Protobuf to JSON

As a **developer**,
I want **to paste .proto definitions and see corresponding JSON structures**,
So that **I can understand the JSON shape of Protobuf messages without running protoc**.

**Category:** Code | **Emoji:** 📦 | **Key:** `protobuf-to-json`
**FRs:** FR-E3-15
**Dependencies:** protobufjs

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

### Story 25.3: TypeScript Playground

As a **developer**,
I want **to write TypeScript in a browser-based editor with real-time type checking and JS output**,
So that **I can quickly experiment with TypeScript without setting up a project**.

**Category:** Code | **Emoji:** 🏗️ | **Key:** `typescript-playground`
**FRs:** FR-E3-16
**Dependencies:** @monaco-editor/react, typescript (via Monaco's built-in TS worker)

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

### Story 25.4: JSON Path Evaluator

As a **developer**,
I want **to paste JSON and evaluate JSONPath expressions against it**,
So that **I can test and debug JSONPath queries for API data extraction**.

**Category:** Code | **Emoji:** 🎯 | **Key:** `jsonpath-evaluator`
**FRs:** FR-E3-17
**Dependencies:** jsonpath-plus

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

---

## Epic 26: Time & Diagram Tools

Users can convert times between timezones, render Mermaid diagrams to SVG, and calculate IP subnet details.

### Story 26.1: Timezone Converter

As a **developer working with distributed teams**,
I want **to convert date/times between different timezones**,
So that **I can coordinate meetings and understand timestamps across time zones**.

**Category:** Time | **Emoji:** 🌍 | **Key:** `timezone-converter`
**FRs:** FR-E3-18

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

### Story 26.2: Mermaid Diagram Renderer

As a **developer/technical writer**,
I want **to write Mermaid diagram syntax and see a live SVG preview**,
So that **I can create and iterate on diagrams without embedding them in markdown renderers**.

**Category:** Code | **Emoji:** 🧜 | **Key:** `mermaid-renderer`
**FRs:** FR-E3-19
**Dependencies:** mermaid

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

### Story 26.3: IP/Subnet Calculator

As a **developer/devops engineer**,
I want **to input CIDR notation or IP+subnet mask and see calculated network details**,
So that **I can plan and verify network configurations without manual binary math**.

**Category:** Network | **Emoji:** 🌐 | **Key:** `ip-subnet-calculator`
**FRs:** FR-E3-20

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
