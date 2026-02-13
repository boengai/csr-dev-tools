# Story 1.2: Dedicated Tool Routes & SEO

Status: done

## Story

As a **user**,
I want **to navigate directly to any tool via a unique URL and find tools through search engines**,
So that **I can bookmark specific tools and discover them via Google**.

## Acceptance Criteria

**Given** the `TOOL_REGISTRY` exists
**When** the router configuration is loaded
**Then** each tool has a dedicated route at `/tools/{tool-key}` generated from the registry
**And** each route lazy-loads only that tool's component chunk

**Given** a user navigates to `/tools/color-converter`
**When** the page renders
**Then** the Color Converter tool is displayed in full-page mode via `ToolLayout`
**And** the page has a unique `<title>` tag: "Color Converter - CSR Dev Tools"
**And** the page has a unique `<meta name="description">` tag
**And** the page has Open Graph tags (`og:title`, `og:description`)

**Given** a build-time pre-rendering plugin is configured in `vite.config.ts`
**When** `pnpm build` runs
**Then** static HTML is generated for each tool route with correct meta tags embedded
**And** search engine crawlers receive fully-rendered HTML with SEO metadata

**Given** a user is on a dedicated tool page
**When** they use the browser back button
**Then** they return to their previous page with scroll position restored

## Dependencies

- **Story 1.1: Centralized Tool Registry** -- MUST be completed first. This story consumes `TOOL_REGISTRY` from `src/constants/tool-registry.ts` and `ToolRegistryEntry` type from `src/types/constants/tool-registry.ts`.
- **Story 2.1: ToolLayout Component** -- does NOT exist yet. This story should use a simple temporary wrapper for `page` mode rendering. The full `ToolLayout` is created in Story 2.1. See Task 2 for details.

## Tasks / Subtasks

### [x] Task 1: Extend Route Types and Constants

1.1. Update `src/types/constants/route.ts` to add a `TOOL` route path key:
```typescript
export type RoutePath = 'HOME' | 'SHOWCASE' | 'TOOL'
```

1.2. Update `src/constants/route.ts` to add the `TOOL` base path:
```typescript
import type { RoutePath } from '@/types'

export const ROUTE_PATH: Record<RoutePath, string> = {
  HOME: '/',
  SHOWCASE: '/showcase',
  TOOL: '/tools',
}
```

### [x] Task 2: Create the Tool Page Component

2.1. Create the directory structure:
```
src/pages/tool/
    └── index.tsx
```

2.2. Implement `src/pages/tool/index.tsx` as the dedicated tool page wrapper.

This page component:
- Receives the tool key from the route params (e.g., `color-converter` from `/tools/color-converter`)
- Looks up the corresponding `ToolRegistryEntry` from `TOOL_REGISTRY`
- Renders the tool component in full-page mode
- Sets the document `<title>` and meta tags dynamically using a `useToolSeo` hook or inline `useEffect`
- If the tool key is not found in the registry, navigates to the home page (consistent with existing `notFoundComponent` behavior)

