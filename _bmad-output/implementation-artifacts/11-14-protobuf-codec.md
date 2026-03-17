# Story 11.14: Protobuf Codec

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer or QA engineer**,
I want to **encode JSON into protobuf binary (raw/base64/hex) and decode protobuf binary back to JSON using a `.proto` schema**,
so that **I can cross-check that protobuf payloads match expected values during development and testing**.

## Acceptance Criteria

1. User can select an action (Encode or Decode) as the first step, matching the Base64 tool's action-selection pattern (two buttons opening a dialog)
2. User can paste `.proto` schema text in both Encode and Decode flows
3. After pasting a valid `.proto` schema, a dropdown auto-populates with all message types parsed from the schema
4. **Encode flow:** User selects output format via radio buttons (raw/base64/hex), pastes JSON, and receives encoded protobuf output in the selected format
5. **Decode flow:** User selects input format via radio buttons (raw/base64/hex), pastes encoded data, and receives JSON output
6. Schema parse errors, JSON/schema mismatches, and malformed encoded data surface as **toast** notifications
7. Tool is registered in the tool registry under the "Code" category with key `protobuf-codec`, route `/tools/protobuf-codec`, and appropriate SEO metadata
8. Existing "Protobuf to JSON" tool remains untouched
9. All processing is 100% client-side using the `protobufjs` library (already a project dependency)

## Tasks / Subtasks

