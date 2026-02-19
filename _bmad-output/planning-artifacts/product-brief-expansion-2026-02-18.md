---
stepsCompleted: ['step-01-init', 'step-02-vision', 'step-03-users', 'step-04-metrics', 'step-05-scope', 'step-06-complete']
status: complete
date: '2026-02-18'
author: 'boengai'
inputDocuments:
  - product-brief-expansion-2026-02-17.md
  - architecture.md
  - prd.md
  - project-context.md
  - docs/index.md
  - docs/project-overview.md
  - docs/component-inventory.md
---

# CSR Dev Tools — Expansion Product Brief (2026-02-18)

## Executive Summary

Expand CSR Dev Tools from 55 tools to **75 tools** by adding 20 high-demand client-side developer utilities across 5 new categories: data format tools, design & visual tools, security & crypto tools, code & schema tools, and time & diagram tools. All new tools follow the established architecture (TOOL_REGISTRY, per-tool layout, useToolError, CopyButton pattern) and maintain 100% client-side processing.

## Product Vision

### Problem Statement

Despite having 55 tools, CSR Dev Tools still lacks common utilities that developers frequently search for — YAML formatting, certificate inspection, timezone conversion, chmod calculation, and visual diagram rendering. Developers currently rely on scattered, ad-heavy websites for these needs.

### Solution

Add 20 carefully selected tools that fill the most impactful gaps in the current toolset. Each tool follows the established patterns for consistent UX, accessibility, and performance. The expansion targets 5 distinct developer workflow areas:

1. **Data Format Tools** — Configuration file and data interchange utilities
2. **Design & Visual Tools** — Layout calculation, color generation, and asset creation
3. **Security & Crypto Tools** — Key management, hashing, and permission calculation
4. **Code & Schema Tools** — Schema visualization, type conversion, and code exploration
5. **Time & Diagram Tools** — Temporal conversion and visual documentation

### Unique Value Proposition

- **100% client-side** — No data leaves the browser; safe for secrets, keys, and certificates
- **Consistent UX** — Every tool follows the same interaction patterns
- **Privacy-first** — Critical for security tools (SSH keys, certificates, bcrypt)
- **No ads, no tracking** — Clean developer experience

## Target Users

### Primary: Web & Full-Stack Developers (unchanged from existing brief)
- Need quick data format conversions during development
- Handle security artifacts (certificates, SSH keys) regularly
- Work across timezones with distributed teams
- Create documentation with diagrams

### Secondary: DevOps & Infrastructure Engineers
- Chmod calculator, SSH key fingerprints, certificate inspection
- IP/subnet calculation for network configuration
- YAML formatting for Kubernetes/Docker configs

### Tertiary: Technical Writers & Designers
- Mermaid diagram rendering for documentation
- Placeholder image generation for mockups
- Color palette generation for design systems

## Success Metrics

- Expand from 55 to 75 tools
- Maintain Lighthouse Performance ≥90, Accessibility ≥90, SEO ≥90
- All new tools have unit tests (vitest) + E2E tests (playwright)
- Zero increase in initial page load time (code-split per tool)
- All tools process in <500ms for typical inputs
- WCAG 2.1 AA compliance on all new tools

## Scope: 5 Epics, 20 Tools

### Epic 22: Data Format Tools (4 tools)

| Tool | Description | Key Features |
|------|-------------|--------------|
| YAML Formatter/Validator | Format, validate, and prettify YAML | Syntax highlighting, error reporting, indent control |
| ENV File Converter | Convert between .env and JSON/YAML/TOML | Bidirectional conversion, comment preservation |
| Escaped JSON Stringifier | Escape/unescape JSON strings | Double-encoding, pretty print, copy escaped output |
| HTML Entity Converter | Encode/decode HTML entities | Named & numeric entities, bulk conversion |

### Epic 23: Design & Visual Tools (4 tools)

| Tool | Description | Key Features |
|------|-------------|--------------|
| Aspect Ratio Calculator | Calculate and convert aspect ratios | Common presets, custom ratios, dimension scaling |
| Color Palette Generator | Generate harmonious color palettes | Complementary, analogous, triadic, monochromatic schemes |
| Placeholder Image Generator | Create placeholder images with custom dimensions | Text overlay, colors, common sizes, download |
| Data URI Generator | Convert files to data URIs | File upload, MIME type detection, size display |

### Epic 24: Security & Crypto Tools (5 tools)

| Tool | Description | Key Features |
|------|-------------|--------------|
| SSH Key Fingerprint Viewer | Display fingerprints from SSH public keys | MD5/SHA256 formats, key type detection |
| Certificate Decoder | Parse and display X.509 certificate details | PEM input, validity dates, issuer/subject, extensions |
| Bcrypt Hasher | Hash and verify bcrypt passwords | Configurable rounds, verify against hash |
| Chmod Calculator | Convert between chmod notations | Symbolic ↔ octal ↔ visual checkboxes |
| RSA Key Pair Generator | Generate RSA key pairs client-side | Key size selection (2048/4096), PEM export |

### Epic 25: Code & Schema Tools (4 tools)

| Tool | Description | Key Features |
|------|-------------|--------------|
| GraphQL Schema Viewer | Parse and visualize GraphQL schemas | Type browser, field details, syntax highlighting |
| Protobuf to JSON | Convert Protocol Buffer definitions to JSON | .proto parsing, sample JSON generation |
| TypeScript Playground | Write and type-check TypeScript in-browser | Monaco editor, real-time type errors, JS output |
| JSON Path Evaluator | Query JSON with JSONPath expressions | Live evaluation, path suggestions, result highlighting |

### Epic 26: Time & Diagram Tools (3 tools)

| Tool | Description | Key Features |
|------|-------------|--------------|
| Timezone Converter | Convert times between timezones | All IANA timezones, DST awareness, favorites |
| Mermaid Diagram Renderer | Render Mermaid diagram syntax to SVG | Live preview, export SVG/PNG, syntax help |
| IP/Subnet Calculator | Calculate network details from CIDR | Subnet mask, broadcast, host range, binary view |

### Out of Scope (Future)

- Tool chaining/pipelines between tools
- User accounts or cloud sync
- Server-side processing
- Collaborative/shared tool sessions

## Technical Constraints

- All processing must be 100% client-side (no API calls)
- Each tool must be code-split (lazy-loaded route)
- Must follow existing patterns: TOOL_REGISTRY, route constants, tv() styling, Radix UI primitives
- TypeScript strict mode, oxlint/oxfmt compliance
- Unit tests (vitest) and E2E tests (playwright) required per tool

## Dependencies & Libraries (estimated)

- **Mermaid** — `mermaid` for diagram rendering
- **Monaco Editor** — `@monaco-editor/react` for TypeScript Playground
- **ASN1.js or similar** — for certificate parsing (or manual DER/PEM parsing)
- **bcrypt.js** — `bcryptjs` for client-side bcrypt
- **js-yaml** — already in project for YAML tools
- **Web Crypto API** — for RSA key generation (native browser API)
- **graphql** — `graphql` package for schema parsing
- **protobufjs** — `protobufjs` for protobuf parsing
- **jsonpath-plus** — for JSONPath evaluation