**Important:** `ToolLayout` does NOT exist yet (it is created in Story 2.1). For this story, create a minimal `ToolPageWrapper` directly within the page component that provides basic full-page rendering. This wrapper will be replaced by `ToolLayout` in Story 2.1. The wrapper should:
- Render the tool component with a simple title header
- Apply full-page spacing/padding consistent with the existing page styles
- NOT attempt to replicate the full ToolLayout design (that is Story 2.1's scope)

### [x] Task 3: Generate Tool Routes from TOOL_REGISTRY

3.1. Update `src/routes.tsx` to dynamically generate a route for each tool in the registry.

3.2. Each tool route must:
- Use `getParentRoute: () => rootRoute`
- Use `path: '${ROUTE_PATH.TOOL}/$toolKey'` (TanStack Router param syntax)
- Lazy-load the tool page component via `lazyRouteComponent(() => import('@/pages/tool'))`

3.3. The tool page component resolves the `$toolKey` param to determine which tool to render.

### [x] Task 4: Implement SEO Meta Tag Management

4.1. Create a `useToolSeo` custom hook at `src/hooks/useToolSeo.ts` that:
- Accepts `title`, `description`, and optional `url` parameters
- Updates `document.title`
- Creates/updates `<meta name="description">` in `<head>`
- Creates/updates `<meta property="og:title">` in `<head>`
- Creates/updates `<meta property="og:description">` in `<head>`
- Restores the original title and meta tags on unmount (cleanup)

4.2. Add the type definition at `src/types/hooks/seo.ts`.

4.3. Export from barrel files: `src/types/hooks/index.ts` and `src/hooks/index.ts`.

4.4. Call `useToolSeo` inside the Tool Page component using the `seo` field from the matched `ToolRegistryEntry`.

### [x] Task 5: Configure Build-Time Pre-Rendering

5.1. Evaluate and install a Vite pre-rendering plugin (see Dev Notes for evaluation criteria and recommendations).

5.2. Configure the plugin in `vite.config.ts` to:
- Read the list of tool routes from `TOOL_REGISTRY` (or a static list derived from it)
- Generate static HTML files for each tool route at build time
- Ensure the generated HTML includes the correct `<title>` and meta tags per tool

5.3. Verify that `pnpm build` generates static HTML output in `dist/` for each tool route (e.g., `dist/tools/color-converter/index.html`).

5.4. Verify that the generated HTML contains the correct SEO meta tags for each tool.

### [x] Task 6: Verify Scroll Restoration and Back Button

6.1. Confirm that TanStack Router's `scrollRestoration: true` (already configured in `src/routes.tsx`) handles browser back button behavior correctly for tool routes.

6.2. No additional implementation should be needed -- `scrollRestoration: true` is already set. Verify by testing:
- Navigate from Home to a tool page
- Scroll the tool page
- Press browser back
- Confirm the home page restores its previous scroll position

### [x] Task 7: Update Barrel Exports

7.1. Ensure all new files are properly exported through their barrel `index.ts` files:
- `src/hooks/index.ts` -- add `useToolSeo` export
- `src/types/hooks/index.ts` -- add seo types export
- Any other new barrel exports needed

### [x] Task 8: Manual Verification

8.1. Run `pnpm build` and verify:
- No TypeScript errors
- No build errors
- Static HTML generated for each tool route in `dist/`
- Each generated HTML file contains correct `<title>` and meta tags

8.2. Run `pnpm dev` and verify:
- Navigate to `/tools/color-converter` -- tool renders in full-page mode
- Check `<title>` tag is "Color Converter - CSR Dev Tools"
- Check meta description and OG tags are present in `<head>`
- Navigate to a non-existent tool route (e.g., `/tools/fake-tool`) -- redirects to home
- Browser back button restores previous scroll position
- Each tool page lazy-loads its own chunk (check Network tab)

## Dev Notes

This section provides EXHAUSTIVE implementation guidance. The dev agent should be able to implement this story using ONLY this file.

---

### Project Structure Notes

**Existing files that will be MODIFIED:**

| File | Change |
|------|--------|
| `src/routes.tsx` | Add dynamic tool routes generated from TOOL_REGISTRY |
| `src/constants/route.ts` | Add `TOOL: '/tools'` to ROUTE_PATH |
| `src/types/constants/route.ts` | Add `'TOOL'` to RoutePath union |
| `src/hooks/index.ts` | Add barrel export for useToolSeo |
| `src/types/hooks/index.ts` | Add barrel export for seo types |

**New files that will be CREATED:**

| File | Purpose |
|------|---------|
| `src/pages/tool/index.tsx` | Tool page wrapper component (default export) |
| `src/hooks/useToolSeo.ts` | SEO meta tag management hook |
| `src/types/hooks/seo.ts` | Type definitions for useToolSeo |

---

### TanStack Router Pattern for Dynamic Tool Routes

The current router setup in `src/routes.tsx` uses `createRootRoute`, `createRoute`, and `createRouter` from `@tanstack/react-router`. Routes are defined manually. This story adds tool routes.

**Approach: Single Parameterized Route (Recommended)**

Rather than generating N individual routes (one per tool), use a single parameterized route with `$toolKey`:

```typescript
import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Navigate } from '@tanstack/react-router'

import { ROUTE_PATH } from '@/constants'

const rootRoute = createRootRoute({
  component: lazyRouteComponent(() => import('@/App')),
  notFoundComponent: () => <Navigate to={ROUTE_PATH.HOME} />,
})

const homeRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/home')),
  getParentRoute: () => rootRoute,
  path: ROUTE_PATH.HOME,
})

const showcaseRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/showcase')),
  getParentRoute: () => rootRoute,
  path: ROUTE_PATH.SHOWCASE,
})

const toolRoute = createRoute({
  component: lazyRouteComponent(() => import('@/pages/tool')),
  getParentRoute: () => rootRoute,
  path: `${ROUTE_PATH.TOOL}/$toolKey`,
})

const routeTree = rootRoute.addChildren([homeRoute, showcaseRoute, toolRoute])

export const router = createRouter({
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  routeTree,
  scrollRestoration: true,
})
```

**Why a single parameterized route instead of N routes:**
1. Simpler route tree -- one route definition instead of iterating over registry
2. TanStack Router handles the param extraction via `$toolKey`
3. Lazy loading still works -- the tool PAGE is lazy-loaded, and within the page, the specific tool COMPONENT is lazy-loaded from the registry entry
4. Pre-rendering still works -- the pre-rendering plugin generates HTML per route from a static route list
5. Avoids importing `TOOL_REGISTRY` directly in `routes.tsx` (which would pull all lazy imports into the route module)

**Accessing the route param in the Tool Page:**

Inside `src/pages/tool/index.tsx`, use TanStack Router's `useParams` hook:

```typescript
import { Navigate, useParams } from '@tanstack/react-router'
import { Suspense } from 'react'

import type { ToolRegistryEntry } from '@/types'

import { TOOL_REGISTRY } from '@/constants'
import { ROUTE_PATH } from '@/constants'
import { useToolSeo } from '@/hooks'

export default function ToolPage() {
  const { toolKey } = useParams({ strict: false })

  const tool = TOOL_REGISTRY.find((entry: ToolRegistryEntry) => entry.key === toolKey)

  if (!tool) {
    return <Navigate to={ROUTE_PATH.HOME} />
  }

  useToolSeo({
    description: tool.seo.description,
    title: tool.seo.title,
  })

  const ToolComponent = tool.component

  return (
    <div className="flex grow flex-col p-6">
      <header className="mb-6">
        <h1 className="text-heading-3 text-white">{tool.name}</h1>
        <p className="text-body text-text-secondary mt-1">{tool.description}</p>
      </header>
      <div className="flex grow flex-col">
        <Suspense fallback={<ToolPageLoading />}>
          <ToolComponent />
        </Suspense>
      </div>
    </div>
  )
}

const ToolPageLoading = () => {
  return (
    <div className="bg-primary/10 flex grow flex-col items-center justify-center rounded-xl">
      <span className="text-text-secondary">Loading...</span>
    </div>
  )
}
```

**Important Notes on the above pattern:**
- `useParams({ strict: false })` is used because the route is defined at the router level, not via file-based routing. The `strict: false` option prevents TypeScript from requiring the route ID to be fully typed. This is the simplest approach with TanStack Router's programmatic API.
- `tool.component` is already a `lazy(() => import(...))` React component from the registry, so it must be wrapped in `<Suspense>`.
- The `Navigate` component redirects invalid tool keys to the home page.
- `useToolSeo` must be called unconditionally (React hook rules). Place it after the null check using a conditional return, or extract it into a child component. The pattern shown above is acceptable because the `Navigate` causes an early return before `useToolSeo` runs -- but ONLY if the `Navigate` return is stable (no conditional hooks after it). A safer pattern is to use a child component:

```typescript
export default function ToolPage() {
  const { toolKey } = useParams({ strict: false })
  const tool = TOOL_REGISTRY.find((entry: ToolRegistryEntry) => entry.key === toolKey)

  if (!tool) {
    return <Navigate to={ROUTE_PATH.HOME} />
  }

  return <ToolPageContent tool={tool} />
}

const ToolPageContent = ({ tool }: { tool: ToolRegistryEntry }) => {
  useToolSeo({
    description: tool.seo.description,
    title: tool.seo.title,
  })

  const ToolComponent = tool.component

  return (
    <div className="flex grow flex-col p-6">
      <header className="mb-6">
        <h1 className="text-heading-3 text-white">{tool.name}</h1>
        <p className="text-body text-text-secondary mt-1">{tool.description}</p>
      </header>
      <div className="flex grow flex-col">
        <Suspense fallback={<ToolPageLoading />}>
          <ToolComponent />
        </Suspense>
      </div>
    </div>
  )
}
```

This child-component pattern is the **recommended approach** because it avoids hook ordering issues entirely.

---

### SEO Meta Tag Management: useToolSeo Hook

**Why not react-helmet-async or similar?**

The project has zero external dependencies for meta tag management today. Adding `react-helmet-async` introduces a new dependency, a `<HelmetProvider>` wrapper in the component tree, and complexity that is unnecessary for this use case. The project only needs to update 4-5 meta tags per page, and `document.title` + direct DOM manipulation of `<meta>` tags in a `useEffect` is simpler, lighter, and sufficient.

**Implementation of `src/hooks/useToolSeo.ts`:**

```typescript
import { useEffect } from 'react'

import type { UseToolSeoParams } from '@/types'

const BASE_URL = 'https://csr-dev-tools.pages.dev'

const getOrCreateMeta = (property: string, isOg = false): HTMLMetaElement => {
  const attr = isOg ? 'property' : 'name'
  const selector = `meta[${attr}="${property}"]`
  const existing = document.querySelector<HTMLMetaElement>(selector)
  if (existing) return existing

  const meta = document.createElement('meta')
  meta.setAttribute(attr, property)
  document.head.appendChild(meta)
  return meta
}

export const useToolSeo = ({ description, title, url }: UseToolSeoParams) => {
  useEffect(() => {
    const previousTitle = document.title

    const descriptionMeta = getOrCreateMeta('description')
    const previousDescription = descriptionMeta.content

    const ogTitleMeta = getOrCreateMeta('og:title', true)
    const previousOgTitle = ogTitleMeta.content

    const ogDescriptionMeta = getOrCreateMeta('og:description', true)
    const previousOgDescription = ogDescriptionMeta.content

    const ogUrlMeta = getOrCreateMeta('og:url', true)
    const previousOgUrl = ogUrlMeta.content

    // Set new values
    document.title = title
    descriptionMeta.content = description
    ogTitleMeta.content = title
    ogDescriptionMeta.content = description
    if (url) {
      ogUrlMeta.content = `${BASE_URL}${url}`
    }

    // Cleanup: restore previous values on unmount
    return () => {
      document.title = previousTitle
      descriptionMeta.content = previousDescription
      ogTitleMeta.content = previousOgTitle
      ogDescriptionMeta.content = previousOgDescription
      ogUrlMeta.content = previousOgUrl
    }
  }, [description, title, url])
}
```

**Type definition at `src/types/hooks/seo.ts`:**

```typescript
export type UseToolSeoParams = {
  description: string
  title: string
  url?: string
}
```

**Why restore on unmount?**
When navigating away from a tool page back to the home page, the homepage's generic meta tags should be restored. Since the homepage does not call `useToolSeo`, the cleanup function handles this by restoring the previous values that were set in `index.html`.

---

### Pre-Rendering Plugin: Evaluation and Recommendation

**Requirements for the plugin:**
1. Works with Vite 7.x
2. Generates static HTML for a list of routes at build time
3. Does not require a headless browser (Puppeteer/Playwright) -- we want a lightweight solution
4. Supports rendering React components to HTML strings
5. Allows custom meta tag injection per route
6. Actively maintained (last publish within 6 months)
7. Works with the existing React 19 + TanStack Router setup

**Options to evaluate:**

| Plugin | Notes |
|--------|-------|
| `vite-plugin-ssr` / `vike` | Full SSR framework -- overkill. Too opinionated, replaces TanStack Router. Reject. |
| `vite-ssg` | Designed for Vue. Not compatible. Reject. |
| `@prerenderer/rollup-plugin` | Works with Vite (Rollup-based). Uses headless Chrome. Heavyweight but proven. Consider as fallback. |
| `vite-plugin-prerender` | Lightweight pre-rendering. Evaluate compatibility with Vite 7. |
| Custom Vite plugin | Write a minimal custom plugin that generates HTML per route using React's `renderToString`. Full control, no external dependency. |

**Recommended approach: Custom minimal Vite plugin or `vite-plugin-prerender`**

The dev agent should first check if `vite-plugin-prerender` (or its successors) supports Vite 7.x. If it does, use it. If not, write a minimal custom Vite plugin.

**Custom Vite plugin approach (if needed):**

Create a file `vite-plugins/prerender.ts` (or inline in `vite.config.ts`) that:
1. Runs as a `closeBundle` hook (after Vite build completes)
2. Reads the built `dist/index.html` as a template
3. For each tool route, replaces the `<title>` and meta tags with tool-specific values
4. Writes the modified HTML to `dist/tools/{tool-key}/index.html`

This does NOT require rendering React components -- it simply takes the SPA shell HTML and injects the correct meta tags per route. When a search engine crawler hits `/tools/color-converter`, it receives HTML with the correct `<title>` and meta tags. The React app hydrates normally on the client side.

**Implementation sketch for custom plugin:**

```typescript
// vite-plugins/prerender.ts
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

import type { Plugin } from 'vite'

type PreRenderRoute = {
  description: string
  path: string
  title: string
  url: string
}

export const prerender = (routes: Array<PreRenderRoute>): Plugin => {
  return {
    name: 'vite-plugin-prerender-seo',
    closeBundle() {
      const distDir = resolve(process.cwd(), 'dist')
      const templatePath = resolve(distDir, 'index.html')

      if (!existsSync(templatePath)) {
        console.warn('[prerender] dist/index.html not found, skipping pre-render')
        return
      }

      const template = readFileSync(templatePath, 'utf-8')

      for (const route of routes) {
        let html = template

        // Replace <title>
        html = html.replace(
          /<title>[^<]*<\/title>/,
          `<title>${route.title}</title>`,
        )

        // Replace meta description
        html = html.replace(
          /<meta name="description"[^>]*>/,
          `<meta name="description" content="${route.description}">`,
        )

        // Replace og:title
        html = html.replace(
          /<meta property="og:title"[^>]*>/,
          `<meta property="og:title" content="${route.title}">`,
        )

        // Replace og:description
        html = html.replace(
          /<meta property="og:description"[^>]*>/,
          `<meta property="og:description" content="${route.description}">`,
        )

        // Replace og:url
        html = html.replace(
          /<meta property="og:url"[^>]*>/,
          `<meta property="og:url" content="https://csr-dev-tools.pages.dev${route.url}">`,
        )

        // Replace canonical
        html = html.replace(
          /<link rel="canonical"[^>]*>/,
          `<link rel="canonical" href="https://csr-dev-tools.pages.dev${route.url}">`,
        )

        // Write to dist/tools/{tool-key}/index.html
        const outputDir = resolve(distDir, route.path.replace(/^\//, ''))
        const outputPath = resolve(outputDir, 'index.html')

        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, html, 'utf-8')
      }

      console.log(`[prerender] Generated ${routes.length} static HTML files`)
    },
  }
}
```

**Using the plugin in `vite.config.ts`:**

The plugin needs a static list of routes and their SEO data. Since `TOOL_REGISTRY` uses `lazy()` React components, it cannot be directly imported in the Vite config (Node.js context). Instead, create a separate static data file that both the registry and the plugin can consume.

**Option A: Duplicate the route list in vite.config.ts (simple, pragmatic)**

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

import { prerender } from './vite-plugins/prerender'

const toolRoutes = [
  {
    description: 'Convert colors between HEX, RGB, HSL, OKLCH, LAB, and LCH formats instantly in your browser. Free, private, no data leaves your device.',
    path: '/tools/color-converter',
    title: 'Color Converter - CSR Dev Tools',
    url: '/tools/color-converter',
  },
  {
    description: 'Encode and decode Base64 strings instantly in your browser. Free, private, no data leaves your device.',
    path: '/tools/base64-encoder',
    title: 'Base64 Encoder - CSR Dev Tools',
    url: '/tools/base64-encoder',
  },
  // ... one entry per tool
]

export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    tailwindcss(),
    prerender(toolRoutes),
  ],
})
```

**Option B: Extract SEO data into a shared JSON/TS file importable from both contexts**

Create `src/constants/tool-seo-data.ts` as a plain object array (no React imports):

```typescript
// src/constants/tool-seo-data.ts
export const TOOL_SEO_DATA = [
  {
    description: 'Convert colors between HEX, RGB, HSL, OKLCH, LAB, and LCH formats...',
    key: 'color-converter',
    routePath: '/tools/color-converter',
    title: 'Color Converter - CSR Dev Tools',
  },
  // ... per tool
] as const
```

Then import this in both `tool-registry.ts` (for the React app) and `vite.config.ts` (for the build plugin). This keeps the data in one place.

**The dev agent should choose Option B if they want DRY data, or Option A if they want simplicity.** Both are acceptable. Option A is recommended for initial implementation since it is explicit and avoids cross-context import complexity.

---

### TOOL_REGISTRY Dependency: What This Story Assumes Exists

This story assumes Story 1.1 has been completed and the following exist:

**`src/constants/tool-registry.ts`** -- exports a `TOOL_REGISTRY` array of `ToolRegistryEntry` objects.

**`src/types/constants/tool-registry.ts`** -- exports the `ToolRegistryEntry` type:

```typescript
import type { ComponentType } from 'react'

