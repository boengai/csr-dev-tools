---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
inputDocuments:
  - product-brief-csr-dev-tools-2026-02-11.md
  - README.md
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: brownfield
date: 2026-02-11
author: csrteam
project_name: csr-dev-tools
lastEdited: 2026-02-11
editHistory:
  - date: 2026-02-11
    changes: 'Post-validation fixes (13 items) + general improvements (6 items) — Out of Scope section added, FR/NFR measurability refined, implementation hints removed, Journey-FR traceability added'
---

# Product Requirements Document - csr-dev-tools

**Author:** csrteam
**Date:** 2026-02-11

## Executive Summary

CSR Dev Tools is a free, open-source collection of browser-native developer utilities. Every tool runs 100% client-side — zero servers, zero tracking, zero cost. The architecture IS the business model: no backend means no operating costs, making it sustainably free forever.

**Core Differentiator:** If a tool needs a server, it doesn't belong here. If the browser can do it, it does.

**Target Users:** Any developer tired of bouncing between ad-ridden, limit-gated, paywall-locked utility websites. One bookmark replaces dozens of scattered tools.

**Current State:** Brownfield — MVP shipped with 6 core tools. This PRD defines success criteria, growth roadmap, and requirements for expanding the toolkit.

## Success Criteria

### User Success

- **Zero-server task completion**: Every tool completes its operation entirely in the browser — no network requests for processing. Non-negotiable.
- **Instant usability**: Users complete tasks without instructions, tutorials, or onboarding. The UI is self-explanatory.
- **No friction barriers**: Zero signup walls, zero usage limits, zero cookie banners, zero "upgrade to pro" prompts. Ever.
- **Cross-device access**: Tools work on desktop and mobile browsers without degraded core functionality.

### Business Success

CSR Dev Tools has no traditional business metrics. Success is measured by utility and community engagement:

- **Tool library growth**: Continuously expanding based on real developer needs — organic growth, no fixed timeline
- **Community engagement**: GitHub stars, forks, issues, and pull requests from external contributors
- **Organic discovery**: Individual tools rank for natural search keywords (e.g., "free JSON formatter online")
- **Word-of-mouth sharing**: Developers recommend it to teammates and in community posts

### Technical Success

- **Lighthouse scores**: 90+ across Performance, Accessibility, Best Practices, and SEO
- **Zero server dependency**: No backend API calls for any tool. Static hosting only.
- **Bundle efficiency**: Adding tools does not increase initial page load size or time
- **Regression coverage**: All existing tools documented with acceptance criteria and regression test stories

### Measurable Outcomes

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Server calls for tool processing | 0 | Network tab inspection |
| Lighthouse Performance | 90+ | Lighthouse CI |
| Lighthouse Accessibility | 90+ | Lighthouse CI |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2) | Manual + CI testing |
| Mobile breakpoint | 375px minimum | Responsive testing |
| Tools in next phase | 10 (top-10 priority list) | Ship count |
| Regression test coverage | 100% of existing tools | Test suite pass rate |

## Product Scope & Phased Development

### Phase 1: MVP (Complete)

The MVP is shipped and live with 6 core tools:

1. Color Converter (HEX, RGB, HSL)
2. Base64 Encoder/Decoder
3. Image Converter (PNG, JPG, WebP)
4. Image Resize
5. Unix Timestamp Converter
6. PX to REM Converter

Platform capabilities: drag-and-drop layout, persistent preferences, dark theme, mobile-responsive, Radix UI + Tailwind CSS v4.

All 4 user journeys are supported: discovery via search (First-Timer), bookmarkable navigation (Repeat User), responsive on-device processing (Mobile User), and clear contribution patterns (Contributor).

**Philosophy:** Ship early, grow organically. The platform and 6 core tools prove the concept. Everything after is incremental expansion guided by developer demand.

**Resource model:** Solo developer (csrteam) with BMAD-assisted documentation enabling community contributions.

### Phase 2: Growth (Next Phase)

Priority order:

