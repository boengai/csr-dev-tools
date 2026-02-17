# Epic 17 Retrospective: Image & Media Tools

**Date:** 2026-02-17
**Epic Status:** Done (backfill retro — all stories completed before this document was created)

## Epic Summary & Metrics

**Delivery:**

- Stories completed: 3/3 (100%)
- Story 17-1: QR Code Generator — done
- Story 17-2: Image to Base64 — done
- Story 17-3: Base64 to Image — done
- Production incidents: 0

**Quality:**

- Tests: 8 new tests across 3 spec files (qr-code: 4, image-base64: 3, base64-image: 1)
- 0 regressions
- **Lowest test count of any epic in 12-17** — file/image tools have limited unit testability in Node environment

**Tools Added:**

- QR Code Generator (`qr-code-generator`) — generate QR codes from text/URLs via qrcode library
- Image to Base64 (`image-to-base64`) — convert uploaded images to Base64 data URIs
- Base64 to Image (`base64-to-image`) — convert Base64 strings back to downloadable images

**New Dependencies:** 1 (`qrcode`)

**Files Added/Modified:**

| Type | Files |
|------|-------|
| Components | `QrCodeGenerator.tsx`, `ImageToBase64.tsx`, `Base64ToImage.tsx`, `generator/index.ts`, `image/index.ts` |
| Utils | `qr-code.ts`, `image-base64.ts`, `base64-image.ts` |
| Specs | `qr-code.spec.ts`, `image-base64.spec.ts`, `base64-image.spec.ts` |
| Config | `tool-registry.ts`, `route.ts`, `feature.ts` |

## What Went Well

- **Completes the image tool category** — Combined with Epic 10's Image Compressor/Cropper and existing tools (Resizer, Converter, Color Picker), the image category is now comprehensive.
- **QR Code Generator is high-utility** — One of the most commonly needed developer tools. Quick implementation with the qrcode library.
- **Image↔Base64 tools are complementary** — 17-2 and 17-3 form a natural pair, like the bidirectional converters in Epic 13.
- **Only 1 new dependency** — qrcode is the only external library. Image↔Base64 conversion uses native browser APIs (FileReader, Canvas).

## What Didn't Go Well

- **Story artifacts were not created before implementation** — Sixth and final consecutive epic without upfront story artifacts. All 3 story documents (17-1 through 17-3) were backfilled. This completes a streak of 21 stories (Epics 12-17) without any story artifacts created before implementation.
- **Only 8 tests — lowest of any epic in 12-17** — Base64 to Image has just 1 test. Image/file tools depend on browser APIs (FileReader, Canvas, Blob) that are difficult to test in a Node/jsdom environment, but the gap is significant.
- **Base64 to Image has 1 test** — This is effectively untested. A tool that parses user-provided Base64 strings and attempts to render them as images has many failure modes that are not covered.
- **No file size limits or validation documented** — Image tools should have documented limits for maximum file size, supported formats, and error handling for malformed input.

## Key Insights

1. **Image/file tools have a structural testing gap** — Browser APIs (FileReader, Canvas, Blob, URL.createObjectURL) don't work in Node test environments. The project needs a strategy: either mock these APIs consistently, or accept that image tools will have lower test coverage and compensate with manual testing.
2. **1 test is not acceptable for any tool** — Base64 to Image needs more tests, even if they test the utility layer rather than the full browser flow.
3. **Six consecutive epics without story artifacts is a systemic process failure** — 21 stories, 21 tools, 162 tests, all delivered without a single story artifact created upfront. The backfill of all 21 story documents after completion is unprecedented technical debt in process terms.
4. **The project now has 40+ tools** — The tool registry has grown substantially across Epics 12-17. With this scale, consistent documentation and testing standards become more important, not less.

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | **Mandatory: Create story artifacts before implementation for ALL future epics** — 6 epics (12-17) and 21 stories delivered without this. The backfill proved the gap. No more exceptions. | SM | CRITICAL |
| 2 | Add more Base64 to Image tests — 1 test is insufficient | Dev | HIGH |
| 3 | Establish browser API mocking strategy for image/file tool tests | Dev | MEDIUM |
| 4 | Document file size limits and supported formats for all image tools | Dev | LOW |

## Team Agreements

**Continued from Epics 12-16:**

- Story artifacts MUST be created before implementation begins
- Zero-dependency preference; document rationale for new deps
- Pure function testing strategy
- Crypto tools need security review
- Visual tools need accessibility review
- Random/generator tools document test strategy

**New:**

- Minimum test threshold: no tool ships with fewer than 3 utility tests
- Image/file tools need a documented browser API mocking strategy
- Bidirectional tools (encode↔decode, format↔parse) should always test both directions

---

## Epics 12-17 Summary

**Aggregate across 6 epics:**

| Metric | Value |
|--------|-------|
| Epics completed | 6 |
| Stories completed | 21 |
| New tests | 162 |
| Total project tests | 752 |
| New tools | 21 |
| New dependencies | 7 (js-beautify, sql-formatter, marked, fast-xml-parser, yaml, turndown, qrcode) |
| Story artifacts created before implementation | 0/21 |
| Story artifacts backfilled after completion | 21/21 |
| Production incidents | 0 |

**The single most important lesson from Epics 12-17:** Process artifacts are not bureaucracy — they are the infrastructure that enables quality practices. Without them, Previous Story Intelligence, code review tracking, acceptance criteria, security reviews, and accessibility audits all stop happening. The code worked. The process didn't.
