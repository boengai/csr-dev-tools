# Epic 14 Retrospective: Crypto & Security Tools

**Date:** 2026-02-17
**Epic Status:** Done (backfill retro — all stories completed before this document was created)

## Epic Summary & Metrics

**Delivery:**

- Stories completed: 2/2 (100%)
- Story 14-1: HMAC Generator — done
- Story 14-2: AES Encrypt/Decrypt — done
- Production incidents: 0

**Quality:**

- Tests: 11 new tests across 2 spec files (hmac: 6, aes: 5)
- 0 regressions

**Tools Added:**

- HMAC Generator (`hmac-generator`) — generate HMAC signatures with multiple hash algorithms via Web Crypto API
- AES Encrypt/Decrypt (`aes-encrypt-decrypt`) — AES-GCM encryption/decryption via Web Crypto API

**New Dependencies:** 0 (Web Crypto API — browser-native)

**Files Added/Modified:**

| Type | Files |
|------|-------|
| Components | `HmacGenerator.tsx`, `AesEncryptDecrypt.tsx`, `generator/index.ts` |
| Utils | `hmac.ts`, `aes.ts` |
| Specs | `hmac.spec.ts`, `aes.spec.ts` |
| Config | `tool-registry.ts`, `route.ts`, `feature.ts` |

## What Went Well

- **Zero new dependencies** — Both tools use the browser-native Web Crypto API. This is the gold standard: powerful functionality with zero dependency cost.
- **Smallest, most focused epic** — 2 stories, 2 tools, clear domain boundary. Crypto tools are self-contained with no cross-cutting concerns.
- **Web Crypto API is the right choice for client-side crypto** — No secrets leave the browser. The security model is inherently correct for a client-side tool.
- **Clean async patterns** — Crypto operations are naturally async (Web Crypto returns Promises). The async handling patterns established here are reusable.

## What Didn't Go Well

- **Story artifacts were not created before implementation** — Same process failure as Epics 12-13. Both story documents (14-1, 14-2) were backfilled after code was written.
- **Low test count for AES (5 tests)** — AES has multiple modes, key sizes, and error paths. 5 tests may not cover edge cases adequately, particularly around malformed ciphertext or wrong-key scenarios.
- **No security review documented** — Crypto tools warrant extra scrutiny. Without story artifacts, there's no evidence of security considerations being reviewed (IV generation, key derivation, algorithm choices).

## Key Insights

1. **Web Crypto API should be the default for all browser crypto operations** — Zero dependencies, correct security model, good performance. No reason to use external crypto libraries for standard operations.
2. **Crypto tools deserve higher test coverage than average** — Security-sensitive code should have more tests, not fewer. 5 tests for AES is below the bar.
3. **Small epics (2 stories) have the lowest process overhead** — But they also have the least benefit from Previous Story Intelligence, since there are fewer stories to carry lessons between.
4. **Security-sensitive tools should have a documented security review** — Even a brief "security considerations" section in the story artifact would establish that the right questions were asked.

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Create story artifacts before implementation (carried from Epics 12-13) | SM | HIGH |
| 2 | Add additional AES edge case tests (wrong key, malformed input, empty plaintext) | Dev | MEDIUM |
| 3 | Establish security review checklist for crypto/security tool stories | Dev | MEDIUM |

## Team Agreements

**Continued from Epics 12-13:**

- Story artifacts MUST be created before implementation begins
- Pure function testing strategy
- New dependency additions should document rationale

**New:**

- Web Crypto API is the default for browser crypto — no external crypto libraries without justification
- Crypto/security tools require documented security considerations and higher test coverage