**1. Document & baseline existing tools:**
- Feature specs for each of the 6 tools — inputs, outputs, supported formats, edge cases, expected behavior
- Regression test stories — happy paths, edge cases, error states, and mobile behavior
- Documented behavior becomes the regression baseline, ensuring enhancements don't break what works

**2. Enhance existing tools:**
- Feature expansion: additional formats, options, presets (e.g., more color formats, aspect ratio lock for image resize)
- UX polish: input validation, one-click copy-to-clipboard, clear error states, keyboard shortcuts
- Performance: optimize processing speed, especially for image tools on large files
- Mobile refinement: flawless phone-sized screen experience
- Quality of life: undo/redo, drag-and-drop file input, output preview, batch processing where applicable

Enhancements driven by user feedback and dogfooding — fix what's annoying, add what's missing.

**3. Build 10 new high-priority tools (all 100% client-side):**

1. JSON Formatter/Validator
2. JWT Decoder
3. UUID Generator
4. Regex Tester
5. Hash Generator (MD5/SHA)
6. Text Diff Checker
7. URL Encoder/Decoder
8. Password Generator
9. JSON ↔ YAML/CSV Converter
10. CSS Box Shadow Generator

Each tool is an independent, self-contained unit — can be built in parallel by different contributors.

### Phase 3: Expansion (Future)

- Scale to 60+ tools across 8 categories (encoding, text, CSS, image, data, generators, converters, security)
- Community-submitted tools via PR workflow
- Plugin-like architecture for standardized tool addition
- Per-tool SEO optimization for organic discovery
- Become the one bookmark every developer has

### Out of Scope (Permanent Boundaries)

These are architectural decisions, not deferrals:

- **No server-side processing** — If a tool requires a server, it doesn't get built
- **No user accounts** — No registration, no login, no profiles
- **No tool-to-tool pipelines** — Each tool is standalone; no chaining or workflow automation
- **No browser extensions** — The product is a website, not an extension
- **No ads or tracking** — No analytics, no cookies, no monetization of any kind
- **No premium tiers** — Every tool is free for every user, forever

### Risk Mitigation

**Technical Risk:**
- Highest complexity tool: Text Diff Checker (line-by-line comparison, diffing algorithm, change highlighting UX)
- Mitigation: Start with simple side-by-side diff, iterate toward inline/unified views. Use proven open-source diff libraries.

**Market Risk:**
- A competitor goes fully free or copies the approach
- Mitigation: Zero-cost architecture is hard to copy for server-dependent tools. Open-source means the community owns it — can't be acquired and paywalled.

**Resource Risk (PRIMARY):**
- Solo developer with limited time. Progress may stall.
- Mitigation:
  1. Strong documentation — anyone can understand and contribute without the original developer explaining everything
  2. BMAD agent framework — AI-assisted workflows multiply solo dev output
  3. Independent tool architecture — contributors build tools without understanding the entire codebase
  4. Low barrier to contribution — clear patterns, documented conventions, MIT license
  5. No infrastructure burden — zero server costs means the project doesn't die from financial neglect

## User Journeys

### Journey 1: The First-Timer (Primary User — Discovery Path)

**Persona:** Kai, a fullstack developer mid-sprint who needs to convert a HEX color to RGB.

**Opening Scene:** Kai is building a React component and the designer handed over colors in HEX, but the animation library needs RGB values. Kai googles "hex to rgb converter free" and clicks through to csr-dev-tools from the search results.

**Rising Action:** The page loads instantly — no cookie banner, no signup modal, no ads. Just a clean color converter tool. Kai pastes `#3B82F6`, and the RGB value appears immediately: `rgb(59, 130, 246)`. One click copies it to clipboard.

**Climax:** Kai notices the sidebar — Base64 encoder, image resize, timestamp converter, more tools. "Wait, this does all of this? In one place?" Kai tries the PX to REM converter for a spacing issue in the same sprint. It just works.

**Resolution:** Kai bookmarks the site. One URL replaces the 4 different tool bookmarks already saved. That afternoon, Kai drops the link in the team Slack: "Found this — free dev tools, no signup, does everything in the browser."

