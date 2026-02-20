# CSR Dev Tools — Expansion Product Brief (2026-02-17)

## Executive Summary

Expand CSR Dev Tools from 19 tools (9 categories) to **40+ tools (14 categories)** by adding high-demand client-side developer utilities. All new tools follow the established BMAD architecture (TOOL_REGISTRY, per-tool layout, CopyButton pattern) and maintain 100% client-side processing.

## Market Analysis

### Competitor Landscape

| Platform | Tools | Strengths | Gaps CSR Can Fill |
|----------|-------|-----------|-------------------|
| it-tools.tech | 70+ | Broad coverage, self-hostable | Better UX, visual tools, image processing |
| codebeautify.org | 200+ | SEO dominance, massive tool count | Bloated, ad-heavy, server-dependent |
| transform.tools | 30+ | Clean code transforms | Limited scope, no generators |
| devtoolbox.co | 10+ | Simple UX | Very limited tool count |

### Most Searched Dev Tools (not yet in CSR)

1. **QR Code Generator** — ~500K monthly searches
2. **CSS Gradient Generator** — ~200K monthly searches
3. **Markdown Preview** — ~150K monthly searches
4. **SQL Formatter** — ~120K monthly searches
5. **Text Case Converter** — ~100K monthly searches
6. **Word Counter** — ~300K monthly searches (high SEO value)
7. **Lorem Ipsum Generator** — ~80K monthly searches
8. **HTML Formatter** — ~90K monthly searches
9. **Base64 Image Converter** — ~70K monthly searches
10. **Number Base Converter** — ~60K monthly searches

### Key Differentiators

- **100% client-side** — privacy-first, no data leaves the browser
- **Consistent UX** — every tool follows the same layout pattern
- **Dark cosmic theme** — visually distinctive, developer-friendly
- **Accessible** — WCAG 2.1 AA across all tools
- **No ads, no tracking** — clean developer experience

## Proposed Expansion: 6 New Epics (21 Tools)

### Epic 12: Code & Markup Formatters (5 tools)
- HTML Formatter/Beautifier
- CSS Formatter/Minifier
- JavaScript Minifier
- SQL Formatter
- Markdown Preview

### Epic 13: Data & Number Converters (4 tools)
- XML ↔ JSON Converter
- TOML ↔ JSON Converter
- HTML ↔ Markdown Converter
- Number Base Converter (bin/oct/dec/hex)

### Epic 14: Crypto & Security Tools (2 tools)
- HMAC Generator
- AES Encrypt/Decrypt

### Epic 15: CSS & Design Tools (3 tools)
- CSS Gradient Generator
- CSS Flexbox Playground
- SVG Viewer/Optimizer

### Epic 16: Text Utilities (4 tools)
- Text Case Converter
- Word/Character Counter
- Lorem Ipsum Generator
- String Escape/Unescape

### Epic 17: Image & Media Tools (3 tools)
- QR Code Generator
- Image to Base64
- Base64 to Image

## Success Metrics

- Expand from 19 to 40 tools
- Maintain Lighthouse Performance 90+, Accessibility 90+, SEO 90+
- All new tools have unit tests + E2E tests
- Zero increase in initial page load time (code-split per tool)

## Technical Constraints

- All processing 100% client-side (no server calls)
- Heavy libraries (SQL parser, TOML, markdown, QR, SVGO) must be code-split and lazy-loaded
- Follow existing TOOL_REGISTRY + per-tool layout + CopyButton patterns
- TypeScript strict mode, Vitest unit tests, Playwright E2E
