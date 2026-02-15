# CSR - Developer Tools

<div align="center">

**Free online tools for web developers. Speed up your development workflow.**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js->=24.5.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[Live Demo](https://your-demo-url.com) • [Report Bug](https://github.com/boengai/csr-dev-tools/issues) • [Request Feature](https://github.com/boengai/csr-dev-tools/issues)

</div>

## ✨ Features

CSR Developer Tools is a collection of **19 tools** across **9 categories** that work entirely in your browser — no server required, ensuring your data stays private and secure.

### 🎨 **Color**
- **Color Converter** — Convert between HEX, RGB, HSL, OKLCH, LAB, and LCH formats

### 🔲 **CSS**
- **Box Shadow Generator** — Visually create CSS box-shadow values with a live preview

### 📋 **Data**
- **JSON Formatter** — Format and validate JSON with clean indentation
- **JSON ↔ YAML** — Convert between JSON and YAML configuration formats
- **JSON ↔ CSV** — Convert between JSON arrays and CSV spreadsheet format

### 🔤 **Encoding**
- **Base64 Encoder** — Encode and decode Base64 strings
- **URL Encoder/Decoder** — Encode and decode URL strings
- **JWT Decoder** — Decode JWT tokens to inspect header and payload

### 🔑 **Generator**
- **UUID Generator** — Generate random UUID v4 identifiers, single or in bulk
- **Password Generator** — Generate random passwords with configurable length and character types
- **Hash Generator** — Compute hash values from text using MD5, SHA-1, SHA-256, and SHA-512

### 🖼️ **Image**
- **Image Converter** — Convert between PNG, JPG, WebP, GIF, BMP, and AVIF formats
- **Image Compressor** — Compress JPEG and WebP images with a quality slider and live size preview
- **Image Cropper** — Crop images using freeform selection or common aspect ratio presets
- **Image Resizer** — Resize images to custom dimensions with aspect ratio control

### 📝 **Text**
- **Text Diff** — Compare two text blocks and see line-by-line differences highlighted
- **Regex Tester** — Test regex patterns against sample text with live match highlighting

### 🕐 **Time**
- **Unix Timestamp** — Convert between Unix timestamps and human-readable dates

### 📏 **Unit**
- **PX to REM** — Convert between PX and REM units with configurable base font size

### 🧭 **Navigation & Discovery**
- **Sidebar** — Collapsible, categorized navigation for all tools
- **Command Palette** — Fuzzy search any tool with `Cmd+K` / `Ctrl+K`
- **Dedicated URLs** — Each tool has its own route for bookmarking and sharing
- **Drag-and-drop dashboard** — Organize your most-used tools on the home page
- **Persistent layout** — Dashboard remembers your preferences

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 24.5.0
- **pnpm** 10.11.0 (recommended package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/boengai/csr-dev-tools.git
   cd csr-dev-tools
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
# Build the application
pnpm build

# Preview the build locally
pnpm preview
```

## 🛠️ Tech Stack

### Core Technologies
- **[React 19](https://react.dev/)** - Latest React with modern features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[TanStack Router](https://tanstack.com/router)** - Client-side routing with per-tool routes

### UI & Styling
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Motion One](https://motion.dev/)** - Smooth animations and transitions
- **[Tailwind Variants](https://www.tailwind-variants.org/)** - Component variant management

### State Management
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management

### File Processing
- **[JSZip](https://stuk.github.io/jszip/)** - Client-side ZIP file generation and processing

### Development Tools
- **[oxlint](https://oxc.rs/docs/guide/usage/linter)** - Fast code linting
- **[oxfmt](https://oxc.rs/docs/guide/usage/formatter)** - Fast code formatting
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Playwright](https://playwright.dev/)** - E2E testing framework
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipeline with Lighthouse CI

## 📁 Project Structure

```
csr-dev-tools/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── common/          # Shared UI (button, card, sidebar, command-palette, toast, …)
│   │   ├── feature/         # Tool components by category
│   │   │   ├── color/       #   Color Converter
│   │   │   ├── css/         #   Box Shadow Generator
│   │   │   ├── data/        #   JSON Formatter, JSON↔YAML, JSON↔CSV
│   │   │   ├── encoding/    #   Base64, URL Encoder, JWT Decoder
│   │   │   ├── generator/   #   UUID, Password, Hash
│   │   │   ├── image/       #   Converter, Compressor, Cropper, Resizer
│   │   │   ├── text/        #   Text Diff, Regex Tester
│   │   │   ├── time/        #   Unix Timestamp
│   │   │   └── unit/        #   PX to REM
│   │   └── index.ts
│   ├── constants/           # Tool registry, routes, image constants
│   ├── hooks/               # Custom hooks (copy, debounce, SEO, keyboard shortcuts)
│   │   ├── persist/         # Persistence hooks
│   │   └── state/           # Zustand stores
│   ├── pages/
│   │   ├── home/            # Dashboard with drag-and-drop layout
│   │   ├── showcase/        # Feature showcase
│   │   └── tool/            # Dynamic tool page (renders from registry)
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   ├── routes.tsx
│   └── index.css
├── e2e/                     # Playwright E2E tests
├── CONTRIBUTING.md          # Contributor guide
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .oxlintrc.json
└── .oxfmtrc.json
```

## 🧩 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 5173 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run oxlint |
| `pnpm lint:fix` | Run oxlint with auto-fix |
| `pnpm format` | Format source files with oxfmt |
| `pnpm format:check` | Check formatting without writing |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm test:e2e:ui` | Run E2E tests with Playwright UI |

## 🎨 Design System

This project follows a comprehensive design system built on:

### Component Architecture
- **Radix UI** as the foundation for accessible, unstyled components
- **Tailwind CSS v4** with `tv()` (Tailwind Variants) for component styling
- **motion/react** for smooth animations and transitions
- **TanStack Router** for routing with lazy-loaded tool components
- **Centralized Tool Registry** — single source of truth for all tool metadata, routes, and components

### Code Standards
- **TypeScript strict mode** for type safety
- **Functional components** with React hooks
- **Composition over inheritance** design pattern
- **Mobile-first responsive** design approach

### File Naming Conventions
- **kebab-case** for utility files (`app-version.ts`)
- **PascalCase** for component files (`HomePage.tsx`)
- **camelCase** for hooks and utilities (`useAppVersion.ts`)

## 🌟 Key Features

### Client-Side Only
- **100% client-side processing** — your data never leaves your browser
- **No server dependencies** — works offline after initial load
- **Privacy-focused** — no data collection or tracking

### Modern Development
- **React 19** with latest features and optimizations
- **TypeScript strict mode** for type safety
- **TanStack Router** for routing with automatic code splitting
- **Hot module replacement** for instant feedback during development
- **Optimized build** with tree shaking and lazy loading
- **562+ unit tests** and **E2E tests** with Playwright

### Accessible & Responsive
- **WCAG-compliant** — `aria-live` regions, keyboard navigation, semantic markup
- **Mobile-first** approach with Tailwind CSS
- **Touch-friendly** interface for mobile devices

## 🔒 Privacy & Security

- **No data collection** - all processing happens locally
- **No external API calls** for core functionality
- **No cookies or tracking** - respects user privacy
- **Offline capable** - works without internet connection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the complete guide — including how to add a new tool step-by-step, code conventions, testing instructions, and the PR checklist.

## 🐛 Bug Reports

If you discover a bug, please [open an issue](https://github.com/boengai/csr-dev-tools/issues) with:

- A clear description of the bug
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

## 💡 Feature Requests

Have an idea for a new tool? [Open an issue](https://github.com/boengai/csr-dev-tools/issues) with:

- A clear description of the feature
- Use case and benefits
- Any relevant examples or mockups

---

<div align="center">

**Made with ❤️ for the developer community**

[⭐ Star this repo](https://github.com/boengai/csr-dev-tools) if you find it useful!

</div>