**Capabilities revealed:** SEO-optimized landing per tool, instant tool usability, copy-to-clipboard, tool discovery/navigation, cross-tool exploration.

---

### Journey 2: The Repeat User (Primary User — Retention Path)

**Persona:** Priya, a frontend developer who bookmarked csr-dev-tools two weeks ago.

**Opening Scene:** Priya is debugging a JWT token from a failing API call. She opens her csr-dev-tools bookmark without thinking — it's become muscle memory, like opening the terminal.

**Rising Action:** She navigates to the JWT Decoder (once it's built), pastes the token, and immediately sees the decoded header and payload. The expiry timestamp catches her eye — she switches to the Unix Timestamp Converter to verify: the token expired 3 hours ago. Bug found.

**Climax:** Two tools, 15 seconds, zero context switches to other websites. The all-in-one value is realized — tools that complement each other live in the same place.

**Resolution:** Priya doesn't even think about it anymore. csr-dev-tools is just where she goes. It's always free, always there, always fast. No anxiety about limits or paywalls.

**Capabilities revealed:** Tool navigation for power users, persistent bookmarkable URLs, tool-to-tool workflow (manual, not piped), speed and reliability.

---

### Journey 3: The Mobile User (Primary User — Cross-Device Path)

**Persona:** Marco, a freelance developer on a train between client meetings.

**Opening Scene:** Marco gets a Slack message from a client: "Can you check if this image is the right dimensions? Attached." He opens the image on his phone — but he needs to check the actual pixel dimensions and maybe resize it for the client's social media banner spec.

**Rising Action:** Marco opens csr-dev-tools on his phone browser. The layout adapts — the Image Resize tool fills the screen cleanly. He uploads the image from his phone's gallery. The tool shows the current dimensions and lets him set the target size.

**Climax:** The resized image downloads to his phone in 3 seconds. All processing happened on-device. He sends it back to the client via Slack. Done — from train seat, on mobile, no app install needed.

**Resolution:** Marco realizes he doesn't need a laptop for these quick tasks. The mobile experience isn't a degraded afterthought — it's a first-class citizen.

**Capabilities revealed:** Mobile-responsive layouts, touch-friendly file upload, on-device processing for image tools, downloadable output on mobile.

---

### Journey 4: The Open-Source Contributor (Secondary User — Community Path)

**Persona:** Aisha, a mid-level developer who uses csr-dev-tools regularly and wants to contribute.

**Opening Scene:** Aisha uses the site daily and notices there's no Regex Tester. She checks GitHub — it's open source, MIT licensed. She sees the project structure and realizes adding a tool follows a clear pattern.

**Rising Action:** Aisha forks the repo, studies how existing tools are structured (component, route registration, constants). She builds a Regex Tester following the same patterns — React component, client-side processing, Radix UI primitives, Tailwind styling.

**Climax:** She opens a PR. The maintainers review it, suggest a few improvements. After a round of feedback, it's merged. Her tool is now live on csr-dev-tools, used by thousands of developers.

**Resolution:** Aisha has a meaningful open-source contribution on her profile. She's now invested in the project and starts looking at the roadmap for her next contribution. The community flywheel begins.

**Capabilities revealed:** Clear tool architecture patterns for contributors, documented contribution guidelines, consistent component structure, PR review process.

---

### Journey Requirements Summary

| Capability | Journeys | Supporting FRs |
|-----------|----------|----------------|
| SEO-optimized per-tool landing pages | First-Timer | FR27, NFR23-25 |
| Instant usability / self-explanatory UI | First-Timer, Repeat, Mobile | FR38 |
| Copy-to-clipboard | First-Timer, Repeat | FR3, FR7 |
| Tool discovery & navigation | First-Timer, Repeat | FR26, FR28 |
| Persistent bookmarkable URLs per tool | First-Timer, Repeat | FR27 |
| Mobile-responsive layout | Mobile | FR29 |
| Touch-friendly file upload / download | Mobile | FR2, FR3 |
| On-device processing (no server) | All journeys | FR1, NFR9 |
| Clear tool architecture for contributors | Contributor | FR33 |
| Contribution documentation | Contributor | FR36, FR37 |
| Consistent component patterns | Contributor | FR33, FR35 |

## Web App Specific Requirements

### Project-Type Overview

CSR Dev Tools is a Single Page Application (SPA) built with React 19, TanStack Router, and Vite. All processing is client-side with static hosting. No server-side rendering, no real-time features, no backend API.

### Browser Compatibility Matrix

| Browser | Version Support | Priority |
|---------|----------------|----------|
| Chrome | Latest 2 versions | Primary |
| Firefox | Latest 2 versions | Primary |
| Safari | Latest 2 versions | Primary |
| Edge | Latest 2 versions | Primary |
| Mobile Chrome (Android) | Latest 2 versions | Secondary |
| Mobile Safari (iOS) | Latest 2 versions | Secondary |

No support for: IE11, legacy browsers, or non-evergreen browsers.

### Responsive Design

- **Mobile-first approach**: Tailwind CSS v4 with mobile-first breakpoints
- **Minimum viewport**: 375px width (iPhone SE)
- **Breakpoints**: Mobile (375px+), Tablet (768px+), Desktop (1024px+)
- **Touch-friendly**: Minimum tap target 44x44px on mobile
- **Layout adaptation**: Tool UIs adapt to viewport — single column on mobile, multi-column on desktop

### Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 90+ |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |
| Total Blocking Time | < 200ms |
| Initial bundle size | Minimal — tools lazy-loaded |

- Each tool is code-split and lazy-loaded via TanStack Router
- Adding new tools must not increase initial page load
- Image/file processing uses Web Workers where beneficial

### SEO Strategy

- **Per-tool SEO**: Each tool gets a unique route with descriptive URL (e.g., `/tools/json-formatter`)
- **Meta tags**: Title, description, and Open Graph tags per tool page
- **Semantic HTML**: Proper heading hierarchy, landmark regions
- **Common practices only**: No paid SEO, no link building campaigns, no ads
- **SPA consideration**: Pre-rendered or static meta tags for crawlers via standard SPA SEO patterns

### Accessibility

- **Target**: WCAG 2.1 AA compliance
- **Foundation**: Radix UI provides accessible primitives out of the box (focus management, keyboard navigation, ARIA attributes)
- **Requirements**:
  - All interactive elements keyboard-accessible
  - Color contrast ratios meet AA standards (4.5:1 for text, 3:1 for large text)
  - Form inputs have visible labels
  - Error states announced to screen readers
  - No information conveyed by color alone

### Implementation Considerations

- **Static hosting**: Deployable to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages) — no server runtime needed
- **Zero API dependency**: No environment variables, no API keys, no backend configuration
- **Offline potential**: Service worker could enable offline access to previously loaded tools (future consideration)
- **Build optimization**: Tree shaking, code splitting per route, CSS purging via Tailwind v4

