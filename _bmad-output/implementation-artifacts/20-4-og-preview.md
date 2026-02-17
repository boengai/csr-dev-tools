---
story: 20.4
title: Open Graph Preview
status: review
epic: 20
---

# Story 20.4: Open Graph Preview

Status: review

## Story

As a **user**,
I want **to enter OG meta tag values (title, description, image URL, site name) and see a preview of how the link will appear on Twitter, Facebook, and LinkedIn**,
So that **I can design social sharing cards before deploying**.

**Epic:** Epic 20 — Advanced Developer Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 20-4-og-preview

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the OG Preview tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it (via sidebar, command palette, or `/tools/og-preview` route)
**Then** it renders inline with input fields and preview cards
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: OG Input Fields

**Given** the tool renders
**When** the user sees the inputs
**Then** fields are available for: og:title, og:description, og:image (URL), og:site_name, og:url
**And** each field has a descriptive label and placeholder

### AC3: Twitter Preview Card

**Given** input values are provided
**When** the preview section renders
**Then** a Twitter summary_large_image card preview is shown with: large image area, title below, description truncated, site name
**And** the preview updates immediately on input change

### AC4: Facebook Preview Card

**Given** input values are provided
**When** the preview section renders
**Then** a Facebook share preview is shown with: image, title, description, domain name
**And** styled to match Facebook's sharing card appearance

### AC5: LinkedIn Preview Card

**Given** input values are provided
**When** the preview section renders
**Then** a LinkedIn share preview is shown with: image, title, source/site name
**And** styled to match LinkedIn's sharing card appearance

### AC6: Generate Meta Tags with Copy

**Given** configured OG values
**When** the user views the output
**Then** complete `<meta>` tag HTML is generated including og:title, og:description, og:image, og:site_name, og:url, twitter:card, twitter:title, twitter:description, twitter:image
**And** a `CopyButton` copies all meta tags

### AC7: Sensible Defaults

**Given** the tool loads
**When** the page renders
**Then** placeholder text guides the user in each field
**And** preview cards show placeholder styling when fields are empty

### AC8: Unit Tests Cover Meta Tag Generation

