# Epic: 5 New Developer Tools — Requirements

## Tools

### 1. JSON to TypeScript (`json-to-typescript`)
- **Category:** Code
- **Emoji:** 🏗️
- **Description:** Generate TypeScript interfaces or types from JSON. Paste JSON, get type-safe code.
- **Acceptance Criteria:**
  - Paste JSON → generates TS interfaces with proper nesting
  - Supports arrays of objects (infers union types)
  - Configurable: root name, `interface` vs `type`, optional properties toggle
  - Handles edge cases: empty objects, mixed arrays, null values
  - Copy output button
  - Opens in dialog (consistent with code tools pattern)

### 2. Cron Expression Parser (`cron-expression-parser`)
- **Category:** Time
- **Emoji:** ⏰
- **Description:** Parse cron expressions into human-readable text and show the next scheduled run times.
- **Acceptance Criteria:**
  - Input cron expression (5-field standard + optional 6-field with seconds)
  - Displays human-readable description
  - Shows next 5-10 scheduled run times
  - Preset examples (every minute, daily at midnight, weekdays 9am, etc.)
  - Validates input, shows error for invalid expressions
  - No dialog needed — inline display (like Number Base Converter)

### 3. CSS Grid Playground (`css-grid-playground`)
- **Category:** CSS
- **Emoji:** 🔲
- **Description:** Visual CSS Grid layout builder. Define rows, columns, gaps, and placement — copy the CSS.
- **Acceptance Criteria:**
  - Configure grid-template-columns, grid-template-rows (text inputs)
  - Configure gap, justify-items, align-items
  - Visual grid with colored child items
  - Add/remove child items
  - Copy generated CSS
  - Inline component (like Flexbox Playground)

### 4. Color Picker from Image (`image-color-picker`)
- **Category:** Image
- **Emoji:** 🎯
- **Description:** Upload an image and click anywhere to extract colors. Get HEX, RGB, and HSL values.
- **Acceptance Criteria:**
  - Upload image (drag & drop or file picker)
  - Click on image to pick color at that pixel
  - Show picked color as swatch + HEX, RGB, HSL values
  - Maintain a palette of picked colors (up to 10)
  - Copy individual color values
  - Clear palette / reset
  - Opens in dialog (needs large canvas area)

### 5. Text Sort & Dedupe (`text-sort-dedupe`)
- **Category:** Text
- **Emoji:** 🔀
- **Description:** Sort lines alphabetically, numerically, or by length. Remove duplicates and empty lines.
- **Acceptance Criteria:**
  - Textarea input with line-by-line processing
  - Sort options: A-Z, Z-A, by line length (asc/desc), numeric
  - Toggles: remove duplicates, remove empty lines, trim whitespace
  - Shows line count before/after
  - Copy result
  - No dialog needed — inline display

## Architecture Pattern
Each tool follows the established pattern:
- **Utility:** `src/utils/<name>.ts` + `src/utils/<name>.spec.ts`
- **Component:** `src/components/feature/<category>/<Name>.tsx`
- **Registry:** Entry in `src/constants/tool-registry.ts`
- **Types:** In `src/types/` if needed
- **Exports:** Added to `src/utils/index.ts` and `src/types/index.ts`
