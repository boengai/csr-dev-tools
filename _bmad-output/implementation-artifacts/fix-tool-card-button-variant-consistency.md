# Fix: Tool Card Button Variant Consistency

Status: done

<!-- Standalone fix — standardizes button styling across all tool cards on home dashboard -->

## Story

As a **user**,
I want **all tool card action buttons on the dashboard to use the same ghost/outline style**,
So that **the grid looks visually consistent and no single tool card draws disproportionate attention**.

**Origin:** Visual QA review of home dashboard
**Type:** Standalone UI consistency fix
**Story Key:** fix-tool-card-button-variant-consistency

## Problem

The `UploadInput` shared component hardcodes `variant="primary"` (filled purple button), while all other tool card actions use `variant="default"` (ghost/outline). This causes Image Converter and Image Resizer cards to display filled purple buttons, breaking visual consistency with the rest of the tool grid.

### Affected Components

| Tool | Current Variant | Expected Variant |
|------|----------------|-----------------|
| Image Converter | `primary` (via UploadInput) | `default` |
| Image Resizer | `primary` (via UploadInput) | `default` |
| JSON Formatter | `default` | `default` |
| Base64 Encoder | `default` | `default` |
| URL Encoder | `default` | `default` |
| JWT Decoder | `default` | `default` |
| JSON to YAML | `default` | `default` |
| JSON to CSV | `default` | `default` |

## Root Cause

`src/components/common/input/UploadInput.tsx` line 31 hardcodes `variant="primary"` on its internal `<Button>`. All consumers inherit this filled style with no override capability.

## Acceptance Criteria

### AC1: UploadInput Uses Ghost Variant

**Given** the `UploadInput` component
**When** it renders its internal Button
**Then** the button uses `variant="default"` (ghost/outline style)

### AC2: All Tool Cards Visually Consistent

**Given** the home dashboard tool grid
**When** a user views the cards
**Then** all action buttons (Format, Encode, Decode, Select images, etc.) display with the same ghost/outline style

### AC3: No Regression on Image Tools

**Given** Image Converter and Image Resizer tool pages
**When** a user interacts with file upload
**Then** the upload button functions identically (only visual style changes)

## Tasks / Subtasks

### Task 1: Fix UploadInput Button Variant

- [ ] **1.1** In `src/components/common/input/UploadInput.tsx`, change `variant="primary"` to `variant="default"` on the `<Button>` component

### Task 2: Verify

- [ ] **2.1** Verify Image Converter card shows ghost/outline upload button
- [ ] **2.2** Verify Image Resizer card shows ghost/outline upload button
- [ ] **2.3** Verify all other tool cards remain unchanged (already ghost/outline)
- [ ] **2.4** Verify file upload functionality still works on both image tools
- [ ] **2.5** Verify TypeScript build passes (`pnpm build`)
- [ ] **2.6** Verify existing tests pass (`pnpm test`)

## Dev Notes

### Key File: `src/components/common/input/UploadInput.tsx`

**Before:**

```tsx
<Button
  block={button?.block}
  disabled={disabled}
  icon={<UploadIcon />}
  onBlur={onBlur}
  onClick={handleClick}
  variant="primary"
>
```

**After:**

```tsx
<Button
  block={button?.block}
  disabled={disabled}
  icon={<UploadIcon />}
  onBlur={onBlur}
  onClick={handleClick}
  variant="default"
>
```

### Files Modified

```
src/components/common/input/UploadInput.tsx  — change variant="primary" to variant="default"
```

### Design Decision

`variant="default"` was chosen over introducing a new prop because:
- All existing tool card buttons already use `default`
- The UploadInput is only used in tool card contexts
- Ghost/outline is the correct card-level style per UX direction (reserve filled for committed actions inside tool pages)