**Given** unit tests in `src/utils/og-tags.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: full config generates all meta tags, partial config (missing optional fields), empty config, twitter:card meta tag included, HTML escaping of special characters

## Tasks / Subtasks

- [x] Task 1: Create og-tags utility (AC: #6, #8)
  - [x] 1.1 Create `src/utils/og-tags.ts`
  - [x] 1.2 Define `OgConfig` type
  - [x] 1.3 Implement `generateOgMetaTags(config: OgConfig): string`
  - [x] 1.4 Include og: tags + twitter: card tags in output
  - [x] 1.5 HTML-escape attribute values (quotes, ampersands, angle brackets)
  - [x] 1.6 Skip empty fields — only generate tags for non-empty values
  - [x] 1.7 Export `generateOgMetaTags`, `OgConfig`

- [x] Task 2: Write unit tests (AC: #8)
  - [x] 2.1 Create `src/utils/og-tags.spec.ts`
  - [x] 2.2 Test full config generates all og + twitter tags
  - [x] 2.3 Test partial config only generates provided fields
  - [x] 2.4 Test empty config generates empty string
  - [x] 2.5 Test twitter:card is summary_large_image when image provided
  - [x] 2.6 Test HTML escaping of quotes and ampersands
  - [x] 2.7 Test twitter:card is summary when no image

- [x] Task 3: Create OgPreview component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 3.1 Create `src/components/feature/data/OgPreview.tsx` as named export
  - [x] 3.2 Render inline layout: inputs on top, preview cards below
  - [x] 3.3 Input fields via FieldForm for all 5 OG fields
  - [x] 3.4 Twitter card preview with platform styling
  - [x] 3.5 Facebook card preview with platform styling
  - [x] 3.6 LinkedIn card preview with platform styling
  - [x] 3.7 Meta tags output with CopyButton
  - [x] 3.8 Show tool description from registry
  - [x] 3.9 All preview cards update immediately (synchronous)

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add 'og-preview' to ToolRegistryKey union
  - [x] 4.2 Add registry entry (Data category, 🔖 emoji)
  - [x] 4.3 Add pre-render route in vite.config.ts

- [x] Task 5: Create barrel exports (AC: #1)
  - [x] 5.1 Add export to data/index.ts
  - [x] 5.2 Add export to utils/index.ts

- [x] Task 6: Verify integration (AC: #1–#8)
  - [x] 6.1 Run `pnpm test` — all 841 tests pass (7 new)
  - [x] 6.2 Run `npx tsc --noEmit` — clean
  - [x] 6.3 All tasks complete

## Dev Notes

### Processing Pattern — Synchronous, No Debounce

Meta tag generation and preview rendering are pure functions of the input fields. No async, no debounce. Preview cards are pure CSS/HTML — no external images are loaded (the og:image URL is displayed as text in the preview; loading external images would be a security/CORS risk).

**Critical:** Do NOT load the og:image URL as an actual `<img>` in the preview. Show a placeholder with the URL overlaid, or use a gray box with "Image Preview" text. Loading arbitrary URLs would introduce CORS issues and potential security risks in a client-side tool.

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────────────────────┐
│  Preview Open Graph social cards for Twitter, Facebook, LinkedIn │
│                                                                  │
│  og:title        [My Awesome Page                         ]      │
│  og:description  [A great page about awesome things       ]      │
│  og:image        [https://example.com/image.png           ]      │
│  og:site_name    [Example                                 ]      │
│  og:url          [https://example.com/page                ]      │
│                                                                  │
│  ──────────── dashed divider ─────────────                       │
│                                                                  │
│  ┌─── Twitter Card ──────────┐ ┌─── Facebook ──────────────┐    │
│  │ ┌────────────────────────┐│ │ ┌──────────────────────────┐│   │
│  │ │   🖼️ Image Preview    ││ │ │   🖼️ Image Preview      ││   │
│  │ └────────────────────────┘│ │ └──────────────────────────┘│   │
│  │ My Awesome Page           │ │ example.com                 │   │
│  │ A great page about...     │ │ My Awesome Page             │   │
│  │ example.com               │ │ A great page about...       │   │
│  └───────────────────────────┘ └─────────────────────────────┘   │
│                                                                  │
│  ┌─── LinkedIn ──────────────┐                                   │
│  │ ┌────────────────────────┐│                                   │
│  │ │   🖼️ Image Preview    ││                                   │
│  │ └────────────────────────┘│                                   │
│  │ My Awesome Page           │                                   │
│  │ Example                   │                                   │
│  └───────────────────────────┘                                   │
│                                                                  │
│  Meta Tags                                          [Copy]       │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ <meta property="og:title" content="My Awesome Page" />    │   │
│  │ <meta property="og:description" content="A great..." />   │   │
│  │ <meta property="og:image" content="https://..." />        │   │
│  │ <meta name="twitter:card" content="summary_large_image" />│   │
│  │ ...                                                        │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Preview Card Styling

Each preview card should mimic the platform's actual sharing card appearance using pure CSS:

**Twitter (summary_large_image):**
- Rounded corners, 1px gray border
- Image area: 16:9 aspect ratio, gray bg placeholder
- Title: bold, single line, truncated
- Description: 2 lines max, gray text
- Domain: small, gray

**Facebook:**
- Sharp corners on image, rounded on card
- Image area: 1.91:1 aspect ratio
- Light gray info section below image
- Domain in caps, small gray text
- Title: bold, blue-ish
- Description: gray, 2 lines

**LinkedIn:**
- Rounded corners
- Image area: similar to Facebook
- Title: bold
- Source name below

### Meta Tag Output Format

```html
<meta property="og:title" content="My Awesome Page" />
<meta property="og:description" content="A great page about awesome things" />
<meta property="og:image" content="https://example.com/image.png" />
<meta property="og:site_name" content="Example" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="My Awesome Page" />
<meta name="twitter:description" content="A great page about awesome things" />
<meta name="twitter:image" content="https://example.com/image.png" />
```

### Architecture Compliance

- **Named export only** — `export const OgPreview`
- **Lazy-loaded** — code split via registry
- **100% client-side** — pure HTML/CSS previews, no network requests
- **No new dependencies** — pure string generation + CSS
- **No debounce** — synchronous rendering
- **CopyButton** — on meta tags output
- **Inline layout** — no dialog needed

### TOOL_REGISTRY Entry

```typescript
{
  category: 'Data',
  component: lazy(() =>
    import('@/components/feature/data/OgPreview').then(
      ({ OgPreview }: { OgPreview: ComponentType }) => ({
        default: OgPreview,
      }),
    ),
  ),
  description: 'Preview Open Graph social cards for Twitter, Facebook, and LinkedIn. Generate meta tags.',
  emoji: '🔖',
  key: 'og-preview',
  name: 'OG Preview',
  routePath: '/tools/og-preview',
  seo: {
    description:
      'Preview how your links will appear on Twitter, Facebook, and LinkedIn. Enter OG meta values and generate ready-to-use meta tags.',
    title: 'OG Preview - CSR Dev Tools',
  },
}
```

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/og-tags.ts` | NEW | generateOgMetaTags(), OgConfig type |
| `src/utils/og-tags.spec.ts` | NEW | Unit tests (~7 tests) |
| `src/components/feature/data/OgPreview.tsx` | NEW | OG Preview component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'og-preview' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry |
| `src/components/feature/data/index.ts` | MODIFY | Add barrel export |
| `src/utils/index.ts` | MODIFY | Add og-tags barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 20.4]
- [Source: src/components/feature/data/JsonFormatter.tsx] — Data category component pattern
- [Source: src/constants/tool-registry.ts] — Registry entry format
- [Source: Open Graph protocol — ogp.me] — OG tag specification
- [Source: Twitter Cards documentation] — twitter:card meta tags

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Debug Log References
N/A

### Completion Notes List
- All 7 unit tests pass
- TypeScript clean
- Pure CSS preview cards (no external image loading per security requirements)
- Inline layout following HttpStatusCodes pattern

### Change Log
- NEW: `src/utils/og-tags.ts` — OgConfig type, generateOgMetaTags with HTML escaping
- NEW: `src/utils/og-tags.spec.ts` — 7 unit tests
- NEW: `src/components/feature/data/OgPreview.tsx` — Inline OG preview with 3 platform cards
- MOD: `src/types/constants/tool-registry.ts` — Added 'og-preview' to ToolRegistryKey
- MOD: `src/constants/tool-registry.ts` — Added registry entry
- MOD: `src/components/feature/data/index.ts` — Added barrel export
- MOD: `src/utils/index.ts` — Added og-tags barrel export
- MOD: `vite.config.ts` — Added pre-render route
