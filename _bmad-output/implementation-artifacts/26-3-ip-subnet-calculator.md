# Story 26.3: IP/Subnet Calculator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer/devops engineer**,
I want **to input CIDR notation or IP+subnet mask and see calculated network details**,
so that **I can plan and verify network configurations without manual binary math**.

## Acceptance Criteria

1. **Given** the user enters CIDR notation (e.g., 192.168.1.0/24)
   **When** entered
   **Then** the following are displayed:
   - Network Address
   - Broadcast Address
   - Subnet Mask
   - Wildcard Mask
   - First Usable Host
   - Last Usable Host
   - Total Hosts
   - CIDR notation

2. **Given** the user enters IP and subnet mask separately
   **When** both are entered
   **Then** the same calculations are performed

3. **Given** IPv4 addresses
   **When** calculated
   **Then** a binary representation of the IP and mask is shown with network/host bit coloring

4. **Given** an invalid IP or mask
   **When** entered
   **Then** a clear error message explains the issue

5. **Given** the user enters a /32 or /31 CIDR
   **When** calculated
   **Then** correct special-case handling is shown (single host or point-to-point)

## Tasks / Subtasks

- [x] Task 1: Create ip-subnet utility module (AC: #1, #2, #4, #5)
  - [x] 1.1 Create `src/utils/ip-subnet.ts`
  - [x] 1.2 Define types:
    ```typescript
    export type SubnetResult = {
      binaryIp: string
      binaryMask: string
      broadcastAddress: string
      cidr: string
      firstUsableHost: string
      lastUsableHost: string
      networkAddress: string
      prefixLength: number
      subnetMask: string
      totalHosts: number
      wildcardMask: string
    }
    ```
  - [x] 1.3 Implement `validateIpv4(ip: string): boolean`:
    - Split on `.`, check exactly 4 octets
    - Each octet: numeric, 0-255, no leading zeros (except "0" itself)
    - Return boolean
  - [x] 1.4 Implement `validateSubnetMask(mask: string): boolean`:
    - Must be valid IPv4 address
    - Binary representation must be contiguous 1s followed by contiguous 0s (e.g., `11111111.11111111.11111111.00000000`)
    - Valid masks: 255.0.0.0, 255.255.0.0, 255.255.255.0, 255.255.255.128, etc.
    - Invalid: 255.255.128.128 (non-contiguous)
  - [x] 1.5 Implement `validatePrefixLength(prefix: number): boolean`:
    - Must be integer 0-32 inclusive
  - [x] 1.6 Implement `parseCidr(input: string): { ip: string, prefixLength: number } | null`:
    - Parse `192.168.1.0/24` format
    - Validate IP and prefix length
    - Return null if invalid
  - [x] 1.7 Implement `prefixToMask(prefix: number): string`:
    - Convert prefix length to dotted-decimal subnet mask
    - e.g., 24 → `255.255.255.0`, 16 → `255.255.0.0`
  - [x] 1.8 Implement `maskToPrefix(mask: string): number`:
    - Convert dotted-decimal subnet mask to prefix length
    - e.g., `255.255.255.0` → 24
  - [x] 1.9 Implement `ipToNumber(ip: string): number`:
    - Convert dotted-decimal IP to 32-bit unsigned integer
    - Use unsigned right shift (`>>> 0`) to ensure unsigned
  - [x] 1.10 Implement `numberToIp(num: number): string`:
    - Convert 32-bit unsigned integer back to dotted-decimal
    - Use unsigned right shift for each octet extraction
  - [x] 1.11 Implement `ipToBinary(ip: string): string`:
    - Convert each octet to 8-bit binary string (zero-padded)
    - Return as `xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx` format
  - [x] 1.12 Implement `calculateSubnet(ip: string, prefixLength: number): SubnetResult`:
    - **Network Address**: IP AND mask → `ipNum & maskNum`
    - **Broadcast Address**: network OR wildcard → `networkNum | wildcardNum`
    - **Subnet Mask**: `prefixToMask(prefixLength)`
    - **Wildcard Mask**: bitwise NOT of subnet mask → `~maskNum >>> 0`, then `numberToIp()`
    - **First Usable Host**: network + 1 (special: /32 → same as network, /31 → network address)
    - **Last Usable Host**: broadcast - 1 (special: /32 → same as network, /31 → broadcast address)
    - **Total Hosts**: `2^(32 - prefix) - 2` for /1-/30, `1` for /32, `2` for /31, `0` for /0 (or use the formula and clamp)
    - **CIDR**: `networkAddress/prefixLength`
    - **Binary IP**: `ipToBinary(ip)`
    - **Binary Mask**: `ipToBinary(subnetMask)`
    - Return all as `SubnetResult`
  - [x] 1.13 Special case handling in `calculateSubnet`:
    - `/32` (single host): firstUsableHost = lastUsableHost = networkAddress, totalHosts = 1, broadcastAddress = networkAddress
    - `/31` (point-to-point, RFC 3021): firstUsableHost = networkAddress, lastUsableHost = broadcastAddress, totalHosts = 2
    - `/0` (entire IPv4 space): networkAddress = 0.0.0.0, broadcastAddress = 255.255.255.255, handle edge

- [x] Task 2: Create ip-subnet unit tests (AC: #1, #2, #4, #5)
  - [x] 2.1 Create `src/utils/ip-subnet.spec.ts`
  - [x] 2.2 Test `validateIpv4`:
    - Valid: `192.168.1.0`, `0.0.0.0`, `255.255.255.255`, `10.0.0.1`
    - Invalid: `256.1.1.1`, `1.2.3`, `1.2.3.4.5`, `abc.def.ghi.jkl`, `01.02.03.04` (leading zeros), ``, `-1.0.0.0`, `1.2.3.256`
  - [x] 2.3 Test `validateSubnetMask`:
    - Valid: `255.255.255.0`, `255.255.0.0`, `255.0.0.0`, `255.255.255.128`, `255.255.255.252`, `255.255.255.255`, `0.0.0.0`
    - Invalid: `255.255.128.128` (non-contiguous), `255.0.255.0`, `128.255.0.0`
  - [x] 2.4 Test `validatePrefixLength`:
    - Valid: 0, 1, 8, 16, 24, 31, 32
    - Invalid: -1, 33, 1.5, NaN
  - [x] 2.5 Test `parseCidr`:
    - Valid: `192.168.1.0/24` → `{ ip: '192.168.1.0', prefixLength: 24 }`
    - Valid: `10.0.0.0/8` → `{ ip: '10.0.0.0', prefixLength: 8 }`
    - Invalid: `192.168.1.0/33` → null, `not-an-ip/24` → null, `192.168.1.0` → null (no prefix)
  - [x] 2.6 Test `prefixToMask` / `maskToPrefix`:
    - 0 ↔ `0.0.0.0`, 8 ↔ `255.0.0.0`, 16 ↔ `255.255.0.0`, 24 ↔ `255.255.255.0`, 32 ↔ `255.255.255.255`
    - 25 ↔ `255.255.255.128`, 30 ↔ `255.255.255.252`
  - [x] 2.7 Test `ipToNumber` / `numberToIp`:
    - `192.168.1.0` ↔ `3232235776`
    - `0.0.0.0` ↔ `0`
    - `255.255.255.255` ↔ `4294967295`
  - [x] 2.8 Test `ipToBinary`:
    - `192.168.1.0` → `11000000.10101000.00000001.00000000`
    - `255.255.255.0` → `11111111.11111111.11111111.00000000`
  - [x] 2.9 Test `calculateSubnet` standard cases:
    - `192.168.1.0/24`: network=192.168.1.0, broadcast=192.168.1.255, mask=255.255.255.0, wildcard=0.0.0.255, first=192.168.1.1, last=192.168.1.254, hosts=254
    - `10.0.0.0/8`: network=10.0.0.0, broadcast=10.255.255.255, first=10.0.0.1, last=10.255.255.254, hosts=16777214
    - `172.16.0.0/12`: network=172.16.0.0, broadcast=172.31.255.255
  - [x] 2.10 Test `calculateSubnet` special cases:
    - `/32`: single host — network=broadcast=first=last, totalHosts=1
    - `/31`: point-to-point — first=network, last=broadcast, totalHosts=2
    - `/30`: smallest usable subnet — totalHosts=2
    - Host bits in IP (e.g., `192.168.1.100/24`): network address correctly strips host bits to `192.168.1.0`
  - [x] 2.11 Test `calculateSubnet` with non-zero host bits:
    - `192.168.1.100/24` → networkAddress should be `192.168.1.0` (host bits masked off)

- [x] Task 3: Create IpSubnetCalculator component (AC: all)
  - [x] 3.1 Create `src/components/feature/network/IpSubnetCalculator.tsx`
  - [x] 3.2 Create `src/components/feature/network/index.ts` — barrel export: `export { IpSubnetCalculator } from './IpSubnetCalculator'`
  - [x] 3.3 Implement main layout with tool description from `TOOL_REGISTRY_MAP['ip-subnet-calculator']`
  - [x] 3.4 **Input Mode Toggle (AC #1, #2)**:
    - Two input modes: "CIDR Notation" and "IP + Mask"
    - Use simple tab/button toggle (no Radix Tabs needed — just two buttons with active state styling)
    - **CIDR mode** (default): Single `FieldForm` input for CIDR notation (e.g., `192.168.1.0/24`)
      - Placeholder: `192.168.1.0/24`
    - **IP + Mask mode**: Two `FieldForm` inputs — IP Address and Subnet Mask
      - IP placeholder: `192.168.1.0`
      - Mask placeholder: `255.255.255.0`
    - Common preset buttons for quick selection: `/8`, `/16`, `/24`, `/25`, `/26`, `/27`, `/28`, `/29`, `/30`, `/31`, `/32`
    - On any input change, debounce 300ms (pure computation — lighter than mermaid rendering) and calculate
  - [x] 3.5 **Results Display (AC #1, #2)**:
    - Show results in a structured grid/table layout
    - Each result field as a labeled row with value and CopyButton:
      - Network Address
      - Broadcast Address
      - Subnet Mask
      - Wildcard Mask
      - First Usable Host
      - Last Usable Host
      - Total Hosts (formatted with locale separators, e.g., `16,777,214`)
      - CIDR Notation
    - `aria-live="polite"` on the results container
  - [x] 3.6 **Binary Representation (AC #3)**:
    - Show binary IP and binary mask as `xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx`
    - **Network bits** styled in one color (e.g., `text-sky-400` — matches the cool-toned dark theme)
    - **Host bits** styled in another color (e.g., `text-amber-400` — warm contrast)
    - Use monospace font (`font-mono`) for binary display
    - Labels: "IP Address (binary)" and "Subnet Mask (binary)"
    - Color the bits based on prefix length: first `prefixLength` bits are network bits, remaining are host bits
  - [x] 3.7 **Error Display (AC #4)**:
    - Show inline error below the input fields with `role="alert"`
    - Clear error messages:
      - "Invalid IPv4 address" — for malformed IP
      - "Invalid subnet mask — mask must be contiguous" — for non-contiguous masks
      - "Invalid CIDR notation — expected format: x.x.x.x/y" — for bad CIDR
      - "Prefix length must be 0-32" — for out-of-range prefix
    - Error clears when input becomes valid
  - [x] 3.8 **Special Case Display (AC #5)**:
    - When prefix is /32: Show info badge "Single Host" next to Total Hosts
    - When prefix is /31: Show info badge "Point-to-Point Link (RFC 3021)" next to Total Hosts
    - Visual indicator so the user understands the special behavior
  - [x] 3.9 **Layout**:
    - Desktop (md+): Input section on the left (~35%), results + binary on the right (~65%) using `flex flex-col md:flex-row gap-4`
    - Mobile (< 768px): Stack vertically — input section, then results, then binary representation
    - Results in a 2-column grid on desktop, single column on mobile
  - [x] 3.10 **Initial State**:
    - Pre-populate with `192.168.1.0/24` as default CIDR input
    - Calculate and display results immediately on mount
    - User sees a fully populated tool on first visit
  - [x] 3.11 **Accessibility**:
    - `aria-live="polite"` on results container
    - `role="alert"` on error messages
    - `aria-label` on preset buttons (e.g., "Set prefix length to 24")
    - `aria-pressed` on input mode toggle buttons
    - All interactive elements keyboard accessible
    - Binary representation accessible with screen reader text explaining the coloring

- [x] Task 4: Register tool and configure routing (AC: all)
  - [x] 4.1 Add `'Network'` to `ToolCategory` union in `src/types/constants/tool-registry.ts` (alphabetical — between `'Image'` and `'Security'`)
  - [x] 4.2 Add `'ip-subnet-calculator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical — between `'image-to-base64'` and `'javascript-minifier'`)
  - [x] 4.3 Add `'Network'` to `CATEGORY_ORDER` in `src/constants/tool-registry.ts` (alphabetical — between `'Image'` and `'Security'`)
  - [x] 4.4 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within array — between image-to-base64 and javascript-minifier):
    ```typescript
    {
      category: 'Network',
      component: lazy(() =>
        import('@/components/feature/network/IpSubnetCalculator').then(
          ({ IpSubnetCalculator }: { IpSubnetCalculator: ComponentType }) => ({
            default: IpSubnetCalculator,
          }),
        ),
      ),
      description:
        'Calculate IPv4 subnet details from CIDR notation or IP and subnet mask. Shows network address, broadcast, host range, and binary representation.',
      emoji: '\uD83C\uDF10',
      key: 'ip-subnet-calculator',
      name: 'IP Subnet Calculator',
      routePath: '/tools/ip-subnet-calculator',
      seo: {
        description:
          'Calculate IPv4 subnet details online. Input CIDR notation or IP with subnet mask to see network address, broadcast, host range, wildcard mask, and binary representation. 100% client-side.',
        title: 'IP Subnet Calculator - CSR Dev Tools',
      },
    }
    ```
  - [x] 4.5 Add prerender route `/tools/ip-subnet-calculator` in `vite.config.ts` `toolRoutes` array (alphabetical — between image-to-base64 and javascript-minifier):
    ```typescript
    {
      description:
        'Calculate IPv4 subnet details online. Input CIDR notation or IP with subnet mask to see network address, broadcast, host range, wildcard mask, and binary representation. 100% client-side.',
      path: '/tools/ip-subnet-calculator',
      title: 'IP Subnet Calculator - CSR Dev Tools',
      url: '/tools/ip-subnet-calculator',
    },
    ```

- [x] Task 5: Create E2E tests (AC: all)
  - [x] 5.1 Create `e2e/ip-subnet-calculator.spec.ts`
  - [x] 5.2 Test: navigate to `/tools/ip-subnet-calculator`, verify title and description rendered
  - [x] 5.3 Test: default CIDR `192.168.1.0/24` is pre-populated and results display on load (AC #1)
  - [x] 5.4 Test: enter CIDR `10.0.0.0/8` → verify network=10.0.0.0, broadcast=10.255.255.255, mask=255.0.0.0, hosts=16,777,214 (AC #1)
  - [x] 5.5 Test: switch to IP+Mask mode, enter IP `172.16.0.0` and mask `255.240.0.0` → verify results match /12 (AC #2)
  - [x] 5.6 Test: binary representation visible with correct format `xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx` (AC #3)
  - [x] 5.7 Test: enter invalid IP `999.999.999.999` → error message with `role="alert"` (AC #4)
  - [x] 5.8 Test: enter invalid CIDR `192.168.1.0/33` → error message (AC #4)
  - [x] 5.9 Test: enter `/32` CIDR `10.0.0.1/32` → verify single host display (totalHosts=1, first=last=network) (AC #5)
  - [x] 5.10 Test: enter `/31` CIDR `10.0.0.0/31` → verify point-to-point display (totalHosts=2) (AC #5)
  - [x] 5.11 Test: click CopyButton on a result field → value copied to clipboard
  - [x] 5.12 Test: click preset button (e.g., `/24`) → prefix is applied and results update
  - [x] 5.13 Test: mobile viewport (375px) responsiveness — input and results stack vertically

- [x] Task 6: Verify build and tests pass
  - [x] 6.1 Run `pnpm lint` — 0 errors
  - [x] 6.2 Run `pnpm format` — compliant
  - [x] 6.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x] 6.4 Run `pnpm build` — clean build, static HTML files generated (new count = previous + 1 = 63)
  - [x] 6.5 Run E2E tests — all IP Subnet Calculator tests pass
  - [x] 6.6 Verify tool works in production build (`pnpm preview`)
  - [x] 6.7 Verify new Network category appears in sidebar and tool is discoverable via command palette

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18
- **Component Pattern**: Named export `export const IpSubnetCalculator`, no default export
- **State**: `useState` for local UI state (input values, mode toggle, results, error)
- **Error Handling**: Input validation errors displayed inline below inputs; no `useToast` needed (all errors are input validation, not unexpected failures)
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` if component variants needed, OKLCH color space
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width

### No External Dependencies Required

This tool uses **pure JavaScript/TypeScript** for all subnet calculations. No npm packages needed. All IPv4 math is bitwise operations on 32-bit unsigned integers:

```typescript
// Core pattern — all bitwise, all pure
const ipNum = ipToNumber('192.168.1.100')     // 3232235876
const maskNum = ipToNumber('255.255.255.0')   // 4294967040
const networkNum = (ipNum & maskNum) >>> 0     // 3232235776 → 192.168.1.0
const wildcardNum = (~maskNum) >>> 0           // 255 → 0.0.0.255
const broadcastNum = (networkNum | wildcardNum) >>> 0  // 3232236031 → 192.168.1.255
```

**CRITICAL**: Always use unsigned right shift (`>>> 0`) after bitwise operations to keep values as unsigned 32-bit integers. JavaScript bitwise operators (`&`, `|`, `~`) return signed 32-bit integers, which can produce negative values for high IP addresses (e.g., 255.255.255.255 = -1 as signed).

### NEW Category: Network

**This is the FIRST tool in the Network category.** The dev agent MUST:
1. Add `'Network'` to the `ToolCategory` union in `src/types/constants/tool-registry.ts` — insert between `'Image'` and `'Security'`
2. Add `'Network'` to the `CATEGORY_ORDER` array in `src/constants/tool-registry.ts` — insert between `'Image'` and `'Security'`
3. Create the barrel export file `src/components/feature/network/index.ts`

The `src/components/feature/network/` directory already exists (empty) — no need to create it.

### Tool Type: Live Computation (Input → Instant Results)

This tool uses the live computation pattern (similar to Number Base Converter, Chmod Calculator):

- **Processing trigger**: On input change → debounced 300ms (pure math, fast)
- **Debounce**: 300ms via `useDebounceCallback` from `@/hooks`
- **Input**: `FieldForm` for CIDR or IP+Mask fields
- **Output**: Structured results grid with CopyButton per field
- **Error**: Inline below inputs, `role="alert"`, cleared on valid input
- **No loading state needed**: Computation is synchronous and instant

### Binary Representation Coloring Pattern

The binary visualization is a key differentiator. Implementation approach:

```tsx
// Split binary string into network bits and host bits at prefixLength boundary
const renderBinaryWithColoring = (binary: string, prefixLength: number) => {
  // binary = "11000000.10101000.00000001.00000000" (with dots)
  // Remove dots, split at prefixLength, re-add dots
  const bitsOnly = binary.replace(/\./g, '')
  const networkBits = bitsOnly.slice(0, prefixLength)
  const hostBits = bitsOnly.slice(prefixLength)

  // Re-insert dots every 8 characters for display
  // Render networkBits in text-sky-400, hostBits in text-amber-400
  // Use <span> elements for coloring within a font-mono container
}
```

Render as two `<span>` elements inside a `font-mono` container. Keep the dot separators between octets for readability.

### Category and Domain Placement

**Category**: `'Network'` (NEW — must be added to ToolCategory and CATEGORY_ORDER)
**Component Directory**: `src/components/feature/network/IpSubnetCalculator.tsx`
**Emoji**: 🌐
**Key**: `ip-subnet-calculator`
**Route**: `/tools/ip-subnet-calculator`

### Component Implementation Pattern

```
src/components/feature/network/IpSubnetCalculator.tsx
├── Tool description from TOOL_REGISTRY_MAP['ip-subnet-calculator']
│
├── Input Section
│   ├── Mode toggle: [CIDR Notation] [IP + Mask] (button pair, aria-pressed)
│   ├── CIDR mode: Single FieldForm input (placeholder: "192.168.1.0/24")
│   ├── IP+Mask mode: Two FieldForm inputs (IP + Mask)
│   ├── Preset buttons: /8, /16, /24, /25, /26, /27, /28, /29, /30, /31, /32
│   └── Error display (inline, role="alert")
│
├── Results Section (aria-live="polite")
│   ├── Network Address + CopyButton
│   ├── Broadcast Address + CopyButton
│   ├── Subnet Mask + CopyButton
│   ├── Wildcard Mask + CopyButton
│   ├── First Usable Host + CopyButton
│   ├── Last Usable Host + CopyButton
│   ├── Total Hosts (formatted) + special-case badge + CopyButton
│   └── CIDR Notation + CopyButton
│
└── Binary Representation Section
    ├── IP Address (binary) — network bits colored sky-400, host bits amber-400
    └── Subnet Mask (binary) — network bits colored sky-400, host bits amber-400
```

### Previous Story Intelligence (26.2 Mermaid Renderer)

Key learnings from Story 26.2 to apply here:

1. **Barrel export ordering**: Maintain alphabetical order in barrel exports
2. **Registration checklist**: types union → registry entry → vite prerender → barrel exports
3. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
4. **Stale closure bug**: Previous stories hit stale closures with debounced callbacks capturing stale state. Use `useRef` mirrors for state values referenced in debounced callbacks
5. **Code review common fixes**: Watch for falsy value handling (0, false, ""), Tailwind class ordering (responsive before base), missing useMemo for derived values
6. **E2E test selectors**: Use data-testid or specific selectors to avoid strict-mode violations
7. **Vitest requires explicit imports**: `import { describe, expect, it } from 'vitest'` — project convention
8. **ToolComponentProps**: Component receives `({ autoOpen, onAfterDialogClose }: ToolComponentProps)` — destructure in component signature
9. **Button component limitation**: Button only picks `disabled | onBlur | onClick | type` from HTMLButtonElement — cannot pass `aria-label` directly. Use wrapper `<div>` or raw `<button>` for buttons needing `aria-label`
10. **NEW for this story**: Network category is new — must add to both ToolCategory type AND CATEGORY_ORDER constant

### Git Intelligence

Recent commit patterns:
- `c3c5770` — `🧜 Mermaid Renderer + 🔍 code review fixes (Story 26.2)`
- `28134a9` — `🌍 Timezone Converter + 🔍 code review fixes (Story 26.1)`

**Commit message pattern**: `{emoji} {Tool Name} + 🔍 code review fixes (Story {epic}.{story})`
Suggested for this story: `🌐 IP Subnet Calculator + 🔍 code review fixes (Story 26.3)`

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — debounce calculation on input change (300ms)
- Do NOT use `useCopyToClipboard` directly — use CopyButton component

**Components to Use:**
- `CopyButton` from `@/components/common` — for copying each result field value
- `Button` from `@/components/common` — for preset buttons and mode toggle (but note: no `aria-label` prop support — use raw `<button>` if aria-label needed)
- `FieldForm` from `@/components/common` — for IP/CIDR/Mask input fields

**No new dependencies required.**

### Project Structure Notes

- **New directory barrel**: `src/components/feature/network/index.ts` — must be created (directory exists but is empty)
- **NEW category**: `'Network'` — first tool in this category, requires type + constant updates
- **Utility file**: `src/utils/ip-subnet.ts` — pure functions for all subnet math
- **Unit tests**: `src/utils/ip-subnet.spec.ts` — comprehensive edge-case testing of IPv4 math
- **No existing network utilities to reuse** — this is the first network-category tool

### File Locations & Naming

| File | Path |
|---|---|
| Utility | `src/utils/ip-subnet.ts` |
| Unit tests | `src/utils/ip-subnet.spec.ts` |
| Component | `src/components/feature/network/IpSubnetCalculator.tsx` |
| Network barrel (NEW) | `src/components/feature/network/index.ts` |
| E2E test | `e2e/ip-subnet-calculator.spec.ts` |
| Registry key type | `src/types/constants/tool-registry.ts` |
| Category type | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Category order | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` |

### Code Conventions (Enforced)

- `type` over `interface`
- `Array<T>` over `T[]`
- `import type` for type-only imports
- Named exports only (no default export for components)
- `@/` path alias for all imports
- Let TypeScript infer where possible
- No `console.log` statements
- Alphabetical ordering in object keys, barrel exports, union types
- No semicolons, single quotes, trailing commas, 120 char width

### IPv4 Subnet Math Reference

For the dev agent's reference — the core subnet calculation formulas:

| Field | Formula |
|---|---|
| Network Address | `ip & mask` |
| Broadcast Address | `network \| ~mask` |
| Subnet Mask | `~0 << (32 - prefix)` (left-shift then unsigned) |
| Wildcard Mask | `~mask` |
| First Usable Host | `network + 1` (except /31, /32) |
| Last Usable Host | `broadcast - 1` (except /31, /32) |
| Total Hosts | `2^(32-prefix) - 2` (except /31=2, /32=1) |

**JavaScript bitwise gotcha**: Always use `>>> 0` after bitwise ops to convert signed 32-bit to unsigned. Without this, `~0` returns `-1` instead of `4294967295`.

### E2E Testing Notes

- **Debounce**: Results update after 300ms debounce — use Playwright auto-retrying `toBeVisible()` / `toHaveText()` assertions
- **Mode toggle**: Test both CIDR and IP+Mask input modes
- **Preset buttons**: Click a preset and verify the input/results update
- **Copy**: Use Playwright clipboard assertions for CopyButton tests
- **Binary display**: Verify the binary representation is present and uses font-mono
- **Mobile**: Verify stacked layout at 375px viewport
- **Special cases**: Test /31 and /32 specifically for correct host counts and badges

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 26 Story 26.3]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/26-2-mermaid-renderer.md — previous story patterns and learnings]
- [Source: _bmad-output/planning-artifacts/architecture.md — Tool Processing, Error Handling, Code Splitting]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: src/components/feature/network/ — empty directory ready for first tool]
- [Source: vite.config.ts — prerender route registration]
- [Source: RFC 3021 — Using 31-Bit Prefixes on IPv4 Point-to-Point Links]

## Senior Developer Review

### Review Model Used

Claude Opus 4.6

### Review Summary

5 findings identified and fixed:

| # | Severity | Category | Finding | Fix |
|---|---|---|---|---|
| 1 | MEDIUM | Code Quality | `handlePreset` duplicated `prefixToMask` logic inline with complex bitwise math instead of calling the existing utility | Imported `prefixToMask` and replaced 4-line inline calculation with single function call |
| 2 | MEDIUM | Test Quality | E2E binary test only checked label existence, not actual binary content (AC #3 gap) | Added assertion verifying binary content `11000000` within the IP binary row |
| 3 | LOW | Test Quality | Missing unit test for `/0` prefix edge case (explicitly mentioned in story task 1.13) | Added `calculateSubnet('0.0.0.0', 0)` test with full result assertions |
| 4 | LOW | Test Quality | `ipToBinary` only had 2 test cases, missing edge values | Added tests for `0.0.0.0` and `255.255.255.255` |
| 5 | LOW | Code Quality | `ip-subnet` barrel export appended at end of `utils/index.ts` instead of alphabetical position | Moved to between `image-base64` and `js-format` |

### Verification

- 0 lint errors
- Format compliant (oxfmt)
- 1342 unit tests pass (3 new, 0 regressions)
- 12 E2E tests pass
- Clean production build (63 static HTML pages)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- E2E tests initially failed (5/12) due to strict mode violations from ambiguous text selectors (e.g., `getByText('254')` matching both `192.168.1.254` and `254`). Fixed by using `{ exact: true }`, more specific locators, and `data-testid` selectors.

### Completion Notes List

- Implemented complete IPv4 subnet calculation utility (`ip-subnet.ts`) with all specified functions: `validateIpv4`, `validateSubnetMask`, `validatePrefixLength`, `parseCidr`, `prefixToMask`, `maskToPrefix`, `ipToNumber`, `numberToIp`, `ipToBinary`, `calculateSubnet` with /31, /32, /0 special case handling
- Created comprehensive unit test suite (67 tests) covering all validation, conversion, and calculation functions including edge cases
- Built `IpSubnetCalculator` component with CIDR and IP+Mask dual input modes, debounced calculation (300ms), preset prefix buttons (/8 through /32), results grid with CopyButton per field, binary representation with network/host bit coloring (sky-400/amber-400), special case badges for /32 (Single Host) and /31 (Point-to-Point Link RFC 3021)
- Created NEW `Network` category — added to `ToolCategory` union, `ToolRegistryKey` union, `CATEGORY_ORDER`, registry entry, and vite prerender route
- Used `useRef` mirrors for stale closure avoidance in debounced callbacks (lesson from Story 26.2)
- Used raw `<button>` elements instead of `Button` component for preset and mode toggle buttons (required `aria-label` and `aria-pressed` props)
- All quality gates passed: 0 lint errors, format compliant, 1342 unit tests pass (0 regressions), clean build with 63 static HTML pages, 12 E2E tests pass

### File List

- `src/utils/ip-subnet.ts` — NEW: IPv4 subnet calculation utility (pure functions)
- `src/utils/ip-subnet.spec.ts` — NEW: Unit tests for ip-subnet utility (70 tests)
- `src/utils/index.ts` — MODIFIED: Added barrel export for ip-subnet
- `src/components/feature/network/IpSubnetCalculator.tsx` — NEW: IP Subnet Calculator component
- `src/components/feature/network/index.ts` — NEW: Network feature barrel export
- `src/types/constants/tool-registry.ts` — MODIFIED: Added 'Network' to ToolCategory, 'ip-subnet-calculator' to ToolRegistryKey
- `src/constants/tool-registry.ts` — MODIFIED: Added registry entry and 'Network' to CATEGORY_ORDER
- `vite.config.ts` — MODIFIED: Added prerender route for /tools/ip-subnet-calculator
- `e2e/ip-subnet-calculator.spec.ts` — NEW: E2E tests (12 tests)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Story status updated
- `_bmad-output/implementation-artifacts/26-3-ip-subnet-calculator.md` — MODIFIED: Task checkboxes, Dev Agent Record, File List, Change Log, Status

## Change Log

- **2026-02-25**: Implemented IP Subnet Calculator (Story 26.3) — new Network category tool with CIDR/IP+Mask dual input modes, complete IPv4 subnet calculation, binary visualization with network/host bit coloring, 67 unit tests, 12 E2E tests
- **2026-02-25**: Code review fixes — (1) MEDIUM: replaced duplicated inline mask calculation in handlePreset with prefixToMask() import (DRY fix), (2) MEDIUM: E2E binary test now verifies actual binary content, (3) LOW: added /0 edge case unit test for calculateSubnet, (4) LOW: added ipToBinary edge value tests (0.0.0.0, 255.255.255.255), (5) LOW: moved ip-subnet barrel export to alphabetical position in utils/index.ts. All gates re-verified: 1342 tests, 12 E2E, clean build.