export type ToolSeo = {
  description: string
  title: string
}

export type ToolRegistryEntry = {
  category: string
  component: React.LazyExoticComponent<ComponentType>
  description: string
  emoji: string
  key: string
  name: string
  routePath: string
  seo: ToolSeo
}
```

Each entry's `key` matches the route slug (e.g., `'color-converter'` maps to `/tools/color-converter`).

Each entry's `seo.title` follows the pattern `'{Tool Name} - CSR Dev Tools'`.

Each entry's `seo.description` is a unique, action-oriented description under 155 characters.

The 6 existing tools and their expected registry keys:

| Tool | Registry Key | Route Path |
|------|-------------|------------|
| Color Converter | `color-converter` | `/tools/color-converter` |
| Base64 Encoder | `base64-encoder` | `/tools/base64-encoder` |
| Image Converter | `image-converter` | `/tools/image-converter` |
| Image Resizer | `image-resizer` | `/tools/image-resizer` |
| Unix Timestamp | `unix-timestamp` | `/tools/unix-timestamp` |
| PX to REM | `px-to-rem` | `/tools/px-to-rem` |

---

### Code Convention Reminders

These conventions MUST be followed in all code written for this story:

1. **`type` over `interface`** -- always use `type Foo = {}`, never `interface Foo {}`
2. **`Array<T>` over `T[]`** -- always use `Array<string>`, never `string[]`
3. **`import type` for type-only imports** -- separate line: `import type { Foo } from '@/types'`
4. **No semicolons** -- oxfmt enforces `semi: false`
5. **Single quotes** -- oxfmt enforces `singleQuote: true`
6. **Trailing commas** -- oxfmt enforces `trailingComma: 'all'`
7. **120 char line width** -- oxfmt enforces `printWidth: 120`
8. **`@/` path alias** -- always use `@/` for src imports, never relative paths
9. **Named exports for components** -- all components use named exports. Exception: page components use `export default function PageName()` for lazy-loading.
10. **Barrel exports** -- every folder has `index.ts` re-exporting siblings. Import from barrel, not file directly.
11. **Alphabetical ordering** -- object keys, props, and imports should be alphabetically sorted.
12. **Import order**: (1) external libraries alphabetical, (2) blank line, (3) type-only `@/types` imports, (4) blank line, (5) internal `@/` imports alphabetical.
13. **No `console.log`** -- oxlint rule: `no-console: 'warn'`.
14. **Motion imports** -- import from `motion/react`, never `framer-motion`.
15. **Page components** -- use `export default function PageName()` pattern (not arrow functions, not named exports).
16. **Let TypeScript infer** where possible -- annotate only parameters, empty arrays, reduce accumulators, and exported function signatures.

---

### Existing File Reference: Current routes.tsx

The current `src/routes.tsx` that will be modified:

```typescript
import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Navigate } from '@tanstack/react-router'

import { ROUTE_PATH } from '@/constants'

const rootRoute = createRootRoute({
  component: lazyRouteComponent(() => import('@/App')),
  notFoundComponent: () => <Navigate to={ROUTE_PATH.HOME} />,
})

const routeTree = rootRoute.addChildren([
  createRoute({
    component: lazyRouteComponent(() => import('@/pages/home')),
    getParentRoute: () => rootRoute,
    path: ROUTE_PATH.HOME,
  }),
  createRoute({
    component: lazyRouteComponent(() => import('@/pages/showcase')),
    getParentRoute: () => rootRoute,
    path: ROUTE_PATH.SHOWCASE,
  }),
])

export const router = createRouter({
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  routeTree,
  scrollRestoration: true,
})
```

The modified version should add the tool route as shown in the TanStack Router Pattern section above.

---

### Existing File Reference: Current index.html SEO Tags

The `index.html` already has these SEO tags that the pre-renderer will replace per-route:

```html
<title>CSR - Free Web Developer Tools Collection | Color Converter, Base64 Encoder, Image Tools</title>
<meta name="description" content="Free collection of web developer tools...">
<meta property="og:title" content="CSR - Free Web Developer Tools Collection">
<meta property="og:description" content="Free collection of web developer tools...">
<meta property="og:url" content="https://csr-dev-tools.pages.dev/">
<link rel="canonical" href="https://csr-dev-tools.pages.dev/">
```

The pre-render plugin replaces these with tool-specific values in the generated per-route HTML files.

---

### Existing File Reference: Current App.tsx Layout

The `App.tsx` root layout renders `<Outlet />` inside a `<main>` element with `<Suspense>`. The tool page will render inside this outlet, inheriting the background texture and star animation. No changes to `App.tsx` are needed.

```typescript
export default function App() {
  return (
    <>
      <main className="bg-pixel-texture relative flex grow flex-col pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)] [&>*:not(:first-child)]:relative">
        <Suspense fallback={<></>}>
          <TwinkleStarsAnimate />
        </Suspense>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <ToastProvider />
    </>
  )
}
```

---

### Existing File Reference: Current Barrel Export Chain

The barrel export chain for types:

```
src/types/index.ts
  └── exports from ./components, ./constants, ./hooks, ./utils