## Functional Requirements

### Tool Processing

- FR1: Users can process any supported conversion/transformation entirely in the browser without server communication
- FR2: Users can upload files (images, text) from their device for processing
- FR3: Users can download or copy processed output to their clipboard or device
- FR4: Users can see processing results within 500ms without page reload

### Color Tools

- FR5: Users can convert colors between HEX, RGB, and HSL formats
- FR6: Users can input colors via text input or visual color picker
- FR7: Users can copy converted color values to clipboard

### Encoding Tools

- FR8: Users can encode and decode Base64 strings
- FR9: Users can encode and decode URLs
- FR10: Users can decode JWT tokens to view header and payload

### Image Tools

- FR11: Users can convert images between PNG, JPG, WebP, GIF, BMP, and AVIF formats (where browser-supported)
- FR12: Users can resize images with custom width and height dimensions
- FR13: Users can compress JPEG and WebP images using a quality slider (1-100) and see the resulting file size before downloading
- FR14: Users can crop images using freeform selection or common aspect ratio presets (16:9, 4:3, 1:1, 3:2)

### Time & Unit Tools

- FR15: Users can convert between Unix timestamps and human-readable dates
- FR16: Users can convert between PX and REM units with configurable base font size

### Data & Format Tools

- FR17: Users can format and validate JSON with syntax highlighting
- FR18: Users can convert between JSON and YAML formats
- FR19: Users can convert between JSON and CSV formats

