# CSR Developer Tools - Component Inventory

**Generated:** 2026-02-11 | **Scan Level:** Quick

## Summary

| Category | Count |
|----------|-------|
| Common Components | 14 |
| Feature Components | 6 |
| Icon Components | 10 |
| **Total** | **30** |

## Common Components (`src/components/common/`)

### Layout & Display

| Component | File | Description |
|-----------|------|-------------|
| `Card` | `card/Card.tsx` | Feature tool container card with variants |
| `ProgressBar` | `progress-bar/ProgressBar.tsx` | Animated progress indicator |
| `DataCellTable` | `table/DataCellTable.tsx` | Key-value pair display table |
| `NotoEmoji` | `emoji/NotoEmoji.tsx` | Noto Emoji font renderer |
| `TwinkleStarsAnimate` | `animate/TwinkleStarsAnimate.tsx` | Background star animation (Motion) |

### Form & Input

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `button/Button.tsx` | Motion-enhanced button with variant styling |
| `TextInput` | `input/TextInput.tsx` | Standard text input |
| `TextAreaInput` | `input/TextAreaInput.tsx` | Multi-line text input |
| `SelectInput` | `input/SelectInput.tsx` | Radix-based select dropdown |
| `UploadInput` | `input/UploadInput.tsx` | File upload input with drag-and-drop |
| `FieldForm` | `form/FieldForm.tsx` | Label + input wrapper component |

### Overlay & Feedback

| Component | File | Description |
|-----------|------|-------------|
| `Dialog` | `dialog/Dialog.tsx` | Radix-based modal dialog |
| `Tabs` | `tabs/Tabs.tsx` | Radix-based tab navigation |
| `ToastProvider` | `toast/ToastProvider.tsx` | Global toast notifications (Radix + Zustand) |

### Icons (`src/components/common/icon/`)

| Component | Description |
|-----------|-------------|
| `AlertIcon` | Alert/warning indicator |
| `ArrowIcon` | Directional arrow |
| `CheckIcon` | Checkmark/success |
| `ChevronIcon` | Chevron for dropdowns |
| `CopyIcon` | Copy to clipboard |
| `DownloadIcon` | Download action |
| `ImageIcon` | Image placeholder |
| `InfoIcon` | Information indicator |
| `PlusIcon` | Add/create action |
| `RefreshIcon` | Refresh/reload |
| `TrashIcon` | Delete action |
| `UploadIcon` | Upload action |
| `XIcon` | Close/dismiss |

## Feature Components (`src/components/feature/`)

### Color Tools

| Component | File | Description |
|-----------|------|-------------|
| `ColorConvertor` | `color/ColorConvertor.tsx` | Multi-format color converter (HEX, RGB, HSL, OKLCH, LAB, LCH) |

### Encoding Tools

| Component | File | Description |
|-----------|------|-------------|
| `EncodingBase64` | `encoding/EncodingBase64.tsx` | Base64 string encoder/decoder |

### Image Tools

| Component | File | Description |
|-----------|------|-------------|
| `ImageConvertor` | `image/ImageConvertor.tsx` | Image format converter with batch/zip support |
| `ImageResizer` | `image/ImageResizer.tsx` | Image dimension resizer |
| `ImageFormatSelectInput` | `image/input/ImageFormatSelectInput.tsx` | Image format selector dropdown |
| `ImageQualitySelectInput` | `image/input/ImageQualitySelectInput.tsx` | Image quality selector dropdown |

### Time Tools

| Component | File | Description |
|-----------|------|-------------|
| `TimeUnixTimestamp` | `time/TimeUnixTimestamp.tsx` | Unix timestamp converter |

### Unit Tools

| Component | File | Description |
|-----------|------|-------------|
| `UnitPxToRem` | `unit/UnitPxToRem.tsx` | PX to REM unit converter |

## Component Patterns

- **Named exports** for all components (`export const Button`)
- **Default exports** only for page components (lazy-loading compatibility)
- **tailwind-variants** for styling via `tv()` wrapper from `@/utils`
- **Radix UI** for accessible primitives (Dialog, Select, Tabs, Toast)
- **Motion** for animations (`motion.div`, `motion.button`)
- **Barrel exports** via `index.ts` at every folder level
- **Types separated** into `src/types/components/` mirroring component structure