src/types/constants/index.ts
  └── exports from ./feature, ./image, ./route (add ./tool-registry if Story 1.1 adds it)

src/types/hooks/index.ts
  └── (currently not listed -- may need to be created or updated)
```

The barrel export chain for hooks:

```
src/hooks/index.ts
  └── exports from ./persist, ./state, ./useCopyToClipboard, ./useDebounce, ./useDebounceCallback
```

---

### Scroll Restoration

TanStack Router's `scrollRestoration: true` is already configured. This provides automatic browser-like scroll restoration when using back/forward navigation. No additional code is needed. The acceptance criterion "browser back button restores scroll position" should work out of the box.

---

### Lazy Loading Verification

Each tool page will lazy-load TWO chunks:
1. The tool page component (`src/pages/tool/index.tsx`) -- loaded via `lazyRouteComponent` in the route definition
2. The specific tool's feature component (e.g., `ColorConvertor`) -- loaded via the `lazy()` import stored in the `TOOL_REGISTRY` entry's `component` field

This two-layer lazy loading ensures:
- The route-level chunk is small (just the page wrapper + TOOL_REGISTRY lookup)
- The tool-specific chunk only loads when that specific tool is accessed
- No other tool's code is included in the bundle for a given tool page

To verify in the browser: open DevTools Network tab, navigate to `/tools/color-converter`, and confirm separate chunk requests for the page and the tool component.

---

### Important: hooks/types Barrel Export

Check if `src/types/hooks/index.ts` exists. The current codebase has:

```
src/types/hooks/
    ├── types.ts        (UsePersistFeatureLayout type)
    └── (no index.ts visible in the file tree -- may or may not exist)
