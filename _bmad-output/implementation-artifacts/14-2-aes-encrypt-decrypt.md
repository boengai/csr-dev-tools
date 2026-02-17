---
story: 14.2
title: AES Encrypt/Decrypt
status: done
epic: 14
---

# Story 14.2: AES Encrypt/Decrypt

## Story

As a **user**,
I want **to encrypt and decrypt text using AES with a password**,
So that **I can quickly protect sensitive data without installing encryption tools**.

**Epic:** Epic 14 — Crypto & Security Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 14-2-aes-encrypt-decrypt

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the AES Encrypt/Decrypt tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it
**Then** it renders with card buttons for Encrypt and Decrypt modes

### AC2: Encryption

**Given** tabs for Encrypt and Decrypt modes
**When** the user enters plaintext and a password in Encrypt mode
**Then** the AES-GCM encrypted output appears as a Base64 string

### AC3: Decryption

**Given** Decrypt mode
**When** the user pastes the encrypted Base64 string and the correct password
**Then** the original plaintext appears

### AC4: Wrong Password Error

**Given** a wrong password in Decrypt mode
**When** decryption fails
**Then** an inline error: "Decryption failed — incorrect password or corrupted data"

### AC5: Secure Key Derivation

**Given** the encryption process
**When** it runs
**Then** it uses PBKDF2 for key derivation (100K iterations, random salt) and AES-256-GCM
**And** output format: Base64(salt + iv + ciphertext + authTag)

### AC6: Unit Tests

**Given** unit tests in `src/utils/aes.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: encrypt/decrypt roundtrip, random salt/IV, wrong password, empty plaintext, Unicode

## Tasks / Subtasks

- [x] Task 1: Create AES utility functions (AC: #2, #3, #4, #5, #6)
  - [x] 1.1 Create `src/utils/aes.ts` with `aesEncrypt()` and `aesDecrypt()`
  - [x] 1.2 Implement PBKDF2 key derivation (100K iterations, SHA-256, random 16-byte salt)
  - [x] 1.3 Implement AES-256-GCM encryption with random 12-byte IV
  - [x] 1.4 Output format: Base64(salt[16] + iv[12] + ciphertext + authTag)
  - [x] 1.5 Implement Base64↔ArrayBuffer helpers

- [x] Task 2: Write unit tests (AC: #6)
  - [x] 2.1 Create `src/utils/aes.spec.ts`
  - [x] 2.2 Test encrypt/decrypt roundtrip
  - [x] 2.3 Test same input produces different ciphertexts (random salt/IV)
  - [x] 2.4 Test wrong password throws
  - [x] 2.5 Test empty plaintext roundtrip
  - [x] 2.6 Test Unicode text roundtrip

- [x] Task 3: Create AesEncryptDecrypt component (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `src/components/feature/generator/AesEncryptDecrypt.tsx` as named export
  - [x] 3.2 Two card buttons: "Encrypt" and "Decrypt" opening dialog in respective modes
  - [x] 3.3 Dialog with source textarea + password input on left, result on right
  - [x] 3.4 Use `useDebounceCallback` with 300ms delay
  - [x] 3.5 Loading state indicator ("Processing...")
  - [x] 3.6 Inline error display below result for decryption failures

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'aes-encrypt-decrypt'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/generator/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 14.1 (HMAC Generator):
- Web Crypto API pattern established
- Generator category already has HMAC tool
- No external dependencies needed — both tools use browser crypto

### Architecture Pattern

**Dialog-based bidirectional tool** with separate Encrypt/Decrypt modes. Unlike converters (which show results inline), this has a password field and loading state due to PBKDF2's computational cost.

### Key Implementation Details

- `PBKDF2_ITERATIONS = 100_000` — intentionally slow for security
- `SALT_LENGTH = 16` bytes, `IV_LENGTH = 12` bytes (standard for AES-GCM)
- `deriveKey()` uses PBKDF2 → AES-GCM 256-bit key
- Output is compact: `Base64(salt + iv + ciphertext)` — no JSON wrapping
- `aesDecrypt` splits the Base64 decoded buffer: first 16 bytes = salt, next 12 = IV, rest = ciphertext
- Loading state shown as placeholder "Processing..." in result textarea
- Error displayed as red text below result (not toast) for decryption failures

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/aes.ts` | `aesEncrypt()`, `aesDecrypt()`, key derivation helpers |
| `src/utils/aes.spec.ts` | 5 unit tests |
| `src/components/feature/generator/AesEncryptDecrypt.tsx` | Component (162 lines) |

## Dev Agent Record

### Completion Notes List

- Created AES-256-GCM encryption/decryption using Web Crypto API with PBKDF2 key derivation
- AesEncryptDecrypt component with encrypt/decrypt modes, loading state, inline error display
- 5 unit tests covering roundtrip, randomness, wrong password, empty input, Unicode

### File List

| File | Action |
|------|--------|
| `src/utils/aes.ts` | NEW |
| `src/utils/aes.spec.ts` | NEW |
| `src/components/feature/generator/AesEncryptDecrypt.tsx` | NEW |
| `src/components/feature/generator/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |
