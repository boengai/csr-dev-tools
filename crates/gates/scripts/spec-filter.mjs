#!/usr/bin/env node
// Prints the Dioxus spec filter's PORTED as JSON, as Playwright sees it: Node
// runs the TypeScript itself, so no hand-written parser has to guess what an
// expression means. The gates crate compares it with app's ported-Tool list
// (tests/spec_filter.rs).
// Usage: node crates/gates/scripts/spec-filter.mjs > spec-filter.json
const { PORTED } = await import(new URL('../../../e2e/parity/dioxus-filter.ts', import.meta.url).href)
process.stdout.write(`${JSON.stringify(PORTED)}\n`)