- [x] Task 1: Create utility module `src/utils/protobuf-codec.ts` (AC: #3, #4, #5, #6, #9)
  - [x] 1.1 Reuse `parseProtobufSchema()` from `protobuf-to-json.ts` to parse schema and extract message types for dropdown
  - [x] 1.2 Implement `encodeProtobuf(schema, messageType, json, outputFormat)` — uses `protobufjs` `Type.encode()` to produce binary, then convert to raw/base64/hex
  - [x] 1.3 Implement `decodeProtobuf(schema, messageType, input, inputFormat)` — converts from raw/base64/hex to binary, then uses `Type.decode()` to produce JSON
  - [x] 1.4 Implement format conversion helpers: binary ↔ text (raw wire), binary ↔ base64, binary ↔ hex
- [x] Task 2: Create component `src/components/feature/code/ProtobufCodec.tsx` (AC: #1, #2, #3, #4, #5, #6)
  - [x] 2.1 Action selection: two `Button` components ("Encode" / "Decode") opening a `Dialog` — mirror `EncodingBase64.tsx` pattern
  - [x] 2.2 Dialog layout: `.proto` schema `CodeInput`, message type dropdown (`<select>`), format radio buttons, source input `FieldForm`/`CodeInput`, and `CodeOutput` for result
  - [x] 2.3 Wire debounced schema parsing → populate dropdown on schema change
  - [x] 2.4 Wire encode/decode logic on input change with `useDebounceCallback`
  - [x] 2.5 Toast errors via `useToast` hook
- [x] Task 3: Register tool in `src/constants/tool-registry.ts` (AC: #7)
  - [x] 3.1 Add entry with `category: 'Code'`, `key: 'protobuf-codec'`, lazy-loaded component
- [x] Task 4: Export from barrel `src/components/feature/code/index.ts` (AC: #7)
- [x] Task 5: Add route to Vite prerender list (AC: #7)
- [x] Task 6: Write unit tests `src/utils/protobuf-codec.spec.ts` (AC: #4, #5, #6)
  - [x] 6.1 Encode: valid JSON → raw/base64/hex for simple and nested messages
  - [x] 6.2 Decode: raw/base64/hex → JSON for simple and nested messages
  - [x] 6.3 Round-trip: encode then decode produces original JSON
  - [x] 6.4 Error cases: invalid schema, JSON/schema mismatch, malformed encoded input
- [x] Task 7: Write E2E tests `e2e/protobuf-codec.spec.ts` (AC: #1–#8)
  - [x] 7.1 Action selection opens correct dialog
  - [x] 7.2 Schema parsing populates message type dropdown
  - [x] 7.3 Encode and decode happy paths
  - [x] 7.4 Error toast on bad input

## Dev Notes

### Architecture & Patterns

- **Action-selection pattern**: Follow `EncodingBase64.tsx` exactly — two `Button` components on the main tool page, each opening a full-screen `Dialog` with the selected action. Use `useState<'decode' | 'encode'>` for action state.
- **Schema parsing**: Reuse the existing `parseProtobufSchema()` from `src/utils/protobuf-to-json.ts` — do NOT duplicate. Import it directly. It already uses `protobufjs` and returns `ProtobufSchemaInfo` with all message types.
- **Encoding/Decoding**: Use `protobufjs` `Type.fromObject()` + `Type.encode()` for encoding, and `Type.decode()` + `Type.toObject()` for decoding. The library is already installed (`protobufjs` in `package.json`). You'll need to work with `protobuf.parse()` directly to get `Type` instances for encode/decode (the existing util only extracts metadata, not live Type references).
- **Format conversions**:
  - **raw**: Raw binary wire format — actual protobuf bytes as literal characters (same as `.pb` file content)
  - **base64**: Standard base64 encoding of binary output (`Uint8Array` → `btoa`)
  - **hex**: Hex string of binary output (`Uint8Array` → hex pairs like `0a054865...`)
- **Debounce**: Use `useDebounceCallback` from `@/hooks` (300ms) for schema parsing and encode/decode processing, same as existing tools.
- **LocalStorage**: Use `useInputLocalStorage` for schema text persistence with key `csr-dev-tools-protobuf-codec-input`.
- **Toast errors**: Use `useToast` hook — `toast({ action: 'add', item: { label: '...', type: 'error' } })`.

### Component Structure (Dialog Layout)

```
Dialog (size="screen")
├── CodeInput — .proto schema
├── <select> — message type dropdown (populated from parsed schema)
├── Radio group — format selection (text / base64 / hex)
├── FieldForm/CodeInput — source input (JSON for encode, encoded data for decode)
├── Divider (dashed border, responsive)
└── CodeOutput + CopyButton — result
```

### Key Imports

- `Button`, `CodeOutput`, `CopyButton`, `Dialog`, `FieldForm`, `CodeInput` from `@/components/common`
- `TOOL_REGISTRY_MAP` from `@/constants`
- `useDebounceCallback`, `useInputLocalStorage`, `useToast` from `@/hooks`
- `parseProtobufSchema` and types from `@/utils/protobuf-to-json`
- `protobufjs` (direct import for encode/decode — `import * as protobuf from 'protobufjs'`)

### Project Structure Notes

- Component file: `src/components/feature/code/ProtobufCodec.tsx`
- Utility file: `src/utils/protobuf-codec.ts`
- Unit tests: `src/utils/protobuf-codec.spec.ts`
- E2E tests: `e2e/protobuf-codec.spec.ts`
- Barrel export: `src/components/feature/code/index.ts`
- Registry: `src/constants/tool-registry.ts`
- Prerender: `vite.config.ts` (or wherever prerender routes are listed)
- Naming: kebab-case files, PascalCase component, camelCase utils
- NO new dependencies needed — `protobufjs` is already installed

### Testing Standards

- **Unit tests** (vitest, node env): Test encode/decode functions in isolation. No jsdom.
- **E2E tests** (Playwright): Test full user flows — action selection, schema paste, dropdown, encode/decode, error toasts.
- Run: `pnpm vitest run src/utils/protobuf-codec.spec.ts` and `pnpm playwright test e2e/protobuf-codec.spec.ts`

### References

- [Source: src/components/feature/encoding/EncodingBase64.tsx] — Action-selection pattern (Button → Dialog)
- [Source: src/components/feature/code/ProtobufToJson.tsx] — Schema parsing UI, CodeInput usage, message browsing
- [Source: src/utils/protobuf-to-json.ts] — `parseProtobufSchema()`, `ProtobufSchemaInfo` types
- [Source: src/constants/tool-registry.ts:1520-1540] — Existing protobuf-to-json registry entry pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Implemented `encodeProtobuf()` and `decodeProtobuf()` functions with format conversion helpers (base64, hex, text wire format)
- Schema parsing reuses `parseProtobufSchema()` from existing `protobuf-to-json.ts` (dynamic import in component); codec utility uses `protobufjs` directly for `Type.encode()`/`Type.decode()`
- Component follows `EncodingBase64.tsx` action-selection pattern: two buttons → full-screen dialog
- Dialog includes CodeInput for schema, dropdown for message types, radio buttons for format, textarea for source, and CodeOutput for result
- Schema persisted via `useInputLocalStorage` with key `csr-dev-tools-protobuf-codec-input`
- All processing debounced at 300ms, errors surfaced via toast notifications
- 18 unit tests covering encode (3 formats, nested), decode (3 formats, nested), round-trip (all formats), and error cases (7 scenarios)
- 6 E2E tests covering dialog open, schema parsing, encode/decode happy paths, error toast, and protobuf-to-json tool still accessible
- All 1554 vitest tests pass (0 regressions), TypeScript compilation clean, oxlint clean
- No new dependencies added — `protobufjs` already installed

### Change Log

- 2026-03-17: Implemented Protobuf Codec tool — encode JSON to protobuf binary and decode back, with base64/hex/text format support
- 2026-03-17: Code review fixes — added missing ToolRegistryKey type, re-trigger encode/decode on message type change, fixed E2E decode test, improved decode precision (longs/enums as strings), strengthened weak test assertion, deduplicated binary-to-string logic

### File List

- `src/utils/protobuf-codec.ts` (new) — encode/decode utility functions and format converters
- `src/utils/protobuf-codec.spec.ts` (new) — 18 unit tests
- `src/components/feature/code/ProtobufCodec.tsx` (new) — tool component
- `src/components/feature/code/index.ts` (modified) — barrel export
- `src/constants/tool-registry.ts` (modified) — registry entry
- `src/types/constants/tool-registry.ts` (modified) — added 'protobuf-codec' to ToolRegistryKey union
- `src/components/common/output/CodeOutput.tsx` (modified) — break-words → break-all for encoded output display
- `vite.config.ts` (modified) — prerender route
- `e2e/protobuf-codec.spec.ts` (new) — 6 E2E tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — status update
