# Epic 22 Retrospective — Data Format Tools

**Date:** 2026-02-19
**Epic:** 22 — Data Format Tools
**Stories Completed:** 4/4

## Summary

All 4 stories implemented successfully:
- 22.1: YAML Formatter/Validator
- 22.2: ENV File Converter
- 22.3: Escaped JSON Stringifier
- 22.4: HTML Entity Converter

## What Went Well

- **Pattern consistency:** All tools follow the established Dialog-based pattern (JsonFormatter, JsonToYaml). Dual-textarea layout, debounced input, toast errors, CopyButton on output.
- **Utility-first approach:** Each tool has pure utility functions with co-located unit tests, making logic independently testable.
- **yaml v2 API:** Used `sortMapEntries` option correctly for key sorting (not a custom sort implementation).
- **895 unit tests passing,** 60 test files, build clean.

## What Could Be Improved

- **Claude CLI reliability:** The `claude -p` command hung on multi-tool prompts due to permission settings. The `.claude/settings.local.json` needed expanded permissions (Read, Write, Edit, Bash). Wasted ~30 min debugging.
- **Story artifact creation:** Should batch-create all story artifacts upfront rather than one-at-a-time.
- **HTML entity coverage:** The named entities map is limited (~20 entries). Could be expanded with a comprehensive entity table, but current coverage handles the most common cases.

## Lessons Learned

1. **Always check `.claude/settings.local.json` permissions** before running Claude Code — missing Read/Write/Edit permissions cause silent hangs in `-p` mode.
2. **Non-breaking space (U+00A0) vs regular space (U+0020)** — caught a bug where `' '` in source matched regular spaces. Use `'\u00A0'` explicitly.
3. **vitest imports required for tsc:** Even with `globals: true` in vitest config, TypeScript build needs explicit `import { describe, expect, it } from 'vitest'` in spec files.

## Metrics

- **New files:** 16 (4 utils, 4 specs, 4 components, 4 E2E tests)
- **Modified files:** 3 (tool-registry.ts, tool-registry types, data/index.ts barrel)
- **Tests added:** ~38 unit tests across 4 spec files
- **Build:** Clean, 30 static pages prerendered
