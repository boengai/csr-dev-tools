# Story 26.1: Timezone Converter

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer working with distributed teams**,
I want **to convert date/times between different timezones with searchable timezone selection and favorites**,
so that **I can coordinate meetings and understand timestamps across time zones without leaving the browser**.

## Acceptance Criteria

1. **Given** the user selects a source timezone and enters a date/time
   **When** a target timezone is selected
   **Then** the converted date/time is displayed, correctly accounting for DST

2. **Given** multiple target timezones can be added
   **When** the user adds timezones
   **Then** all target times are shown simultaneously

3. **Given** the "Now" button
   **When** clicked
   **Then** the current date/time is populated in the source timezone

4. **Given** all IANA timezones
   **When** the timezone picker is used
   **Then** timezones are searchable by name, city, or abbreviation (e.g., "PST", "Tokyo", "America/New_York")

5. **Given** a favorites feature
   **When** the user stars a timezone
   **Then** it appears at the top of the list for quick access (persisted in localStorage)

## Tasks / Subtasks

- [x] Task 1: Create timezone-converter utility module (AC: #1, #4)
  - [x] 1.1 Create `src/utils/timezone-converter.ts`
  - [x] 1.2 Define types:
    ```typescript
    export type TimezoneEntry = {
      abbreviation: string
      city: string
      id: string
      label: string
      offset: string
      offsetMinutes: number
      region: string
      searchTokens: Array<string>
    }

    export type ConversionResult = {
      abbreviation: string
      date: string
      offset: string
      time: string
      timezone: string
    }
    ```
  - [x] 1.3 Implement `getTimezoneList(): Array<string>`:
    - Use `Intl.supportedValuesOf('timeZone')` to get all IANA timezone identifiers
    - Supplement with `'UTC'` if missing (Chrome omits it)
    - Return sorted array (~420 entries)
  - [x] 1.4 Implement `buildTimezoneIndex(referenceDate?: Date): Array<TimezoneEntry>`:
    - For each timezone ID, use `Intl.DateTimeFormat` with `timeZoneName: 'short'` to get abbreviation (e.g., "PST", "EST")
    - Use `timeZoneName: 'longOffset'` to get UTC offset string (e.g., "GMT-08:00")
    - Parse offset to numeric minutes for sorting (e.g., -480 for GMT-08:00)
    - Extract city name from IANA ID: `America/New_York` -> `New York` (last segment, underscores to spaces)
    - Extract region from IANA ID: `America/New_York` -> `America` (first segment)
    - Build `label`: `"New York (PST, GMT-08:00)"`
    - Build `searchTokens`: lowercase array of region parts, city parts, abbreviation, offset (e.g., `["america", "new", "york", "pst", "gmt-08:00"]`)
    - Cache result in module-level variable. Rebuild only if referenceDate changes (for DST-accurate abbreviations/offsets)
  - [x] 1.5 Implement `searchTimezones(query: string, index: Array<TimezoneEntry>): Array<TimezoneEntry>`:
    - Lowercase trim the query
    - If empty, return full index
    - Filter entries where any `searchToken` starts with or includes the query
    - Return filtered results (order preserved from index)
  - [x] 1.6 Implement `convertTimezone(date: Date, sourceTimezone: string, targetTimezone: string): ConversionResult`:
    - Use `Intl.DateTimeFormat` with `timeZone: targetTimezone` and full date/time parts
    - Use `formatToParts()` to extract year, month, day, hour, minute, second
    - Format date as `YYYY-MM-DD` and time as `HH:MM:SS`
    - Get abbreviation via `timeZoneName: 'short'`
    - Get offset via `timeZoneName: 'longOffset'`
    - Return `ConversionResult` object
  - [x] 1.7 Implement `parseDateTimeInput(dateStr: string, timeStr: string, timezone: string): Date | null`:
    - Parse the user's date input (YYYY-MM-DD) and time input (HH:MM) into a `Date` object
    - The input represents a local time in the given timezone — construct a UTC `Date` by computing the offset
    - Strategy: Create a date string, format it with `Intl.DateTimeFormat` targeting the source timezone, compute the offset between the constructed date and the target representation, and adjust
    - Return null if inputs are invalid
  - [x] 1.8 Implement `parseOffsetToMinutes(offset: string): number`:
    - Parse "GMT", "GMT+05:30", "GMT-08:00" to minutes (0, 330, -480)
    - Handle edge case: "GMT" (no offset) returns 0
  - [x] 1.9 Implement `getLocalTimezone(): string`:
    - Return `Intl.DateTimeFormat().resolvedOptions().timeZone` — the user's system timezone
  - [x] 1.10 **CRITICAL**: No external npm package needed. Use ONLY the native `Intl.DateTimeFormat` API. The browser's IANA timezone database handles DST automatically. `Intl.supportedValuesOf('timeZone')` is supported in all modern browsers (Chrome 93+, Firefox 93+, Safari 15.4+).

- [x] Task 2: Create timezone-converter unit tests (AC: #1, #4)
  - [x] 2.1 Create `src/utils/timezone-converter.spec.ts`
  - [x] 2.2 Test `getTimezoneList`:
    - Returns an array of strings
    - Contains well-known timezones (America/New_York, Europe/London, Asia/Tokyo, UTC)
    - Array is sorted alphabetically
  - [x] 2.3 Test `buildTimezoneIndex`:
    - Returns array of TimezoneEntry objects
    - Each entry has id, city, region, abbreviation, offset, offsetMinutes, label, searchTokens
    - UTC entry has offsetMinutes 0
    - America/New_York city is "New York", region is "America"
  - [x] 2.4 Test `searchTimezones`:
    - Search "tokyo" returns entries containing Asia/Tokyo
    - Search "new york" returns America/New_York
    - Search "pst" returns Pacific timezone entries
    - Search "gmt+09" returns entries with that offset
    - Empty search returns full index
    - Non-matching search returns empty array
  - [x] 2.5 Test `convertTimezone`:
    - Convert known UTC date to America/New_York → correct EST/EDT offset
    - Convert known date to Asia/Tokyo → correct JST offset (UTC+9)
    - Result has correct date, time, abbreviation, offset fields
  - [x] 2.6 Test `parseOffsetToMinutes`:
    - "GMT" → 0
    - "GMT+05:30" → 330
    - "GMT-08:00" → -480
    - "GMT+00:00" → 0
  - [x] 2.7 Test `getLocalTimezone`:
    - Returns a non-empty string
    - Returns a valid IANA timezone identifier

- [x] Task 3: Create TimezoneConverter component (AC: all)
  - [x] 3.1 Create `src/components/feature/time/TimezoneConverter.tsx`
  - [x] 3.2 Update `src/components/feature/time/index.ts` — add barrel export `export { TimezoneConverter } from './TimezoneConverter'` (alphabetical — after `CrontabGenerator`, before `TimeUnixTimestamp`)
  - [x] 3.3 Implement main layout: tool description from `TOOL_REGISTRY_MAP['timezone-converter']`, source timezone + date/time input section, target timezones results section
  - [x] 3.4 **Source Section (AC #1, #3)**:
    - Source timezone: searchable text input that filters timezone options, with a dropdown/list of matching timezones. Default to user's local timezone via `getLocalTimezone()`
    - Date input: `<input type="date">` for date selection (native HTML5 date picker)
    - Time input: `<input type="time">` for time selection (native HTML5 time picker)
    - "Now" button: populates current date and time in the source timezone
    - On any source change (timezone, date, or time), recalculate all target timezone conversions
  - [x] 3.5 **Timezone Search (AC #4)**:
    - Build timezone index on mount using `buildTimezoneIndex()`
    - Text input for timezone search query
    - Show filtered results as a scrollable list below the search input (max-h-48 overflow-y-auto)
    - Each result shows: city name, abbreviation, offset (e.g., "New York — EST, GMT-05:00")
    - Click to select a timezone
    - Selected timezone shown as a chip/badge with the city name
    - **CRITICAL**: Use `TextInput` from `@/components/common` with `type="text"` for the search. Do NOT use `SelectInput` — the ~420 timezone options would be too many for a Radix Select dropdown. Use a custom filtered list instead.
  - [x] 3.6 **Target Timezones Section (AC #2)**:
    - "Add Timezone" button opens a timezone search picker (same searchable list pattern as source)
    - Each added target timezone shows as a card/row:
      - Timezone name, city, abbreviation
      - Converted date and time (formatted)
      - UTC offset
      - Remove button (X) to remove this target timezone
      - Star/favorite toggle button
      - `CopyButton` to copy the converted time
    - Multiple targets displayed simultaneously in a vertical list
    - Default: pre-populate with 2-3 common timezones (UTC, and one or two popular ones different from user's local timezone)
  - [x] 3.7 **Favorites Feature (AC #5)**:
    - Use `localStorage` to persist favorited timezone IDs
    - Favorited timezones appear at the top of the timezone search results
    - Star icon toggles favorite on/off
    - Storage key: `csr-dev-tools-timezone-favorites` (or similar namespaced key)
    - Read favorites on mount, write on toggle
  - [x] 3.8 **Conversion Logic**:
    - Parse source date/time input into a `Date` object using `parseDateTimeInput()`
    - For each target timezone, call `convertTimezone()` to get the result
    - Debounce conversion (300ms) using `useDebounceCallback` when source inputs change
    - Show all results simultaneously
  - [x] 3.9 **Error Handling**:
    - Invalid date/time input: show inline error below inputs (role="alert")
    - Use `useToast` with `type: 'error'` for unexpected failures only
    - Empty state: "Add a target timezone to see conversions" message
  - [x] 3.10 **Layout**: Desktop (md+): source section on the left (~40%), target results on the right (~60%) using `flex flex-col md:flex-row`. Mobile (< 768px): stack vertically — source inputs, then target results.
  - [x] 3.11 **Accessibility**:
    - `aria-live="polite"` on the target results container (updates when conversions change)
    - `role="status"` on each conversion result
    - `role="alert"` on error messages
    - `aria-label` on the timezone search input ("Search timezones")
    - `aria-label` on add/remove/favorite buttons
    - Keyboard accessible: Tab through source inputs, target list, action buttons
    - Timezone search results navigable with arrow keys (optional enhancement)

- [x] Task 4: Register tool and configure routing (AC: all)
  - [x] 4.1 Add `'timezone-converter'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical — between `'text-sort-dedupe'` and `'toml-to-json-converter'`)
  - [x] 4.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within array):
    ```typescript
    {
      category: 'Time',
      component: lazy(() =>
        import('@/components/feature/time/TimezoneConverter').then(
          ({ TimezoneConverter }: { TimezoneConverter: ComponentType }) => ({
            default: TimezoneConverter,
          }),
        ),
      ),
      description:
        'Convert date and time between timezones with searchable timezone selection, multiple simultaneous targets, and favorites. Handles DST automatically.',
      emoji: '🌍',
      key: 'timezone-converter',
      name: 'Timezone Converter',
      routePath: '/tools/timezone-converter',
      seo: {
        description:
          'Convert date and time between IANA timezones online. Search by city, abbreviation (PST, EST), or region. Multiple timezone comparison, DST-aware, 100% client-side.',
        title: 'Timezone Converter - CSR Dev Tools',
      },
    }
    ```
  - [x] 4.3 Add prerender route `/tools/timezone-converter` in `vite.config.ts` `toolRoutes` array (alphabetical — between `text-sort-dedupe` and `toml-to-json-converter`):
    ```typescript
    {
      description:
        'Convert date and time between IANA timezones online. Search by city, abbreviation (PST, EST), or region. Multiple timezone comparison, DST-aware, 100% client-side.',
      path: '/tools/timezone-converter',
      title: 'Timezone Converter - CSR Dev Tools',
      url: '/tools/timezone-converter',
    },
    ```

- [x] Task 5: Create E2E tests (AC: all)
  - [x] 5.1 Create `e2e/timezone-converter.spec.ts`
  - [x] 5.2 Test: navigate to tool page, verify title and description are rendered
  - [x] 5.3 Test: default state — source timezone is populated (user's local tz), date/time inputs present, some default target timezones shown (AC #1)
  - [x] 5.4 Test: click "Now" button → date and time inputs are populated with current values (AC #3)
  - [x] 5.5 Test: change source timezone → target conversions update (AC #1)
  - [x] 5.6 Test: add a target timezone via search → new conversion row appears (AC #2)
  - [x] 5.7 Test: search for "tokyo" in timezone picker → Asia/Tokyo appears in results (AC #4)
  - [x] 5.8 Test: search for "pst" → Pacific timezone results appear (AC #4)
  - [x] 5.9 Test: remove a target timezone → row disappears (AC #2)
  - [x] 5.10 Test: star a timezone → verify it persists after page reload using localStorage (AC #5)
  - [x] 5.11 Test: click CopyButton on a result → value copied to clipboard
  - [x] 5.12 Test: mobile viewport (375px) responsiveness — inputs and results stack vertically

- [x] Task 6: Verify build and tests pass
  - [x] 6.1 Run `pnpm lint` — 0 errors
  - [x] 6.2 Run `pnpm format` — compliant
  - [x] 6.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x] 6.4 Run `pnpm build` — clean build, static HTML files generated (new count = previous + 1)
  - [x] 6.5 Run E2E tests — all Timezone Converter tests pass
  - [x] 6.6 Verify tool works in production build (`pnpm preview`)

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Motion 12.34.0
- **Component Pattern**: Named export `export const TimezoneConverter`, no default export
- **State**: `useState` for local UI state (source timezone, date/time inputs, target timezones, search query, favorites)
- **Error Handling**: Input validation errors displayed inline below inputs; `useToast` with `type: 'error'` for unexpected failures only
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants if needed, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`) — minimal animation for adding/removing target timezone rows
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width

### Zero External Dependencies

**This tool requires NO npm packages.** It uses exclusively the native `Intl.DateTimeFormat` API:

- **Timezone list**: `Intl.supportedValuesOf('timeZone')` — returns ~420 IANA timezone identifiers. Chrome omits `UTC`, so manually supplement it.
- **Timezone conversion**: `new Intl.DateTimeFormat('en-US', { timeZone, ... }).formatToParts(date)` — extracts year, month, day, hour, minute, second for any timezone at any point in time.
- **Abbreviation (PST, EST)**: `timeZoneName: 'short'` option with `formatToParts()`.
- **UTC offset (GMT-08:00)**: `timeZoneName: 'longOffset'` option with `formatToParts()`.
- **DST handling**: Automatic — the browser's IANA timezone database knows about all DST transitions. `America/New_York` produces "EST" / "GMT-05:00" in winter and "EDT" / "GMT-04:00" in summer.
- **User's local timezone**: `Intl.DateTimeFormat().resolvedOptions().timeZone`.

**Why no library**: date-fns-tz, luxon, and dayjs/timezone are valuable for rich date manipulation (parsing arbitrary formats, date arithmetic) but a timezone converter just needs to display the same moment in different timezones — exactly what `Intl.DateTimeFormat` was designed for. Adding a library would bloat the bundle unnecessarily.

### Core API Patterns

```typescript
// Get all timezones
const timezones = Intl.supportedValuesOf('timeZone')

// Convert a Date to any timezone
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})
const parts = formatter.formatToParts(new Date())
// Returns: [{type: "month", value: "02"}, {type: "literal", value: "/"}, ...]

// Get abbreviation
const abbrFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  timeZoneName: 'short',  // "EST" or "EDT"
})

// Get UTC offset
const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  timeZoneName: 'longOffset',  // "GMT-05:00" or "GMT-04:00"
})

// User's local timezone
const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone  // e.g., "America/Los_Angeles"
```

### Tool Type: Interactive Converter (Hybrid Pattern)

This tool uses a hybrid pattern — reactive conversion on input change, with interactive add/remove for target timezones:

- **Processing trigger**: On source input change (timezone, date, time) → debounced 300ms
- **Target management**: Add/remove target timezones via button clicks (immediate, no debounce)
- **Favorites**: localStorage read on mount, write on toggle (immediate)
- **Debounce**: 300ms via `useDebounceCallback` from `@/hooks`
- **Input**: Native HTML5 `<input type="date">` and `<input type="time">` for date/time selection. Custom searchable timezone picker using `TextInput` + filtered list.
- **Output**: List of conversion result cards, each showing timezone, converted date/time, offset, abbreviation

### Category and Domain Placement

**Category**: `'Time'` (already exists — used by UnixTimestamp, CronExpressionParser, CrontabGenerator)
**Component Directory**: `src/components/feature/time/TimezoneConverter.tsx`
**Emoji**: 🌍
**Key**: `timezone-converter`
**Route**: `/tools/timezone-converter`

### Component Implementation Pattern

```
src/components/feature/time/TimezoneConverter.tsx
├── Tool description from TOOL_REGISTRY_MAP['timezone-converter']
│
├── Main Layout (flex row on desktop, flex col on mobile)
│   ├── Left Panel: Source Section
│   │   ├── Header: "Source" label
│   │   ├── Timezone search picker (TextInput + filtered list)
│   │   ├── Date input (native <input type="date">)
│   │   ├── Time input (native <input type="time">)
│   │   ├── "Now" button — populates current date/time
│   │   └── Error message (inline, role="alert")
│   │
│   └── Right Panel: Target Timezones
│       ├── Header: "Target Timezones" + "Add Timezone" button
│       ├── Timezone list (aria-live="polite")
│       │   └── For each target timezone:
│       │       ├── Timezone name + city + abbreviation
│       │       ├── Converted date and time
│       │       ├── UTC offset
│       │       ├── Star/favorite toggle (aria-label)
│       │       ├── CopyButton (copy formatted time)
│       │       └── Remove button (X) (aria-label)
│       └── Empty state: "Add a target timezone to see conversions"
│
└── Add Timezone Modal/Popover (when "Add Timezone" clicked)
    ├── Search input (TextInput type="text", aria-label)
    └── Filtered timezone results (scrollable list, max-h-48)
```

### Timezone Search Design

**CRITICAL**: Do NOT use `SelectInput` (Radix Select) for timezone selection. ~420 timezone options would overwhelm the dropdown. Instead, use a custom searchable pattern:

1. `TextInput` for search query
2. Filtered list rendered below the input (visible when search has focus or has text)
3. Results show: `"New York — EST, GMT-05:00"` format
4. Click a result to select it
5. Favorites (starred) appear at the top of the results list
6. If no search query, show favorites first, then all timezones sorted by offset

**Search matches**: city name, IANA ID parts (region, subregion), abbreviation (PST, EST, CET), UTC offset (GMT-05, GMT+09)

**Performance**: Building the timezone index iterates ~420 zones with 2 `Intl.DateTimeFormat` instances each. Takes ~20-50ms on modern browsers. Build once on mount and cache. Rebuild when reference date changes significantly (for DST-accurate abbreviations).

### Favorites Persistence

Use raw `localStorage` (not Zustand persist — this is tool-local state, not app-wide):

```typescript
const FAVORITES_KEY = 'csr-dev-tools-timezone-favorites'

function loadFavorites(): Array<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveFavorites(favorites: Array<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}
```

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — debounce conversion on source input change (300ms)
- `useToast` from `@/hooks` — for unexpected error handling only
- Do NOT use `useCopyToClipboard` directly — use CopyButton component

**Components to Use:**
- `CopyButton` from `@/components/common` — for copying converted time strings
- `TextInput` from `@/components/common` — for timezone search (type="text"). **Requires `type` prop.**
- Do NOT use `SelectInput` — too many timezone options
- Do NOT use `FieldForm` for timezone search — custom search pattern needed
- Consider `FieldForm` with `type="text"` for date/time labels if it fits layout

### Previous Story Intelligence (25.4 JSONPath Evaluator)

Key learnings from Story 25.4 to apply here:

1. **Barrel export ordering**: Maintain alphabetical order in `src/components/feature/time/index.ts` — new entry goes after `CrontabGenerator`, before `TimeUnixTimestamp` (which currently uses `export *` — maintain consistency)
2. **Registration checklist**: types union -> registry entry -> vite prerender -> barrel exports
3. **Time category already exists**: `'Time'` is in ToolCategory and CATEGORY_ORDER — no changes needed
4. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
5. **Stale closure bug**: Previous story hit stale closure with debounced callbacks capturing stale state. Use `useRef` mirrors for state values referenced in debounced callbacks
6. **Code review common fixes**: Watch for falsy value handling (0, false, ""), Tailwind class ordering (responsive before base), missing useMemo for derived values
7. **E2E test selectors**: Use data-testid or specific selectors to avoid strict-mode violations
8. **TextInput requires `type` prop**: Must pass `type="text"` or `type="number"` — it's required

### Git Intelligence

Recent commit patterns from Epic 25:
- `46957e6` — `🔄 Epic 25 Retrospective — Code & Schema Tools`
- `8d24460` — `🎯 JSONPath Evaluator + 🔍 code review fixes (Story 25.4)`
- `0120eb8` — `🏗️ TypeScript Playground + 🔍 code review fixes (Story 25.3)`

**Commit message pattern**: `{emoji} {Tool Name} + 🔍 code review fixes (Story {epic}.{story})`
Suggested for this story: `🌍 Timezone Converter + 🔍 code review fixes (Story 26.1)`

**Files pattern (no new dependency):**
- `src/utils/timezone-converter.ts` — new utility
- `src/utils/timezone-converter.spec.ts` — new unit tests
- `src/components/feature/time/TimezoneConverter.tsx` — new component
- `src/components/feature/time/index.ts` — barrel export update
- `src/types/constants/tool-registry.ts` — ToolRegistryKey union
- `src/constants/tool-registry.ts` — registry entry
- `vite.config.ts` — prerender route
- `e2e/timezone-converter.spec.ts` — E2E tests

### Project Structure Notes

- **Existing directory**: `src/components/feature/time/` — already exists with 3 tools (CronExpressionParser, CrontabGenerator, TimeUnixTimestamp)
- **Time category already exists**: `'Time'` in ToolCategory and CATEGORY_ORDER — no changes needed
- **Time barrel already exists**: `src/components/feature/time/index.ts` — add new export in alphabetical order
- **No new dependencies**: Pure browser API (`Intl.DateTimeFormat`, `Intl.supportedValuesOf`)
- **Utility file**: `src/utils/timezone-converter.ts` — pure functions for timezone listing, indexing, searching, converting
- **Unit tests**: `src/utils/timezone-converter.spec.ts` — test all utility functions

### File Locations & Naming

| File | Path |
|---|---|
| Utility | `src/utils/timezone-converter.ts` |
| Unit tests | `src/utils/timezone-converter.spec.ts` |
| Component | `src/components/feature/time/TimezoneConverter.tsx` |
| Time barrel update | `src/components/feature/time/index.ts` |
| E2E test | `e2e/timezone-converter.spec.ts` |
| Registry key type | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` -> `toolRoutes` array |

### Code Conventions (Enforced)

- `type` over `interface`
- `Array<T>` over `T[]`
- `import type` for type-only imports
- Named exports only (no default export for components)
- `@/` path alias for all imports
- Let TypeScript infer where possible
- No `console.log` statements
- Alphabetical ordering in object keys, barrel exports, union types

### E2E Testing Notes

**Timezone Converter Testing:**
- Source timezone defaults to user's local timezone — tests should use a known timezone or verify the default is populated
- Date/time native inputs use `page.fill()` or `input.fill()` for value setting
- Conversion results are debounced 300ms — wait for results after input changes
- Timezone search involves typing in TextInput and clicking from a filtered list — use `page.getByText()` to find timezone options
- Favorites use localStorage — use `page.evaluate(() => localStorage.setItem(...))` to set up or verify
- "Now" button sets current time — verify inputs are non-empty after click (don't assert exact time due to test timing)
- Add/remove timezone buttons should have data-testid or aria-label for reliable selection

### UX / Interaction Requirements

- **Source Section**: Timezone search picker (default: user's local tz), date picker (native HTML5), time picker (native HTML5), "Now" button
- **Target Section**: List of target timezone cards with converted times, add/remove/favorite actions
- **Search**: Custom searchable filtered list — NOT a select dropdown (too many options). Search by city, abbreviation, region, offset.
- **Favorites**: Star toggle on each target timezone. Starred timezones appear first in search results. Persisted in localStorage.
- **Responsive**: Desktop: side-by-side panels. Mobile (< 768px): stacked vertically.
- **Initial state**: Source timezone = user's local tz. Date/time = current ("Now" auto-populated on mount). 2-3 default target timezones (UTC + popular timezone different from user's).
- **Mobile**: Full-width, 375px min viewport. All sections stack vertically.
- **Loading**: No loading state needed — timezone conversion is instant (<1ms per conversion). Index build ~20-50ms on mount.

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 26 Story 26.1]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/25-4-jsonpath-evaluator.md — previous story patterns and learnings]
- [Source: _bmad-output/planning-artifacts/architecture.md — Tool Processing, Error Handling, Code Splitting]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: src/components/feature/time/index.ts — time domain barrel exports pattern]
- [Source: src/components/feature/time/TimeUnixTimestamp.tsx — existing time tool implementation pattern]
- [Source: vite.config.ts — prerender route registration]
- [Source: MDN Intl.DateTimeFormat — native timezone conversion API]
- [Source: MDN Intl.supportedValuesOf — native timezone list API]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed unit test: Node.js returns "GMT+9" instead of "JST" for Asia/Tokyo (ICU data difference between Node.js and browsers). Made test environment-agnostic.
- Fixed build: Added explicit `import { describe, expect, it } from 'vitest'` — project convention requires explicit vitest imports for TypeScript compilation.
- Fixed build: Removed unused `useToast` import and `toast` destructure — error handling uses inline state, not toast.
- Fixed E2E test: AnimatePresence `mode="popLayout"` keeps exiting elements in DOM during animation. Used Playwright's auto-retrying `toHaveCount()` assertion instead of manual `waitForTimeout`.

### Completion Notes List

- Implemented timezone-converter utility module with 8 exported functions using native `Intl.DateTimeFormat` API (zero npm dependencies)
- Created TimezoneConverter component with source/target timezone panels, searchable timezone picker, "Now" button, favorites (localStorage), and responsive layout
- Registered tool in tool registry, types, vite prerender config, and barrel exports
- 29 unit tests covering all utility functions (getTimezoneList, buildTimezoneIndex, searchTimezones, convertTimezone, parseDateTimeInput, parseOffsetToMinutes, getLocalTimezone)
- 11 E2E tests covering rendering, default state, Now button, conversion updates, timezone search, add/remove targets, favorites persistence, copy, and mobile responsiveness
- All 1256 unit tests pass (0 regressions), all 11 E2E tests pass
- Build produces 61 static HTML files (previous 60 + 1 new)
- Lint: 0 errors, formatting: compliant

### File List

- `src/utils/timezone-converter.ts` — NEW: Timezone utility functions (getTimezoneList, buildTimezoneIndex, searchTimezones, convertTimezone, parseDateTimeInput, parseOffsetToMinutes, getLocalTimezone)
- `src/utils/timezone-converter.spec.ts` — NEW: 29 unit tests for timezone utility
- `src/components/feature/time/TimezoneConverter.tsx` — NEW: TimezoneConverter component with searchable picker, favorites, keyboard navigation, responsive layout
- `src/components/feature/time/index.ts` — MODIFIED: Added TimezoneConverter barrel export
- `src/types/constants/tool-registry.ts` — MODIFIED: Added 'timezone-converter' to ToolRegistryKey union
- `src/constants/tool-registry.ts` — MODIFIED: Added timezone-converter registry entry
- `src/components/feature/code/JsonpathEvaluator.tsx` — MODIFIED: oxfmt formatting corrections (Tailwind class ordering, JSX wrapping)
- `vite.config.ts` — MODIFIED: Added /tools/timezone-converter prerender route
- `e2e/timezone-converter.spec.ts` — NEW: 11 E2E tests

### Change Log

- 2026-02-25: Implemented Timezone Converter tool (Story 26.1) — full implementation with utility module, component, registration, unit tests, and E2E tests. Zero external dependencies, uses native Intl.DateTimeFormat API.
- 2026-02-25: Code review fixes — Added 8 parseDateTimeInput unit tests, added aria-selected + keyboard navigation (ArrowUp/Down, Enter, Escape) to timezone search picker, added "No timezones found" empty state message, documented formatter-applied changes to JsonpathEvaluator.tsx.