```

The current `src/types/index.ts` exports `./hooks` -- if there is no `index.ts` in `src/types/hooks/`, the export may be referencing `types.ts` directly or there may be an unlisted `index.ts`. The dev agent should verify this exists and add the `seo.ts` export to it.

Similarly, verify `src/types/hooks/` barrel exports are wired through `src/types/index.ts`.

---

### Testing Notes

This story does not require writing unit tests (no pure logic functions are being created -- `useToolSeo` is a side-effect hook). However, the dev agent should:

1. Run `pnpm build` to verify no TypeScript or build errors
2. Run `pnpm test` to verify no regressions in existing tests
3. Manually verify the pre-rendered HTML output in `dist/`
4. Manually verify runtime behavior in `pnpm dev`

If the dev agent wants to add a test for the pre-render plugin output, that would be a bonus but is not required by this story.

---

### Hosting Context: Cloudflare Pages

The site is hosted on Cloudflare Pages. The pre-rendered HTML files at `dist/tools/{tool-key}/index.html` will be served automatically by Cloudflare Pages when a request hits `/tools/{tool-key}`. Cloudflare Pages supports SPA fallback behavior -- if no static file matches, it falls back to `index.html`. With pre-rendering, the tool-specific HTML is served first (for crawlers and initial load), then the React SPA hydrates and takes over.

---

### Edge Case: Direct Navigation vs. SPA Navigation

When a user navigates to `/tools/color-converter`:
- **Direct navigation (new tab, bookmark, search engine):** Cloudflare Pages serves `dist/tools/color-converter/index.html` with pre-rendered SEO tags. React hydrates, TanStack Router activates, `useToolSeo` runs and confirms/updates meta tags.
- **SPA navigation (clicking a link from the dashboard):** React handles the route transition. `useToolSeo` sets the meta tags dynamically. No server request for HTML.

Both paths produce the correct meta tags. The pre-rendering handles the crawler/direct-navigation case; `useToolSeo` handles the SPA-navigation case.

---

### vite.config.ts: Node vs. Browser Context

The Vite config runs in Node.js context. The `TOOL_REGISTRY` constant is in browser context (it imports React's `lazy()`). These two contexts cannot share the same import. This is why the pre-render plugin needs its own route/SEO data source -- either a duplicated list in `vite.config.ts` or a shared plain-data file (no React imports).

The dev agent MUST NOT try to import `TOOL_REGISTRY` directly in `vite.config.ts`. It will fail because `lazy()` is a React API unavailable in Node.

---

### References

- **Architecture document:** `_bmad-output/planning-artifacts/architecture.md` -- sections on "Routing: Hybrid Dashboard + Dedicated Routes", "Per-Tool SEO: Build-Time Pre-Rendering", and "Tool Registry: Centralized TOOL_REGISTRY"
- **Epic breakdown:** `_bmad-output/planning-artifacts/epics.md` -- Story 1.2 acceptance criteria
- **Project context:** `_bmad-output/project-context.md` -- 53 implementation rules
- **UX Design Spec:** `_bmad-output/planning-artifacts/ux-design-specification.md` -- direct URL access pattern, SEO requirements
- **TanStack Router docs:** https://tanstack.com/router/latest/docs/framework/react/guide/route-params
- **TanStack Router scroll restoration:** https://tanstack.com/router/latest/docs/framework/react/guide/scroll-restoration
- **Vite plugin API (closeBundle hook):** https://vite.dev/guide/api-plugin.html

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (claude-opus-4-6) - 2026-02-13

### Debug Log References
- Pre-existing TS error in `useDebounceCallback.ts` (Node.js `Timeout` vs browser `number` type mismatch) — fixed with `window.setTimeout`
- CSS warning `"file" is not a known CSS property` in esbuild minification — pre-existing, not related to this story

### Completion Notes List
- Task 1: Added `TOOL` to `RoutePath` union type and `ROUTE_PATH` record with value `/tools`
- Task 2: Created `src/pages/tool/index.tsx` with child component pattern (`ToolPageContent`) to safely call `useToolSeo` hook without violating hook rules. Invalid tool keys redirect to home page via `<Navigate>`. Lazy tool component rendered in `<Suspense>`.
- Task 3: Added single parameterized route `${ROUTE_PATH.TOOL}/$toolKey` to route tree using `lazyRouteComponent`
- Task 4: Created `useToolSeo` hook that manages `document.title`, `<meta name="description">`, `og:title`, `og:description`, `og:url` — restores previous values on unmount. No external dependencies (no react-helmet-async). Created `UseToolSeoParams` type.
- Task 5: Created custom Vite plugin `vite-plugin-prerender-seo` in `vite-plugins/prerender.ts`. Uses `closeBundle` hook to generate static HTML for each tool route by replacing SEO tags in `dist/index.html` template. Configured with Option A (explicit route list in vite.config.ts). Verified all 6 tool routes generate correct HTML with proper `<title>`, meta description, og:title, og:description, og:url, and canonical tags.
- Task 6: Verified `scrollRestoration: true` is already configured — no changes needed
- Task 7: Added `useToolSeo` export to `src/hooks/index.ts` and `seo` types export to `src/types/hooks/index.ts`
- Task 8: `pnpm build` passes (0 errors, 750 modules), `pnpm test` passes (15/15 tests), `pnpm lint` passes (0 errors, 2 warnings for expected console.log in build plugin), 6 pre-rendered HTML files verified with correct SEO tags
- Bug fix: Fixed pre-existing TS error in `useDebounceCallback.ts` — changed `setTimeout` to `window.setTimeout` to resolve Node.js Timeout type mismatch

### Change Log
- 2026-02-13: Fixed pre-existing bug in `src/hooks/useDebounceCallback.ts` (`setTimeout` → `window.setTimeout`) to unblock TypeScript compilation
- 2026-02-13: Chose Option A (explicit route list in vite.config.ts) for pre-render plugin data source as recommended by story Dev Notes for simplicity
- 2026-02-13: Used child-component pattern (`ToolPageContent`) in Tool Page as recommended by Dev Notes to avoid React hook ordering issues

### Code Review — Senior Developer Review (AI)
**Reviewer:** Claude Opus 4.6 — 2026-02-13
**Outcome:** 3 MEDIUM issues found and fixed, 6 LOW issues noted

**Fixes applied:**
- [M1] `src/pages/tool/index.tsx` — Replaced O(n) `TOOL_REGISTRY.find()` with O(1) `TOOL_REGISTRY_MAP[toolKey]` lookup; removed redundant type annotation (also fixes L3)
- [M2] `vite-plugins/prerender.ts` — Added `escapeHtml()` to sanitize title/description before inserting into HTML attributes, preventing malformed HTML if values contain `"`, `<`, `>`, or `&`
- [M3] `vite.config.ts` — Added SYNC warning comment above `toolRoutes` to flag data duplication with `TOOL_REGISTRY` and prevent drift

