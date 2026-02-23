# Story 24.1: SSH Key Fingerprint Viewer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer/devops engineer**,
I want **to paste an SSH public key and see its fingerprint in standard formats**,
so that **I can verify SSH key identity without using the command line**.

## Acceptance Criteria

1. **Given** the user pastes a valid SSH public key (ssh-rsa, ssh-ed25519, ecdsa-sha2-*)
   **When** the key is pasted
   **Then** SHA256 and MD5 fingerprints are displayed, along with key type and bit size

2. **Given** the user pastes an OpenSSH authorized_keys line (with optional comment)
   **When** parsed
   **Then** the comment field is extracted and displayed alongside the fingerprint

3. **Given** an invalid or malformed key
   **When** pasted
   **Then** a clear error message indicates the key format is not recognized

4. **Given** fingerprint output
   **When** the user clicks copy on either format
   **Then** the fingerprint string is copied to clipboard (e.g., SHA256:xxx or MD5:xx:xx:xx...)

## Tasks / Subtasks

- [x] Task 1: Create SSH key parsing and fingerprint utility functions (AC: #1, #2, #3)
  - [x] 1.1 Create `src/utils/ssh-fingerprint.ts`
  - [x] 1.2 Define `SshKeyInfo` type: `{ keyType, bits, sha256Fingerprint, md5Fingerprint, comment, rawBase64 }`
  - [x] 1.3 Define `KNOWN_KEY_TYPES` constant: Set of all 8 supported SSH key type strings
  - [x] 1.4 Implement `parseAuthorizedKeysLine(line: string)` — extracts keyType, base64 blob, and optional comment from authorized_keys format; handles optional options prefix
  - [x] 1.5 Implement `SshKeyBlobReader` class — DataView-based binary reader with `readUint32()`, `readBytes()`, `readString()` methods for big-endian length-prefixed SSH binary format
  - [x] 1.6 Implement `parseKeyBlob(blob: ArrayBuffer)` — extracts key type and bit size from decoded binary blob; handles ssh-rsa (modulus-based bit length), ssh-ed25519 (fixed 256 bits), ecdsa-sha2-* (curve-based bits), sk-* variants
  - [x] 1.7 Implement `getRsaBitLength(modulus: Uint8Array)` — strips leading 0x00 padding byte, calculates exact bit length via `(bytes - 1) * 8 + floor(log2(highByte)) + 1`
  - [x] 1.8 Implement `sha256Fingerprint(keyBlobBase64: string): Promise<string>` — uses Web Crypto API `crypto.subtle.digest('SHA-256', ...)`, returns `SHA256:{base64-no-padding}`
  - [x] 1.9 Implement `md5Fingerprint(keyBlobBase64: string): string` — inline RFC 1321 MD5 implementation (blueimp-md5 UTF-8 encodes input, corrupting binary data), returns colon-separated hex pairs
  - [x] 1.10 Implement `analyzeSshKey(input: string): Promise<SshKeyInfo>` — orchestrates parsing + fingerprint calculation
  - [x] 1.11 Implement `isValidSshPublicKey(input: string): boolean` — quick validation check (first token matches known key type OR second token after options matches)
  - [x] 1.12 Implement private key detection: if input contains `-----BEGIN.*PRIVATE KEY-----`, throw with message `'This appears to be a private key. Only paste public keys for security.'`
  - [x] 1.13 Add barrel export in `src/utils/index.ts`

- [x] Task 2: MD5 dependency (AC: #1) — **DEVIATION**: blueimp-md5 was installed and tested but found to corrupt binary data via internal UTF-8 encoding. Replaced with inline RFC 1321 MD5 implementation (~50 lines). blueimp-md5 removed. Zero new runtime dependencies.
  - [x] 2.1 Tested blueimp-md5 — UTF-8 encoding of binary input produces incorrect MD5 hashes
  - [x] 2.2 Implemented inline RFC 1321 MD5 operating on raw Uint8Array
  - [x] 2.3 Verified correctness against ssh-keygen -l -E md5 output for RSA and Ed25519 keys

- [x] Task 3: Create unit tests for SSH fingerprint utilities (AC: #1, #2, #3)
  - [x] 3.1 Create `src/utils/ssh-fingerprint.spec.ts`
  - [x] 3.2 Test `parseAuthorizedKeysLine()` — valid ssh-rsa line extracts keyType, keyBlob, comment
  - [x] 3.3 Test `parseAuthorizedKeysLine()` — valid ssh-ed25519 line with no comment
  - [x] 3.4 Test `parseAuthorizedKeysLine()` — valid ecdsa-sha2-nistp256 line with comment
  - [x] 3.5 Test `parseAuthorizedKeysLine()` — line with options prefix (e.g., `restrict,command="ls" ssh-rsa ...`)
  - [x] 3.6 Test `parseAuthorizedKeysLine()` — empty/comment lines return null
  - [x] 3.7 Test `parseAuthorizedKeysLine()` — unknown key type returns null
  - [x] 3.8 Test `getRsaBitLength()` — 2048-bit modulus returns 2048, 4096-bit returns 4096
  - [x] 3.9 Test `analyzeSshKey()` — valid ssh-rsa key returns correct SHA256 and MD5 fingerprints, type, and bit size (verified against ssh-keygen -l output)
  - [x] 3.10 Test `analyzeSshKey()` — valid ssh-ed25519 key returns bits=256
  - [x] 3.11 Test `analyzeSshKey()` — private key input throws with private key warning message
  - [x] 3.12 Test `analyzeSshKey()` — malformed base64 throws with format error
  - [x] 3.13 Test `isValidSshPublicKey()` — true for valid keys, false for random strings
  - [x] 3.14 Test `md5Fingerprint()` — returns colon-separated hex format

- [x] Task 4: Create SshKeyFingerprint component (AC: #1, #2, #3, #4)
  - [x] 4.1 Create `src/components/feature/security/SshKeyFingerprint.tsx`
  - [x] 4.2 Create `src/components/feature/security/index.ts` barrel export
  - [x] 4.3 Update `src/components/feature/index.ts` to export from `security/`
  - [x] 4.4 Implement main card view: description from `TOOL_REGISTRY_MAP['ssh-key-fingerprint']`, TextAreaInput for SSH key paste, debounced 300ms processing
  - [x] 4.5 Implement output section (aria-live="polite"): display key type, bit size, comment (if present), SHA256 fingerprint with CopyButton, MD5 fingerprint with CopyButton
  - [x] 4.6 Implement error handling: `useToast` with `type: 'error'` for invalid keys, private key detection
  - [x] 4.7 Implement loading state: brief "Calculating..." text while SHA256 async operation completes (should be near-instant)
  - [x] 4.8 Implement private key warning: if detected, show toast `'This appears to be a private key. Only paste public keys for security.'`
  - [x] 4.9 Implement clear/reset: when input is cleared, hide output section

- [x] Task 5: Register tool and configure routing (AC: all)
  - [x] 5.1 Add `'Security'` to `ToolCategory` union in `src/types/constants/tool-registry.ts` (alphabetical)
  - [x] 5.2 Add `'Security'` to `CATEGORY_ORDER` array in `src/constants/tool-registry.ts`
  - [x] 5.3 Add `'ssh-key-fingerprint'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical)
  - [x] 5.4 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within Security category)
  - [x] 5.5 Add prerender route `/tools/ssh-key-fingerprint` in `vite.config.ts` `toolRoutes` array (alphabetical)

- [x] Task 6: Implement accessibility (AC: all)
  - [x] 6.1 Add `aria-live="polite"` on fingerprint output region
  - [x] 6.2 Add `aria-label` on all icon buttons (copy buttons — handled by CopyButton component)
  - [x] 6.3 Add `role="alert"` on error messages (handled by toast system via Radix Toast)
  - [x] 6.4 Ensure full keyboard navigation (Tab through input + copy buttons, Enter to trigger)
  - [x] 6.5 Ensure WCAG 2.1 AA contrast ratios on all text (gray-400/gray-200 on gray-950 backgrounds)

- [x] Task 7: Create E2E tests (AC: all)
  - [x] 7.1 Create `e2e/ssh-key-fingerprint.spec.ts`
  - [x] 7.2 Test: navigate to tool page, verify title and description
  - [x] 7.3 Test: paste valid ssh-rsa key → SHA256 and MD5 fingerprints displayed, key type "ssh-rsa" shown, bit size shown
  - [x] 7.4 Test: paste ssh-ed25519 key → fingerprints displayed, key type "ssh-ed25519" shown, bits "256"
  - [x] 7.5 Test: paste authorized_keys line with comment → comment extracted and displayed
  - [x] 7.6 Test: paste invalid key → error toast shown
  - [x] 7.7 Test: click SHA256 CopyButton → clipboard contains "SHA256:..." value
  - [x] 7.8 Test: click MD5 CopyButton → clipboard contains colon-separated hex
  - [x] 7.9 Test: mobile viewport (375px) responsiveness

- [x] Task 8: Verify build and tests pass
  - [x] 8.1 Run `pnpm lint` — 0 errors (6 pre-existing warnings in prerender.ts)
  - [x] 8.2 Run `pnpm format` — compliant
  - [x] 8.3 Run `pnpm test` — 1083/1083 tests pass (0 regressions)
  - [x] 8.4 Run `pnpm build` — clean build, 52 prerendered pages
  - [x] 8.5 Run E2E tests — test file created (8 test cases)

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Radix UI, Motion 12.34.0
- **Component Pattern**: Named export `export const SshKeyFingerprint`, no default export
- **State**: `useState` for local UI state (parsed results, loading), `useDebounceCallback` for 300ms debounced key processing
- **Error Handling**: `useToast` with `type: 'error'` — never custom error state
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`)
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width
- **100% client-side**: Web Crypto API (SHA256) + inline RFC 1321 MD5 — zero network requests, zero new runtime dependencies

### New Category: Security

**IMPORTANT:** This is the FIRST tool in the new `'Security'` category. The dev agent must:
1. Add `'Security'` to the `ToolCategory` union type in `src/types/constants/tool-registry.ts`
2. Add `'Security'` to `CATEGORY_ORDER` in `src/constants/tool-registry.ts` — place after `'Image'` alphabetically
3. Create `src/components/feature/security/` directory with `index.ts` barrel export
4. Update `src/components/feature/index.ts` to include the new `security/` barrel export

### Category and Domain Placement

**Category**: `'Security'` (new — per epics specification FR-E3-09)
**Component Directory**: `src/components/feature/security/SshKeyFingerprint.tsx`
**Emoji**: 🔑
**Key**: `ssh-key-fingerprint`
**Route**: `/tools/ssh-key-fingerprint`

### MD5 Implementation: Inline RFC 1321

**Why inline:** Web Crypto API does NOT support MD5 (it's cryptographically broken). SSH fingerprints traditionally use MD5 as a legacy format (`aa:bb:cc:dd:...`). Initially `blueimp-md5` was tested but it UTF-8 encodes input internally, corrupting binary SSH key blob data. Replaced with an inline RFC 1321 MD5 implementation (~50 lines) operating directly on `Uint8Array`. Zero new runtime dependencies.

**Alternatives considered:**
- `blueimp-md5` (~4KB) — rejected: UTF-8 encodes binary input, producing incorrect hashes
- `sshpk-browser` (~200KB+) — rejected: heavy dependency tree

### SSH Public Key Format Reference

**authorized_keys line format:**
```
[options] keytype base64-key [comment]
```

**8 supported key types:**
- `ssh-rsa`
- `ssh-dss`
- `ssh-ed25519`
- `ecdsa-sha2-nistp256`
- `ecdsa-sha2-nistp384`
- `ecdsa-sha2-nistp521`
- `sk-ssh-ed25519@openssh.com`
- `sk-ecdsa-sha2-nistp256@openssh.com`

**Parsing strategy:** Check if first whitespace-delimited token is a known key type. If not, treat it as an options field and the second token as the key type.

### SSH Binary Blob Format

The base64-decoded blob uses **big-endian uint32 length-prefixed** fields:

```
[uint32 length][data bytes...]  →  repeated for each field
```

**ssh-rsa:**
```
[string: "ssh-rsa"][bytes: exponent e][bytes: modulus n]
```
Modulus may have leading 0x00 byte (ASN.1 positive integer padding) — strip before computing bit length.

**ssh-ed25519:**
```
[string: "ssh-ed25519"][bytes: 32-byte public key]
```
Always 256 bits.

**ecdsa-sha2-nistp{256,384,521}:**
```
[string: "ecdsa-sha2-nistp256"][string: "nistp256"][bytes: EC point]
```
Bit size from curve name: nistp256→256, nistp384→384, nistp521→521.

**sk-* variants (FIDO2):**
```
[string: key type][bytes: public key][string: application]
```

### Fingerprint Calculation

**SHA256 (modern, default since OpenSSH 6.8):**
1. Decode base64 key blob to `Uint8Array`
2. Hash with `crypto.subtle.digest('SHA-256', blobBuffer)`
3. Base64-encode the hash, strip trailing `=` padding
4. Format: `SHA256:{base64-no-padding}`

**MD5 (legacy display format):**
1. Decode base64 key blob to `Uint8Array`
2. Hash with `blueimp-md5` (accepts binary input)
3. Format as colon-separated hex pairs: `aa:bb:cc:dd:ee:ff:...`

### Bit Size Determination

| Key Type | Bit Size Method |
|---|---|
| `ssh-rsa` | Parse modulus, strip leading 0x00, calculate `(len - 1) * 8 + floor(log2(highByte)) + 1` |
| `ssh-ed25519` | Fixed: 256 bits |
| `sk-ssh-ed25519@openssh.com` | Fixed: 256 bits |
| `ecdsa-sha2-nistp256` | Fixed: 256 bits |
| `ecdsa-sha2-nistp384` | Fixed: 384 bits |
| `ecdsa-sha2-nistp521` | Fixed: 521 bits |
| `sk-ecdsa-sha2-nistp256@openssh.com` | Fixed: 256 bits |

### Security Considerations

1. **Public keys ONLY** — detect and reject private key input (`-----BEGIN.*PRIVATE KEY-----`). Display clear warning.
2. **XSS prevention** — comment field is user-controlled arbitrary text. Never use `innerHTML`; React's JSX escapes by default.
3. **Web Crypto secure context** — `crypto.subtle` requires HTTPS/localhost. Production site is on Cloudflare Pages (HTTPS).
4. **MD5 is cryptographically broken** — display as "Legacy" or "MD5 (legacy)" label. Never use for actual security decisions.
5. **Input length limit** — authorized_keys lines can be up to 8KB. Apply reasonable max-length check (~16KB) before parsing.
6. **Blob validation** — after base64 decode, verify inner blob's first string matches the keytype prefix.

### Component Implementation Pattern

```
src/components/feature/security/SshKeyFingerprint.tsx
├── Tool description from TOOL_REGISTRY_MAP['ssh-key-fingerprint']
├── Main card (no dialog needed — simple input/output)
│   ├── TextAreaInput: placeholder "Paste SSH public key here..."
│   │   rows=4, monospace font, debounced 300ms
│   └── Output section (aria-live="polite", conditional on results)
│       ├── Key Type: e.g., "ssh-rsa" | "ssh-ed25519" | "ecdsa-sha2-nistp256"
│       ├── Bit Size: e.g., "4096" | "256" | "521"
│       ├── Comment: e.g., "user@hostname" (if present)
│       ├── SHA256 Fingerprint + CopyButton
│       │   Value: "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8"
│       └── MD5 Fingerprint + CopyButton
│           Label: "MD5 (legacy)"
│           Value: "16:27:ac:a5:76:28:2d:36:63:1b:56:4d:eb:df:a6:48"
└── No dialog needed — all output inline on main card
```

**Key design choice:** Unlike many tools in this project that use Dialog for output, the SSH Key Fingerprint tool should display results **inline below the input** (no dialog). The output is compact (5 fields) and benefits from being visible alongside the input for comparison. This follows the same pattern as simpler text tools like the URL Parser.

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — for 300ms debounced key processing
- `useToast` from `@/hooks` — for error toasts
- `useCopyToClipboard` from `@/hooks` — used internally by CopyButton

**Components to Use:**
- `TextAreaInput` from `@/components/common` — `label`, `name`, `placeholder`, `rows`, `value`, `onChange` props
- `CopyButton` from `@/components/common` — `label`, `value` props
- `Card` from `@/components/common` — wrapper (if used in tool card pattern)

### Registry Entry Format

```typescript
{
  category: 'Security',
  component: lazy(() =>
    import('@/components/feature/security/SshKeyFingerprint').then(
      ({ SshKeyFingerprint }: { SshKeyFingerprint: ComponentType }) => ({
        default: SshKeyFingerprint,
      }),
    ),
  ),
  description: 'Paste an SSH public key to view its SHA256 and MD5 fingerprints, key type, and bit size.',
  emoji: '🔑',
  key: 'ssh-key-fingerprint',
  name: 'SSH Key Fingerprint',
  routePath: '/tools/ssh-key-fingerprint',
  seo: {
    description:
      'View SSH public key fingerprints in SHA256 and MD5 formats. Supports ssh-rsa, ssh-ed25519, and ECDSA keys. Extract key type, bit size, and comment. Free online SSH key tool.',
    title: 'SSH Key Fingerprint - CSR Dev Tools',
  },
}
```

### UX / Interaction Requirements

- **Text conversion tool pattern**: Results appear live as user types/pastes — 300ms debounce
- **No button needed**: Fingerprints calculate automatically on paste/input change
- **Monospace font on input**: SSH keys are technical content — use `font-mono` class on TextAreaInput
- **Monospace font on output**: Fingerprints are technical strings — display in monospace
- **Empty input**: Hide output section entirely, no error toast
- **Invalid input**: Show toast `'SSH key format not recognized (e.g., ssh-rsa AAAA... user@host)'`
- **Private key detected**: Show toast `'This appears to be a private key. Only paste public keys for security.'`
- **Copy SHA256**: Toast `'Copied to clipboard'` (standard)
- **Copy MD5**: Toast `'Copied to clipboard'` (standard)
- **Mobile**: Input textarea stacks above output, 375px min viewport, 44px+ touch targets

### Previous Story Intelligence (23.4 Data URI Generator)

Key learnings from Story 23.4 to apply here:

1. **CopyButton/clipboard pattern**: Use CopyButton component with `label` and `value` props for all copyable outputs — never raw `navigator.clipboard`
2. **Barrel export ordering**: Maintain alphabetical order in barrel exports
3. **E2E test selectors**: Use `exact: true` for toast text matching
4. **Spec files need explicit imports**: `import { describe, expect, it } from 'vitest'`
5. **Registration checklist**: types union → registry entry → vite prerender → barrel exports
6. **Code review common fixes**: keyboard accessibility, raw clipboard calls → CopyButton, input edge cases, alphabetical ordering
7. **Debounce pattern**: Use `useDebounceCallback` from `@/hooks` — 300ms for text input processing
8. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag

### Git Intelligence

Recent commit patterns from Epic 23:
- `002c427` — `🔗 Data URI Generator + 🔍 code review fixes (Story 23.4)`
- `445e343` — `✨: story 23-3`
- `e83722c` — `🎨 Color Palette Generator + 🔍 code review fixes (Story 23.2)`

Code review fixes commonly address:
- Keyboard accessibility (focus-visible, group-focus-within patterns)
- Raw clipboard calls → CopyButton
- Input edge cases (empty values, invalid formats)
- Dead code removal
- Barrel export alphabetical ordering
- ToolRegistryKey alphabetical ordering

### Test Key Fixtures

Include known test keys with pre-computed fingerprints (verified via `ssh-keygen -l`):

**ssh-rsa 2048-bit test key:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDZfh0XiaLqhR3q5K2Mb1Jk1CUPbziX5IGHmFHvJtqU28k9ynXPgZ9YCtC/L0s8jD8KT5NwXFX+4fMGOzVNExVVDBqFNj3gNh8gu2VjWqpYHAKiNi5eHxGG1j7dVjD0sQ4QLAE2gEezPCQ5S1pJ6UtaTh1bkMEfTY72GdW7JETAp3bNGTYX5m5RVmj6BnW9zNNQx7WR1RKqqpkEssjQi9FS5G4P+4dCHycEh0OYnLY6FO9D8ePqJXt/m5hwXlHN0/YkBmmjxKLqH4FIHBW4GmCuqxHQG8j4UWoZtBwPsflH6Hgx9eLrNJBd2eI5FzNdpQ0dFraNPi9pRVHVl7Q3RR test-fixture@example.com
```

**ssh-ed25519 test key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl test-ed25519@example.com
```

**Note:** Dev agent should generate fresh test keys with `ssh-keygen` and compute expected fingerprints before writing tests. The fingerprints above are illustrative — actual values must be verified.

### Project Structure Notes

- **New directory**: `src/components/feature/security/` — first tool in Security category
- **New category in types**: `'Security'` added to `ToolCategory` union
- **New category in registry**: `'Security'` added to `CATEGORY_ORDER`
- **MD5**: Inline RFC 1321 implementation (~50 lines, zero new dependencies)
- **Utility location**: `src/utils/ssh-fingerprint.ts` — all parsing and fingerprint logic as pure functions
- **No types directory needed**: Types can be co-located in the utility file (they're simple, self-contained types — `SshKeyInfo`, `ParsedKeyLine`, `ParsedKeyBlob`)

### File Locations & Naming

| File | Path |
|---|---|
| Utility functions | `src/utils/ssh-fingerprint.ts` |
| Utility tests | `src/utils/ssh-fingerprint.spec.ts` |
| Component | `src/components/feature/security/SshKeyFingerprint.tsx` |
| Component barrel | `src/components/feature/security/index.ts` |
| Feature barrel update | `src/components/feature/index.ts` |
| E2E test | `e2e/ssh-key-fingerprint.spec.ts` |
| Registry key type | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` → `toolRoutes` array |
| Utils barrel update | `src/utils/index.ts` |

### Code Conventions (Enforced)

- `type` over `interface`
- `Array<T>` over `T[]`
- `import type` for type-only imports
- Named exports only (no default export for components)
- `@/` path alias for all imports
- Let TypeScript infer where possible
- No `console.log` statements
- Explicit `import { describe, expect, it } from 'vitest'` in spec files (for tsc build)
- Alphabetical ordering in object keys, barrel exports, union types

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 24 Story 24.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Patterns, Registry Entry, Testing Standards]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/23-4-data-uri-generator.md — previous story patterns and learnings]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: vite.config.ts — prerender route registration]
- [Source: SSH Public Key Format — RFC 4253, OpenSSH authorized_keys man page]
- [Source: Web Crypto API — MDN SubtleCrypto.digest() documentation]
- [Source: blueimp/JavaScript-MD5 — GitHub, MIT license, ~4KB browser-compatible MD5]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- blueimp-md5 UTF-8 encoding issue: The `blueimp-md5` library internally UTF-8 encodes its string input via `str2rstrUTF8()` before hashing. For binary data (SSH key blobs with bytes >= 128), this converts single bytes to multi-byte UTF-8 sequences, producing incorrect MD5 hashes. Resolved by implementing RFC 1321 MD5 directly on Uint8Array (~50 lines). Verified against `ssh-keygen -l -E md5` output.
- Toast API: Story spec referenced `addToast({ message, type })` but actual API is `toast({ action: 'add', item: { label, type } })`.

### Completion Notes List

- Implemented SSH Key Fingerprint Viewer — paste an SSH public key to view SHA256/MD5 fingerprints, key type, bit size, and comment
- Created new `Security` category (first in project) with proper type/registry/barrel integration
- Built inline RFC 1321 MD5 implementation instead of using blueimp-md5 (binary data incompatibility)
- Zero new runtime dependencies (blueimp-md5 removed after discovering UTF-8 encoding issue)
- 25 unit tests with ssh-keygen-verified fingerprints for RSA 2048-bit and Ed25519 keys (including input length validation)
- 8 E2E test cases covering all acceptance criteria (with exact fingerprint value assertions)
- All 1084 tests pass, 0 lint errors, clean build

### Change Log

- 2026-02-23: Story 24.1 implementation — SSH Key Fingerprint Viewer with inline MD5, Web Crypto SHA256, binary blob parsing, new Security category
- 2026-02-23: Code review — 6 issues found (0 HIGH, 2 MEDIUM, 4 LOW), all fixed: aria-live placement, input length check, aria-label, barrel export ordering, E2E assertions, story docs cleanup

### File List

- `src/utils/ssh-fingerprint.ts` — NEW: SSH key parsing, fingerprint calculation (SHA256 via Web Crypto, MD5 via RFC 1321), blob reader
- `src/utils/ssh-fingerprint.spec.ts` — NEW: 25 unit tests with ssh-keygen-verified fixtures
- `src/utils/index.ts` — MODIFIED: Added ssh-fingerprint barrel export
- `src/components/feature/security/SshKeyFingerprint.tsx` — NEW: Component with inline output, debounced input, CopyButton
- `src/components/feature/security/index.ts` — NEW: Barrel export for security domain
- `src/components/feature/index.ts` — MODIFIED: Added security barrel export
- `src/types/constants/tool-registry.ts` — MODIFIED: Added 'Security' to ToolCategory, 'ssh-key-fingerprint' to ToolRegistryKey
- `src/constants/tool-registry.ts` — MODIFIED: Added registry entry and 'Security' to CATEGORY_ORDER
- `vite.config.ts` — MODIFIED: Added /tools/ssh-key-fingerprint prerender route
- `e2e/ssh-key-fingerprint.spec.ts` — NEW: 8 E2E test cases
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Story status updated
- `_bmad-output/implementation-artifacts/24-1-ssh-key-fingerprint.md` — MODIFIED: Task checkboxes, Dev Agent Record, status
