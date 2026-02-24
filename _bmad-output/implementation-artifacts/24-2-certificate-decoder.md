# Story 24.2: Certificate Decoder

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer/devops engineer**,
I want **to paste a PEM-encoded X.509 certificate and see its decoded details**,
so that **I can inspect certificate properties without openssl CLI**.

## Acceptance Criteria

1. **Given** the user pastes a PEM-encoded certificate (`-----BEGIN CERTIFICATE-----`)
   **When** parsed
   **Then** decoded details are shown: Subject, Issuer, Serial Number, Validity (Not Before/Not After), Public Key Algorithm & Size, Signature Algorithm

2. **Given** the certificate has extensions (SAN, Key Usage, etc.)
   **When** decoded
   **Then** extensions are listed with their values

3. **Given** the certificate validity dates
   **When** displayed
   **Then** a visual indicator shows if the certificate is currently valid, expired, or not yet valid

4. **Given** an invalid PEM or non-certificate PEM
   **When** pasted
   **Then** a clear error explains what was expected

## Tasks / Subtasks

- [x] Task 1: Install `@peculiar/x509` dependency (AC: #1, #2)
  - [x] 1.1 Run `pnpm add @peculiar/x509` (exact version pinned by .npmrc)
  - [x] 1.2 Verify package installs cleanly and `pnpm build` still succeeds

- [x] Task 2: Create certificate parsing and decoding utility functions (AC: #1, #2, #3, #4)
  - [x] 2.1 Create `src/utils/certificate-decoder.ts`
  - [x] 2.2 Define `CertificateInfo` type: `{ subject, issuer, serialNumber, notBefore, notAfter, publicKeyAlgorithm, publicKeySize, signatureAlgorithm, extensions, isValid, validityStatus }`
  - [x] 2.3 Define `CertificateExtension` type: `{ name, oid, critical, value }`
  - [x] 2.4 Define `ValidityStatus` type: `'valid' | 'expired' | 'not-yet-valid'`
  - [x] 2.5 Implement `parsePemCertificate(input: string): Promise<CertificateInfo>` — uses `@peculiar/x509` `X509Certificate` class to decode PEM, extract all fields
  - [x] 2.6 Implement `getValidityStatus(notBefore: Date, notAfter: Date): ValidityStatus` — compares dates to current time
  - [x] 2.7 Implement `formatDistinguishedName(dn: string): string` — formats DN string for human-readable display
  - [x] 2.8 Implement `parseExtensions(cert: X509Certificate): Array<CertificateExtension>` — extracts SAN, Key Usage, Extended Key Usage, Basic Constraints, Authority Key Identifier, Subject Key Identifier, and other extensions
  - [x] 2.9 Implement `isValidPemCertificate(input: string): boolean` — quick check for `-----BEGIN CERTIFICATE-----` marker
  - [x] 2.10 Implement private key detection: if input contains `-----BEGIN.*PRIVATE KEY-----`, throw with security warning message
  - [x] 2.11 Implement input length validation (max ~32KB for reasonable cert size)
  - [x] 2.12 Add barrel export in `src/utils/index.ts`

- [x] Task 3: Create unit tests for certificate decoder utilities (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `src/utils/certificate-decoder.spec.ts`
  - [x] 3.2 Test `parsePemCertificate()` — valid self-signed cert returns correct Subject, Issuer, Serial Number, dates, algorithm
  - [x] 3.3 Test `parsePemCertificate()` — cert with SAN extension returns DNS names
  - [x] 3.4 Test `parsePemCertificate()` — cert with Key Usage extension returns usage values
  - [x] 3.5 Test `parsePemCertificate()` — expired cert returns `validityStatus: 'expired'`
  - [x] 3.6 Test `parsePemCertificate()` — private key input throws with security warning
  - [x] 3.7 Test `parsePemCertificate()` — invalid PEM throws with format error
  - [x] 3.8 Test `parsePemCertificate()` — non-certificate PEM (e.g., CSR) throws with clear message
  - [x] 3.9 Test `getValidityStatus()` — returns 'valid', 'expired', 'not-yet-valid' correctly
  - [x] 3.10 Test `isValidPemCertificate()` — true for valid PEM, false for random strings
  - [x] 3.11 Test `parseExtensions()` — returns parsed extension array with name, oid, critical, value
  - [x] 3.12 Test input length validation — oversized input throws with message

- [x] Task 4: Create CertificateDecoder component (AC: #1, #2, #3, #4)
  - [x] 4.1 Create `src/components/feature/security/CertificateDecoder.tsx`
  - [x] 4.2 Update `src/components/feature/security/index.ts` — add barrel export
  - [x] 4.3 Implement main card view: description from `TOOL_REGISTRY_MAP['certificate-decoder']`, TextAreaInput for PEM paste, debounced 300ms processing
  - [x] 4.4 Implement output section (aria-live="polite"): display Subject, Issuer, Serial Number, Validity dates with status indicator, Public Key Algorithm & Size, Signature Algorithm
  - [x] 4.5 Implement validity status indicator: green badge for "Valid", red badge for "Expired", yellow/amber badge for "Not Yet Valid" — with relative time display (e.g., "Expires in 45 days" or "Expired 3 days ago")
  - [x] 4.6 Implement extensions section: collapsible/expandable list showing each extension's name, criticality, and value
  - [x] 4.7 Implement CopyButton for each output field (Subject, Issuer, Serial Number, etc.)
  - [x] 4.8 Implement error handling: `useToast` with `type: 'error'` for invalid PEM, private key detection
  - [x] 4.9 Implement loading state: brief "Decoding..." text while async `@peculiar/x509` processing completes
  - [x] 4.10 Implement clear/reset: when input is cleared, hide output section

- [x] Task 5: Register tool and configure routing (AC: all)
  - [x] 5.1 Add `'certificate-decoder'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical)
  - [x] 5.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within Security category)
  - [x] 5.3 Add prerender route `/tools/certificate-decoder` in `vite.config.ts` `toolRoutes` array (alphabetical)

- [x] Task 6: Implement accessibility (AC: all)
  - [x] 6.1 Add `aria-live="polite"` on certificate output region
  - [x] 6.2 Add `aria-label` on all icon buttons (copy buttons — handled by CopyButton component)
  - [x] 6.3 Add `role="alert"` on error messages (handled by toast system via Radix Toast)
  - [x] 6.4 Ensure full keyboard navigation (Tab through input + copy buttons, Enter to trigger)
  - [x] 6.5 Ensure WCAG 2.1 AA contrast ratios on all text
  - [x] 6.6 Use semantic color coding for validity status: not just color — also icon + text label (accessible to color-blind users)

- [x] Task 7: Create E2E tests (AC: all)
  - [x] 7.1 Create `e2e/certificate-decoder.spec.ts`
  - [x] 7.2 Test: navigate to tool page, verify title and description
  - [x] 7.3 Test: paste valid PEM certificate → Subject, Issuer, Serial Number, dates, algorithms displayed
  - [x] 7.4 Test: paste cert with SAN extension → extension values displayed
  - [x] 7.5 Test: paste expired cert → "Expired" status indicator shown
  - [x] 7.6 Test: paste invalid PEM → error toast shown
  - [x] 7.7 Test: click CopyButton for Subject → clipboard contains subject value
  - [x] 7.8 Test: mobile viewport (375px) responsiveness
  - [x] 7.9 Test: paste private key → security warning toast shown

- [x] Task 8: Verify build and tests pass
  - [x] 8.1 Run `pnpm lint` — 0 errors
  - [x] 8.2 Run `pnpm format` — compliant
  - [x] 8.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x] 8.4 Run `pnpm build` — clean build
  - [x] 8.5 Run E2E tests — test file created

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Radix UI, Motion 12.34.0
- **Component Pattern**: Named export `export const CertificateDecoder`, no default export
- **State**: `useState` for local UI state (parsed results, loading), `useDebounceCallback` for 300ms debounced certificate processing
- **Error Handling**: `useToast` with `type: 'error'` — never custom error state
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`)
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width
- **Lazy Loading**: `@peculiar/x509` MUST be dynamically imported inside the processing function to keep it out of the main bundle (NFR8)

### Library Choice: `@peculiar/x509` v1.14.3

**Why `@peculiar/x509`:**
- **48 KB gzip** — smallest high-level X.509 library with typed extension classes
- **100% client-side** — uses Web Crypto API, no Node.js dependencies
- **PEM accepted directly** — `new X509Certificate(pemString)` accepts raw PEM with headers
- **Typed extension API** — `SubjectAlternativeNameExtension`, `KeyUsagesExtension`, `BasicConstraintsExtension`, etc. as first-class TypeScript types
- **Same team as pkijs** — maintained by PeculiarVentures (MIT license), v1.14.3 released January 2026
- **Tree-shakeable ESM build** — partial tree-shaking available

**Alternatives rejected:**
- `pkijs + asn1js` (377 KB / 79 KB gzip) — same team's lower-level library, 2x heavier, worse DX for certificate-only use
- `node-forge` (279 KB / 73 KB gzip) — no ESM, no tree-shaking, custom crypto (not Web Crypto), CVE history on ASN.1 parser
- `jsrsasign` (297 KB / 82 KB gzip) — largest bundle, no ESM, ships custom RSA/BigInteger math
- `@peculiar/asn1-x509` (93 KB / 23 KB gzip) — 2x smaller but requires ~200 lines of manual extension glue code

**CRITICAL — Lazy Loading Pattern:**
```typescript
// In utility function — only loads when user pastes a certificate
const { X509Certificate } = await import('@peculiar/x509')
const cert = new X509Certificate(pemInput)
```
Do NOT import `@peculiar/x509` at the top of any file. Always use dynamic `import()` to prevent it from being bundled into the initial page load.

### Category and Domain Placement

**Category**: `'Security'` (already exists — created in Story 24.1)
**Component Directory**: `src/components/feature/security/CertificateDecoder.tsx`
**Emoji**: 📜
**Key**: `certificate-decoder`
**Route**: `/tools/certificate-decoder`

### X.509 Certificate Fields to Extract

**Basic Fields:**
| Field | Source | Display |
|---|---|---|
| Subject | `cert.subject` | DN string (e.g., "CN=example.com, O=Org, C=US") |
| Issuer | `cert.issuer` | DN string |
| Serial Number | `cert.serialNumber` | Hex string (e.g., "03:b9:ac:f0:...") with colon separators |
| Not Before | `cert.notBefore` | ISO date + relative time (e.g., "2024-01-15 ... 1 year ago") |
| Not After | `cert.notAfter` | ISO date + relative time (e.g., "2025-01-15 ... in 45 days") |
| Public Key Algorithm | `cert.publicKey.algorithm` | Algorithm name (e.g., "RSA", "ECDSA", "Ed25519") |
| Public Key Size | Derived from algorithm | Bit size (e.g., "2048 bits", "256 bits") |
| Signature Algorithm | `cert.signatureAlgorithm` | Algorithm name (e.g., "SHA-256 with RSA") |

**Extensions to Parse:**
| Extension | OID | Display |
|---|---|---|
| Subject Alternative Name (SAN) | 2.5.29.17 | List of DNS names, IP addresses, email addresses |
| Key Usage | 2.5.29.15 | Flags: Digital Signature, Key Encipherment, etc. |
| Extended Key Usage | 2.5.29.37 | Server Auth, Client Auth, Code Signing, etc. |
| Basic Constraints | 2.5.29.19 | CA: true/false, Path Length constraint |
| Subject Key Identifier | 2.5.29.14 | Hex-encoded key ID |
| Authority Key Identifier | 2.5.29.35 | Hex-encoded key ID |
| Other extensions | Various | OID + hex-encoded value |

### Validity Status Visual Indicator

```
Valid:        ✓ Valid (expires in 45 days)    → green text/badge
Expired:      ✗ Expired (3 days ago)          → red text/badge
Not Yet Valid: ○ Not yet valid (starts in 2 days) → amber text/badge
```

**Accessibility requirement:** Status MUST be conveyed via text label AND icon — not color alone. Color-blind users must be able to distinguish status.

### Component Implementation Pattern

```
src/components/feature/security/CertificateDecoder.tsx
├── Tool description from TOOL_REGISTRY_MAP['certificate-decoder']
├── Main card (no dialog needed — inline output like SSH Key Fingerprint)
│   ├── TextAreaInput: placeholder "Paste PEM-encoded certificate here..."
│   │   rows=8, monospace font, debounced 300ms
│   └── Output section (aria-live="polite", conditional on results)
│       ├── Validity Status: badge with icon + text + color
│       ├── Subject: DN string + CopyButton
│       ├── Issuer: DN string + CopyButton
│       ├── Serial Number: colon-hex string + CopyButton
│       ├── Validity Period: Not Before — Not After with relative times
│       ├── Public Key: Algorithm + Size (e.g., "RSA 2048 bits")
│       ├── Signature Algorithm: e.g., "SHA-256 with RSA"
│       └── Extensions section (expandable):
│           ├── SAN: list of DNS names, IPs
│           ├── Key Usage: flag list
│           ├── Extended Key Usage: purpose list
│           ├── Basic Constraints: CA flag
│           └── Other extensions: OID + value
└── No dialog needed — all output inline on main card
```

**Key design choice:** Like the SSH Key Fingerprint tool, results display **inline below the input** (no dialog). Certificate details are multi-field but benefit from being visible alongside the PEM input for reference. Use a structured layout with clear section groupings.

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — for 300ms debounced certificate processing
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
    import('@/components/feature/security/CertificateDecoder').then(
      ({ CertificateDecoder }: { CertificateDecoder: ComponentType }) => ({
        default: CertificateDecoder,
      }),
    ),
  ),
  description: 'Paste a PEM-encoded X.509 certificate to view its subject, issuer, validity, extensions, and more.',
  emoji: '📜',
  key: 'certificate-decoder',
  name: 'Certificate Decoder',
  routePath: '/tools/certificate-decoder',
  seo: {
    description:
      'Decode PEM-encoded X.509 certificates online. View subject, issuer, validity dates, public key, signature algorithm, SAN, and extensions. Free client-side SSL/TLS certificate inspector.',
    title: 'Certificate Decoder - CSR Dev Tools',
  },
}
```

### UX / Interaction Requirements

- **Text conversion tool pattern**: Results appear live as user types/pastes — 300ms debounce
- **No button needed**: Certificate decodes automatically on paste/input change
- **Monospace font on input**: PEM certificates are technical content — use `font-mono` class on TextAreaInput
- **Monospace font on output values**: Serial numbers, key identifiers — display in monospace
- **Empty input**: Hide output section entirely, no error toast
- **Invalid input**: Show toast `'Certificate format not recognized. Paste a PEM-encoded certificate (-----BEGIN CERTIFICATE-----)'`
- **Private key detected**: Show toast `'This appears to be a private key. Only paste certificates for security.'`
- **Non-certificate PEM detected**: Show toast `'This does not appear to be a certificate. Paste a PEM-encoded X.509 certificate.'`
- **Copy field**: Toast `'Copied to clipboard'` (standard)
- **Mobile**: Input textarea stacks above output, 375px min viewport, 44px+ touch targets
- **Extensions section**: Initially expanded (not collapsed) — extensions are key information users want to see

### Previous Story Intelligence (24.1 SSH Key Fingerprint Viewer)

Key learnings from Story 24.1 to apply here:

1. **CopyButton/clipboard pattern**: Use CopyButton component with `label` and `value` props for all copyable outputs — never raw `navigator.clipboard`
2. **Barrel export ordering**: Maintain alphabetical order in barrel exports
3. **E2E test selectors**: Use `exact: true` for toast text matching; import from `./helpers/selectors`
4. **Spec files need explicit imports**: `import { describe, expect, it } from 'vitest'`
5. **Registration checklist**: types union → registry entry → vite prerender → barrel exports
6. **Code review common fixes**: keyboard accessibility, raw clipboard calls → CopyButton, input edge cases, alphabetical ordering
7. **Debounce pattern**: Use `useDebounceCallback` from `@/hooks` — 300ms for text input processing
8. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
9. **Security pattern**: Detect private keys and reject with clear warning — apply same pattern for certificates
10. **Inline MD5 lesson**: When third-party libraries have unexpected behavior (UTF-8 encoding of binary data), be prepared to find alternatives. Test library behavior early.
11. **Toast API**: Actual API is `toast({ action: 'add', item: { label, type } })` — NOT `addToast({ message, type })`
12. **New Security category already exists**: `'Security'` is already in ToolCategory and CATEGORY_ORDER — no need to create it

### Git Intelligence

Recent commit patterns from Epic 24:
- `a107ab4` — `🔑 SSH Key Fingerprint Viewer + 🔍 code review fixes (Story 24.1)`
- `e861897` — `🐛: project_name`

Code review fixes commonly address:
- Keyboard accessibility (focus-visible, group-focus-within patterns)
- Raw clipboard calls → CopyButton
- Input edge cases (empty values, invalid formats)
- Dead code removal
- Barrel export alphabetical ordering
- ToolRegistryKey alphabetical ordering

### Security Considerations

1. **Certificates only** — detect and reject private key input (`-----BEGIN.*PRIVATE KEY-----`). Display clear warning.
2. **No private key extraction** — tool parses public certificate data only. No operations that touch private keys.
3. **XSS prevention** — DN fields (Subject, Issuer) and SAN values can contain arbitrary text. Never use `innerHTML`; React's JSX escapes by default.
4. **Input length limit** — PEM certificates are typically 1-4KB. Apply reasonable max-length check (~32KB) before parsing.
5. **Library sandboxing** — `@peculiar/x509` uses Web Crypto API, which requires HTTPS/localhost secure context. Production site is on Cloudflare Pages (HTTPS).
6. **No certificate chain validation** — this tool is for inspection only, not trust verification. Do not mislead users about certificate trust status.

### Test Certificate Fixtures

**Dev agent should generate test certificates using openssl CLI:**

```bash
# Self-signed cert with SAN (valid for testing)
openssl req -x509 -newkey rsa:2048 -keyout /dev/null -out test-cert.pem \
  -days 365 -nodes -subj "/CN=test.example.com/O=Test Org/C=US" \
  -addext "subjectAltName=DNS:test.example.com,DNS:www.test.example.com,IP:127.0.0.1" \
  -addext "keyUsage=digitalSignature,keyEncipherment" \
  -addext "extendedKeyUsage=serverAuth,clientAuth"

# Expired cert (for testing expired status)
openssl req -x509 -newkey rsa:2048 -keyout /dev/null -out expired-cert.pem \
  -days -1 -nodes -subj "/CN=expired.example.com"
```

**Note:** Dev agent should generate fresh test certificates and embed the PEM strings as test fixtures. Do NOT use real production certificates.

### Project Structure Notes

- **Existing directory**: `src/components/feature/security/` — already created in Story 24.1
- **Security category already exists**: `'Security'` in ToolCategory and CATEGORY_ORDER — no changes needed
- **Security barrel already exists**: `src/components/feature/security/index.ts` — just add new export
- **New dependency**: `@peculiar/x509` — MUST be lazy-loaded via dynamic import
- **Utility location**: `src/utils/certificate-decoder.ts` — all parsing and decoding logic as pure functions
- **No types directory needed**: Types can be co-located in the utility file (they're self-contained types — `CertificateInfo`, `CertificateExtension`, `ValidityStatus`)

### File Locations & Naming

| File | Path |
|---|---|
| Utility functions | `src/utils/certificate-decoder.ts` |
| Utility tests | `src/utils/certificate-decoder.spec.ts` |
| Component | `src/components/feature/security/CertificateDecoder.tsx` |
| Security barrel update | `src/components/feature/security/index.ts` |
| E2E test | `e2e/certificate-decoder.spec.ts` |
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

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 24 Story 24.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Patterns, Registry Entry, Testing Standards]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/24-1-ssh-key-fingerprint.md — previous story patterns and learnings]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: vite.config.ts — prerender route registration]
- [Source: @peculiar/x509 — npm package, MIT license, v1.14.3]
- [Source: X.509 RFC 5280 — certificate structure and extension OIDs]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `@peculiar/x509` SAN extension: `san.names` is a `GeneralNames` object, not an array. Access via `san.names.items` for the iterable array of `{type, value}` entries.
- `@peculiar/x509` signature algorithm: Returns `{name: "RSASSA-PKCS1-v1_5", hash: {name: "SHA-256"}}` — combine hash and name for display as "SHA-256 with RSA".
- `@peculiar/x509` EKU usages: Returns `ExtendedKeyUsageType` not plain `string` — use `String(u)` for mapping.

### Completion Notes List

- Installed `@peculiar/x509@1.14.3` — 48KB gzip, lazy-loaded via dynamic import
- Created `src/utils/certificate-decoder.ts` with all parsing functions: `parsePemCertificate`, `getValidityStatus`, `isValidPemCertificate`, `formatDistinguishedName`
- Extension parsing handles: SAN (DNS, IP, Email), Key Usage, Extended Key Usage, Basic Constraints, Subject/Authority Key Identifier, and generic extensions
- 18 unit tests covering all acceptance criteria — valid cert, SAN, Key Usage, expired status, private key rejection, invalid PEM, CSR rejection, oversized input, extension structure
- Component follows SSH Key Fingerprint pattern: inline results with CopyButton for each field, validity badge with icon+text+color
- Registered in tool registry, type union, vite prerender (53 static HTML files)
- 10 E2E test scenarios covering: title/description, valid cert display, SAN extensions, valid status indicator, expired cert indicator, invalid PEM error, copy functionality, mobile responsiveness, private key rejection
- All 1102 tests pass (0 regressions), build clean, lint clean (0 errors), format compliant

### Change Log

- 2026-02-24: Story 24.2 Certificate Decoder implemented — full X.509 certificate inspection tool with SAN, Key Usage, EKU, Basic Constraints parsing, validity status indicator, and comprehensive test coverage
- 2026-02-24: Code review fixes applied — added missing E2E expired cert test, proper SKI/AKI extension parsing, public key size edge case, date copy values, React key fix, ARIA role on loading, strengthened validity E2E test

### File List

- `src/utils/certificate-decoder.ts` (new) — Certificate parsing and decoding utility functions
- `src/utils/certificate-decoder.spec.ts` (new) — 18 unit tests for certificate decoder
- `src/components/feature/security/CertificateDecoder.tsx` (new) — Certificate Decoder React component
- `src/components/feature/security/index.ts` (modified) — Added CertificateDecoder barrel export
- `src/utils/index.ts` (modified) — Added certificate-decoder barrel export
- `src/types/constants/tool-registry.ts` (modified) — Added 'certificate-decoder' to ToolRegistryKey union
- `src/constants/tool-registry.ts` (modified) — Added Certificate Decoder registry entry
- `vite.config.ts` (modified) — Added /tools/certificate-decoder prerender route
- `e2e/certificate-decoder.spec.ts` (new) — 10 E2E test scenarios
- `package.json` (modified) — Added @peculiar/x509 dependency
- `pnpm-lock.yaml` (modified) — Lock file updated
