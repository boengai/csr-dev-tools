## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Typecheck command

Run `pnpm typecheck` (NOT `pnpm tsc --noEmit`). The root `tsconfig.json`
uses project references with `"files": []`, so a bare `tsc --noEmit`
exits 0 against an empty file set and silently typechecks nothing.
The `typecheck` script is `tsc -b --noEmit` which respects the
project references and surfaces real errors.

## Adding a new tool

Tool metadata lives in `src/constants/tool-routes.ts` — the single source of truth. Both the runtime `TOOL_REGISTRY` (which adds the lazy React component) and the build-time prerenderer in `vite.config.ts` derive from it.

To add a tool:
1. Append a `ToolRoute` entry to `TOOL_ROUTES` in `src/constants/tool-routes.ts` (category, description, emoji, key, name, routePath, seo).
2. Add a `COMPONENT_LOADERS[<key>]` entry in `src/constants/tool-registry.ts` pointing at the lazy import.

`pnpm build` emits a prerendered `dist/tools/<route>/index.html` for every entry — if it's missing, the tool isn't in `TOOL_ROUTES`.

## Common component API rule

Common components (`Button`, `CopyButton`, `ToggleButton`, future `Badge`, etc.) **do not accept `className` or `style` overrides**. If a call site needs a layout tweak (width, min-width, grid placement), do it on a wrapper element or via a parent `grid`/`flex` container. If a true visual variant is needed, add a named prop on the component (e.g. `size: 'default' | 'compact'`) — never a freeform class prop. Keeps the design system enforceable and prevents per-call drift.

## Common hook patterns

- **`useStaleSafeAsync`** (`src/hooks/useStaleSafeAsync.ts`): consolidates the "drop stale async results when input changes" pattern. After calling `const session = newSession()`, guard post-`await` state mutations with `session.isFresh()` (early-return) or `session.ifFresh(() => ...)` (commit). Use it instead of hand-rolled `sessionRef` counters.
- **`useDebounceCallback`** (`src/hooks/useDebounceCallback.ts`): debounces an async-friendly callback and cancels its pending timeout on unmount.
- **`useToolSeo`** (`src/hooks/useToolSeo.ts`): sets `document.title` synchronously during render plus meta tags via effect. Only the tool route hooks this — the home page sets its title inline.

## Verifying UI changes

After any UI/frontend change, verify it in a browser via the **playwright-mcp** tools before claiming the task is done. Type checking and tests do not prove a feature works — only driving the UI does.

Workflow:
1. Start the dev server (`pnpm dev`) and note the port.
2. `mcp__plugin_playwright_playwright__browser_navigate` to the affected tool route (e.g. `http://localhost:5173/tools/<route>`).
3. `mcp__plugin_playwright_playwright__browser_snapshot` to inspect the rendered DOM, then drive the feature with `browser_click` / `browser_type` / `browser_fill_form`.
4. `mcp__plugin_playwright_playwright__browser_console_messages` to check for runtime errors and React warnings.
5. Exercise the golden path **and** at least one edge case; also click into one unrelated tool to catch regressions.

If the dev server can't be started or the route can't be reached, say so explicitly — do not claim UI success without a verified snapshot.

## AES blob format

`src/utils/aes.ts` emits a versioned blob: byte 0 is the version (`0x01` = v2, 600k PBKDF2 iterations). Decrypt dispatches on the version byte and falls back to the legacy v1 layout (no version byte, 100k iterations) so older user-saved ciphertexts still decrypt. When raising the iteration count, add a new `VERSION_V3` constant rather than mutating v2 — preserves back-compat.
