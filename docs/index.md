# CSR Developer Tools - Documentation Index

**Generated:** 2026-03-11 | **Workflow:** full_rescan (quick)

## Project Overview

- **Type:** Monolith (single-part)
- **Primary Language:** TypeScript 5.9.3
- **Framework:** React 19.2.4 + Vite 7.3.1
- **Architecture:** Component-based SPA with dynamic tool routing
- **Constraint:** 100% client-side -- zero server dependencies
- **Scale:** 77+ developer tools across 12 categories

## Quick Reference

- **Tech Stack:** React 19 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS 4.2
- **Entry Point:** `src/main.tsx`
- **Architecture Pattern:** Component-based SPA with centralized tool registry
- **State:** Zustand (client) + React Query (configured, unused)
- **Styling:** Tailwind CSS v4 (OKLCH) + tailwind-variants + Radix UI
- **Code Editors:** CodeMirror + Monaco Editor
- **Diagrams:** Mermaid + React Flow (@xyflow)
- **AI/ML:** @huggingface/transformers (in-browser background removal)
- **Linting/Formatting:** oxlint 1.51.0 + oxfmt 0.36.0
- **Unit Testing:** Vitest 4 (84 spec files, ~1,427 tests)
- **E2E Testing:** Playwright 1.58.2 (34 tool + 2 platform specs)

## Generated Documentation

- [Project Overview](./project-overview.md) -- Executive summary, features, tech stack
- [Architecture](./architecture.md) -- Architecture patterns, component hierarchy, state management
- [Source Tree Analysis](./source-tree-analysis.md) -- Annotated directory structure, critical folders
- [Component Inventory](./component-inventory.md) -- All 130 UI components categorized
- [Development Guide](./development-guide.md) -- Setup, scripts, code style, testing, adding tools

## Existing Documentation

- [README.md](../README.md) -- Project overview, features, setup instructions
- [Project Context (AI Rules)](../_bmad-output/project-context.md) -- Implementation rules for AI agents
- [LICENSE](../LICENSE) -- MIT License

## Getting Started

```bash
# Prerequisites: Node.js >= 24.5.0, pnpm 10.11.0

# Install
pnpm install

# Develop
pnpm dev          # http://localhost:5173

# Quality
pnpm lint         # oxlint
pnpm format       # oxfmt
pnpm test         # Vitest (unit)
pnpm test:e2e     # Playwright (E2E)

# Build
pnpm build        # TypeScript + Vite production build
pnpm preview      # Preview build locally
```

## Tools (77+ across 12 categories)

| Category | Count | Key Components |
|----------|-------|----------------|
| Code | 13 | JsonToTypeScript, MermaidRenderer, TypescriptPlayground, SqlFormatter |
| Data | 14 | DbDiagram, JsonFormatter, CsvConverter, YamlFormatter, OgPreview |
| Image | 16 | BackgroundRemover, ImageCropper, FaviconGenerator, SvgViewer |
| Text | 8 | RegexTester, TextDiffChecker, WordCounter, LoremIpsumGenerator |
| CSS | 6 | FlexboxPlayground, GridPlayground, CssAnimationBuilder, GradientGenerator |
| Encoding | 5 | Base64, JwtDecoder, UrlEncoder, UrlParser, NumberBaseConverter |
| Generator | 6 | PasswordGenerator, QrCodeGenerator, UuidGenerator, HashGenerator |
| Security | 5 | BcryptHasher, CertificateDecoder, ChmodCalculator, RsaKeyGenerator |
| Time | 4 | CronExpressionParser, CrontabGenerator, TimezoneConverter |
| Color | 2 | ColorConvertor, ColorPaletteGenerator |
| Unit | 2 | UnitPxToRem, AspectRatioCalculator |
| Network | 1 | IpSubnetCalculator |
