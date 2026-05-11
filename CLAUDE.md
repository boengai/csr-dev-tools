## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Adding a new tool

Tool metadata lives in `src/constants/tool-routes.ts` — the single source of truth. Both the runtime `TOOL_REGISTRY` (which adds the lazy React component) and the build-time prerenderer in `vite.config.ts` derive from it.

To add a tool:
1. Append a `ToolRoute` entry to `TOOL_ROUTES` in `src/constants/tool-routes.ts` (category, description, emoji, key, name, routePath, seo).
2. Add a `COMPONENT_LOADERS[<key>]` entry in `src/constants/tool-registry.ts` pointing at the lazy import.

`pnpm build` emits a prerendered `dist/tools/<route>/index.html` for every entry — if it's missing, the tool isn't in `TOOL_ROUTES`.

## Common hook patterns

- **`useStaleSafeAsync`** (`src/hooks/useStaleSafeAsync.ts`): consolidates the "drop stale async results when input changes" pattern. After calling `const session = newSession()`, guard post-`await` state mutations with `session.isFresh()` (early-return) or `session.ifFresh(() => ...)` (commit). Use it instead of hand-rolled `sessionRef` counters.
- **`useDebounceCallback`** (`src/hooks/useDebounceCallback.ts`): debounces an async-friendly callback and cancels its pending timeout on unmount.
- **`useToolSeo`** (`src/hooks/useToolSeo.ts`): sets `document.title` synchronously during render plus meta tags via effect. Only the tool route hooks this — the home page sets its title inline.

## AES blob format

`src/utils/aes.ts` emits a versioned blob: byte 0 is the version (`0x01` = v2, 600k PBKDF2 iterations). Decrypt dispatches on the version byte and falls back to the legacy v1 layout (no version byte, 100k iterations) so older user-saved ciphertexts still decrypt. When raising the iteration count, add a new `VERSION_V3` constant rather than mutating v2 — preserves back-compat.