**Low issues noted (not fixed):**
- [L1] `useToolSeo` doesn't update `<link rel="canonical">` during SPA navigation (crawlers get correct canonical from pre-rendered HTML)
- [L2] Production URL hardcoded in both `useToolSeo.ts` and `prerender.ts`
- [L4] `sprint-status.yaml` modified but not in File List (added below)
- [L5] Pre-render plugin silently skips replacement if expected tags missing from template
- [L6] `path` and `url` fields always identical in `toolRoutes`

### File List

**New files:**
- `src/pages/tool/index.tsx` — Tool page component with SEO and lazy loading
- `src/hooks/useToolSeo.ts` — SEO meta tag management hook
- `src/types/hooks/seo.ts` — Type definition for useToolSeo params
- `vite-plugins/prerender.ts` — Custom Vite plugin for build-time pre-rendering

**Modified files:**
- `src/types/constants/route.ts` — Added `'TOOL'` to `RoutePath` union
- `src/constants/route.ts` — Added `TOOL: '/tools'` to `ROUTE_PATH`
- `src/routes.tsx` — Added tool route with `$toolKey` param
- `src/hooks/index.ts` — Added `useToolSeo` barrel export
- `src/types/hooks/index.ts` — Added `seo` barrel export
- `vite.config.ts` — Added prerender plugin with tool route data
- `src/hooks/useDebounceCallback.ts` — Fixed `setTimeout` → `window.setTimeout` (pre-existing bug)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated story status to `review`
