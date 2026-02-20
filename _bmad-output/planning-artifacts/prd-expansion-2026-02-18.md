---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
inputDocuments:
  - product-brief-expansion-2026-02-18.md
  - prd.md
  - architecture.md
  - project-context.md
  - epics-expansion.md
workflowType: 'prd-expansion'
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: brownfield
date: 2026-02-18
author: csrteam
project_name: csr-dev-tools
---

# PRD Expansion — CSR Dev Tools (2026-02-18)

**Author:** csrteam
**Date:** 2026-02-18
**Base PRD:** prd.md (2026-02-11)

## Executive Summary

This expansion adds 20 new tools across 5 epics (22–26), growing CSR Dev Tools from 55 to 75 tools. All tools maintain the platform's core principles: 100% client-side processing, zero tracking, WCAG 2.1 AA accessibility, and consistent UX patterns.

## Scope

### New Functional Requirements

#### FR-E3-01: YAML Formatting & Validation
Users can paste YAML and see it formatted with proper indentation, with syntax validation and error reporting.

#### FR-E3-02: ENV File Conversion
Users can convert between .env format and JSON/YAML/TOML, with bidirectional conversion and comment handling.

#### FR-E3-03: Escaped JSON Stringification
Users can escape JSON strings for embedding in code (double-encoding) and unescape them back, with pretty-print output.

#### FR-E3-04: HTML Entity Encoding/Decoding
Users can encode text to HTML entities (named & numeric) and decode HTML entities back to text.

#### FR-E3-05: Aspect Ratio Calculation
Users can calculate aspect ratios, scale dimensions while preserving ratios, and use common presets (16:9, 4:3, etc.).

#### FR-E3-06: Color Palette Generation
Users can generate harmonious color palettes from a base color using complementary, analogous, triadic, split-complementary, and monochromatic schemes.

#### FR-E3-07: Placeholder Image Generation
Users can generate placeholder images with custom dimensions, background color, text overlay, and download them as PNG/SVG.

#### FR-E3-08: Data URI Generation
Users can upload files and convert them to data URIs with MIME type detection, or paste data URIs and decode them.

#### FR-E3-09: SSH Key Fingerprint Viewing
Users can paste SSH public keys and see their fingerprints in MD5 and SHA256 formats, with key type and bit size detection.

#### FR-E3-10: X.509 Certificate Decoding
Users can paste PEM-encoded certificates and see decoded details: subject, issuer, validity dates, serial number, extensions, and public key info.

#### FR-E3-11: Bcrypt Hashing & Verification
Users can hash passwords with bcrypt (configurable cost factor 4–31) and verify plaintext against existing bcrypt hashes.

#### FR-E3-12: Chmod Permission Calculation
Users can convert between symbolic (rwxr-xr-x), octal (755), and visual (checkbox grid) chmod notations bidirectionally.

#### FR-E3-13: RSA Key Pair Generation
Users can generate RSA key pairs (2048/4096 bit) entirely client-side using Web Crypto API, with PEM export.

#### FR-E3-14: GraphQL Schema Viewing
Users can paste GraphQL SDL and browse types, fields, arguments, and directives in a structured viewer.

#### FR-E3-15: Protobuf to JSON Conversion
Users can paste .proto definitions and generate sample JSON structures matching the message types.

#### FR-E3-16: TypeScript Playground
Users can write TypeScript in a Monaco editor with real-time type checking, error display, and transpiled JavaScript output.

#### FR-E3-17: JSON Path Evaluation
Users can paste JSON and evaluate JSONPath expressions with live results, path suggestions, and result highlighting.

#### FR-E3-18: Timezone Conversion
Users can convert date/times between any IANA timezones with DST awareness, favorites list, and current time display.

#### FR-E3-19: Mermaid Diagram Rendering
Users can write Mermaid diagram syntax and see live SVG preview, with export to SVG/PNG and syntax reference.

#### FR-E3-20: IP/Subnet Calculation
Users can input CIDR notation or IP+mask and see network address, broadcast, host range, subnet mask, and binary representation.

### Non-Functional Requirements (inherited from base PRD)

All NFRs from the base PRD apply unchanged:
- NFR1/NFR2: <100ms text tools, <3s image tools
- NFR8: No increase to initial page load (code-split)
- NFR9: Zero network requests for processing
- NFR14-NFR18: WCAG 2.1 AA
- NFR23-NFR25: Per-tool SEO

### New NFR Considerations

- **NFR-E3-01:** Monaco Editor (TypeScript Playground) must lazy-load the editor bundle (~2MB) — show loading skeleton until ready
- **NFR-E3-02:** Mermaid library (~1.5MB) must lazy-load — show loading skeleton until ready
- **NFR-E3-03:** RSA key generation may take 1-3s for 4096-bit — show progress indicator
- **NFR-E3-04:** Bcrypt hashing is intentionally slow (configurable) — show progress and elapsed time

### Dependencies (new packages)

| Package | Tool | Purpose | Estimated Size |
|---------|------|---------|----------------|
| `mermaid` | Mermaid Renderer | Diagram rendering | ~1.5MB (lazy) |
| `@monaco-editor/react` | TS Playground | Code editor | ~2MB (lazy) |
| `bcryptjs` | Bcrypt Hasher | Password hashing | ~30KB |
| `graphql` | GraphQL Schema Viewer | Schema parsing | ~100KB |
| `protobufjs` | Protobuf to JSON | Proto parsing | ~150KB |
| `jsonpath-plus` | JSON Path Evaluator | JSONPath engine | ~30KB |
| `js-yaml` | YAML Formatter | Already in project | — |
| Web Crypto API | RSA Key Gen | Native browser API | 0 |
| `asn1js` + `pkijs` | Certificate Decoder | X.509 parsing | ~200KB |

### Out of Scope

- Tool chaining/pipelines
- User accounts or cloud sync
- Server-side processing
- Real-time collaboration
- Package version upgrades for existing tools