### Text Tools

- FR20: Users can compare two text inputs and see line-by-line differences highlighted
- FR21: Users can test regular expressions against sample text with live match highlighting

### Generator Tools

- FR22: Users can generate UUIDs (single or bulk)
- FR23: Users can generate random passwords with configurable length (8-128 characters) and toggle inclusion of uppercase, lowercase, digits, and symbols
- FR24: Users can generate hash values (MD5, SHA-1, SHA-256, SHA-512) from text input

### CSS Tools

- FR25: Users can visually generate CSS box-shadow values with live preview

### Platform — Navigation & Discovery

- FR26: Users can browse all available tools from a central dashboard
- FR27: Users can navigate directly to any tool via unique URL
- FR28: Users can search or filter tools by name or category
- FR29: Users can access any tool on mobile devices down to 375px viewport width with touch-friendly layout

### Platform — Customization

- FR30: Users can customize their dashboard layout via drag-and-drop
- FR31: Users can have their layout preferences persist across sessions
- FR32: Users can switch between light and dark themes

### Platform — Contributor Experience

- FR33: Contributors can add a new tool by following the CONTRIBUTING guide, which documents the required file structure (component, route, constants, tests) and a PR checklist
- FR34: Contributors can run the development environment locally with standard tooling
- FR35: Contributors can run tests to validate their changes against existing tool regression stories

### Documentation & Quality

- FR36: Developers can reference a documented feature spec for each existing tool covering inputs, outputs, supported formats, and edge cases
- FR37: Developers can run regression test stories for each existing tool covering happy paths, edge cases, and error states
- FR38: Users can see a one-line tool description and placeholder text or tooltips on each input field explaining accepted formats and values

## Non-Functional Requirements

### Performance

- NFR1: Tool processing operations (color conversion, encoding, unit conversion) complete in under 100ms as measured by browser Performance API timing
- NFR2: Image processing operations (resize, convert, compress) complete in under 3 seconds for files up to 10MB as measured by automated benchmark tests
- NFR3: First Contentful Paint under 1.5 seconds on a 10 Mbps connection
- NFR4: Largest Contentful Paint under 2.5 seconds
- NFR5: Total Blocking Time under 200ms
- NFR6: Cumulative Layout Shift under 0.1
- NFR7: Lighthouse Performance score of 90+
- NFR8: Adding new tools does not increase initial page load time

### Privacy & Security

- NFR9: Zero network requests for tool processing — all operations execute in the browser
- NFR10: No cookies, localStorage tracking, or analytics scripts
- NFR11: No third-party scripts that transmit user data
- NFR12: File uploads are never persisted beyond the browser session and no upload data is transmitted externally
- NFR13: All dependencies audited for known vulnerabilities via automated tooling

### Accessibility

- NFR14: WCAG 2.1 AA compliance across all tools and platform pages
- NFR15: All interactive elements operable via keyboard alone
- NFR16: Color contrast ratios meet AA minimums (4.5:1 text, 3:1 large text)
- NFR17: Screen reader compatibility for all tool inputs, outputs, and error states
- NFR18: Lighthouse Accessibility score of 90+

### Reliability & Correctness

- NFR19: Tool output correctness verified by automated regression tests
- NFR20: All existing tools maintain 100% regression test pass rate before any release
- NFR21: Application functions offline after initial load
- NFR22: No runtime errors on supported browsers (Chrome, Firefox, Safari, Edge latest 2)

### SEO

- NFR23: Lighthouse SEO score of 90+
- NFR24: Each tool page has unique title, meta description, and Open Graph tags
- NFR25: Semantic HTML with proper heading hierarchy on all pages
