# CSR Developer Tools - Documentation Index

**Updated:** 2026-03-20

## Project Overview

- **Type:** Monolith (single-part)
- **Primary Language:** TypeScript 5.9.3
- **Framework:** React 19.2.4 + Vite 7.3.1
- **Architecture:** Component-based SPA with dynamic tool routing
- **Constraint:** 100% client-side -- zero server dependencies
- **Scale:** 80 developer tools across 12 categories

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
- **Unit Testing:** Vitest 4 (88 spec files, ~1,554 tests)
- **E2E Testing:** Playwright 1.58.2 (37 tool + 2 platform specs)

## Generated Documentation

- [Project Overview](./project-overview.md) -- Executive summary, features, tech stack
- [Architecture](./architecture.md) -- Architecture patterns, component hierarchy, state management
- [Source Tree Analysis](./source-tree-analysis.md) -- Annotated directory structure, critical folders
- [Component Inventory](./component-inventory.md) -- All 144 UI components categorized
- [Development Guide](./development-guide.md) -- Setup, scripts, code style, testing, adding tools

## Existing Documentation

- [README.md](../README.md) -- Project overview, features, setup instructions
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

## Tools (80 across 12 categories)

| Category | Count | Key Components |
|----------|-------|----------------|
| Data | 15 | DbDiagram, JsonDiffChecker, JsonFormatter, CsvConverter, YamlFormatter, OgPreview |
| Code | 14 | JsonToTypeScript, MermaidRenderer, ProtobufCodec, TypescriptPlayground, SqlFormatter |
| Image | 12 | BackgroundRemover, FaviconGenerator, SplashScreenGenerator, SvgViewer |
| Security | 8 | AesEncryptDecrypt, BcryptHasher, HashGenerator, RsaKeyGenerator |
| Text | 8 | RegexTester, TextDiffChecker, WordCounter, LoremIpsumGenerator |
| CSS | 6 | FlexboxPlayground, GridPlayground, CssAnimationBuilder, GradientGenerator |
| Encoding | 5 | Base64, JwtDecoder, UrlEncoder, UrlParser, NumberBaseConverter |
| Time | 4 | CronExpressionParser, CrontabGenerator, TimezoneConverter |
| Generator | 3 | PasswordGenerator, QrCodeGenerator, UuidGenerator |
| Color | 2 | ColorConvertor, ColorPaletteGenerator |
| Unit | 2 | UnitPxToRem, AspectRatioCalculator |
| Network | 1 | IpSubnetCalculator |
