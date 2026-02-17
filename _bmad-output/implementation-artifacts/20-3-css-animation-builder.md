---
story: 20.3
title: CSS Animation Builder
status: review
epic: 20
---

# Story 20.3: CSS Animation Builder

Status: review

## Story

As a **user**,
I want **to visually create CSS keyframe animations with multiple steps, timing functions, and live preview**,
So that **I can prototype animations without writing CSS from scratch**.

**Epic:** Epic 20 — Advanced Developer Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 20-3-css-animation-builder

## Acceptance Criteria

### AC1: Tool Registered and Renders with Dialog

**Given** the CSS Animation Builder tool registered in `TOOL_REGISTRY` under the CSS category
**When** the user navigates to it (via sidebar, command palette, or `/tools/css-animation-builder` route)
**Then** it renders inline with a button to open the dialog
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Keyframe Definition at Percentage Steps

**Given** the dialog is open
**When** the user sees the keyframe editor
**Then** default keyframe stops are provided at 0% and 100%
**And** the user can add keyframes at 25%, 50%, 75% (or custom percentages)
**And** each keyframe allows setting: transform (translate X/Y, rotate, scale), opacity, background-color

### AC3: Animation Settings

**Given** the animation settings panel
**When** the user adjusts settings
**Then** configurable options include: duration (0.1s–10s), timing-function (ease, linear, ease-in, ease-out, ease-in-out), iteration-count (1–infinite), direction (normal, reverse, alternate, alternate-reverse), fill-mode (none, forwards, backwards, both)

### AC4: Live Preview

**Given** keyframes and animation settings
**When** any property changes
**Then** a sample element (colored square) plays the animation in real-time
**And** the preview loops according to iteration-count setting

### AC5: CSS Output with @keyframes

**Given** the configured animation
**When** the user views the output
**Then** complete CSS is shown including `@keyframes animationName { ... }` and `animation: name duration timing-function ...` shorthand
**And** a `CopyButton` copies the full CSS output

### AC6: Sensible Defaults

**Given** the dialog opens
**When** the tool loads
**Then** a simple fade-in animation is configured (0% opacity:0 → 100% opacity:1)
**And** duration=1s, timing=ease, iterations=1, direction=normal, fill=forwards
**And** the preview plays immediately

### AC7: Unit Tests Cover CSS Generation

**Given** unit tests in `src/utils/css-animation.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: simple 2-keyframe animation, multi-keyframe with transforms, all timing functions, infinite iteration, alternate direction, animation shorthand format

## Tasks / Subtasks

- [x] Task 1: Create css-animation utility (AC: #5, #6, #7)
  - [x] 1.1 Create `src/utils/css-animation.ts`
  - [x] 1.2 Define `KeyframeStep` type
  - [x] 1.3 Define `AnimationConfig` type
  - [x] 1.4 Define `DEFAULT_ANIMATION_CONFIG` with fade-in defaults
  - [x] 1.5 Implement `generateAnimationCss(config: AnimationConfig): string`
  - [x] 1.6 Implement `buildTransformString(step: KeyframeStep): string`
  - [x] 1.7 Export all types, defaults, and functions

- [x] Task 2: Write unit tests (AC: #7)
  - [x] 2.1 Create `src/utils/css-animation.spec.ts`
  - [x] 2.2 Test simple fade-in (0%→100% opacity) generates correct @keyframes
  - [x] 2.3 Test multi-keyframe with transforms at 0%, 50%, 100%
  - [x] 2.4 Test animation shorthand includes all properties
  - [x] 2.5 Test infinite iteration-count output
  - [x] 2.6 Test alternate direction output
  - [x] 2.7 Test `buildTransformString` with translate, rotate, scale combined
  - [x] 2.8 Test default config produces valid CSS

- [x] Task 3: Create CssAnimationBuilder component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/css/CssAnimationBuilder.tsx` as named export
  - [x] 3.2 Inline view: tool description + "Build Animation" button to open dialog
  - [x] 3.3 Dialog (size="screen") layout: left panel (keyframe editor + settings), right panel (preview + CSS output)
  - [x] 3.4 Keyframe editor: list of keyframe stops with add/remove buttons
  - [x] 3.5 Per-keyframe controls: translateX/Y, rotate, scale, opacity, backgroundColor
  - [x] 3.6 Animation settings: duration, timing, iterations, direction, fill-mode
  - [x] 3.7 Live preview: apply animation via inline `<style>` tag with dynamic @keyframes
  - [x] 3.8 CSS output in monospace code block with `CopyButton`
  - [x] 3.9 Reset state on dialog close
  - [x] 3.10 Accept `ToolComponentProps`

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'css-animation-builder'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add pre-render route in `vite.config.ts`

- [x] Task 5: Create barrel exports (AC: #1)
  - [x] 5.1 Add export to `src/components/feature/css/index.ts`
  - [x] 5.2 Add export to `src/utils/index.ts`

- [x] Task 6: Verify integration (AC: #1–#7)
  - [x] 6.1 Run `pnpm test` — all tests pass (8 new tests, 825 total)
  - [x] 6.2 Run `npx tsc --noEmit` — clean
  - [x] 6.3 All tasks complete

## Dev Notes

### Dialog Pattern — Follows BoxShadowGenerator but in Dialog

This tool needs dialog space for the keyframe timeline, settings, and live preview. Follow `ImageResizer.tsx` and `JsonFormatter.tsx` for dialog pattern with `ToolComponentProps`.

### Live Preview via Dynamic Style Tag

Inject a `<style>` tag into the dialog with the generated @keyframes CSS, and apply the animation to a preview element. Use a unique animation name (e.g., `csr-anim-preview`) to avoid conflicts.

```typescript
// Dynamic style injection for live preview
const animCss = generateAnimationCss(config)
const previewStyle = `
  @keyframes csr-anim-preview { ${keyframesCssBody} }
  .csr-anim-target {
    animation: csr-anim-preview ${config.duration}s ${config.timingFunction}
      ${config.iterationCount} ${config.direction} ${config.fillMode};
  }
`

// In JSX:
<style>{previewStyle}</style>
<div className="csr-anim-target h-20 w-20 rounded-lg bg-primary" />
```

**Critical:** When animation config changes, force re-trigger by toggling a key on the preview element:
```typescript
const [animKey, setAnimKey] = useState(0)
// On any config change:
setAnimKey((k) => k + 1)
// In JSX:
<div key={animKey} className="csr-anim-target ..." />
```

### UI Layout (Dialog)

```
┌─── Dialog: CSS Animation Builder ────────────────────────────────┐
│                                                                   │
│  ┌─── Keyframes ──────────────────┐ │ ┌─── Preview ────────────┐ │
│  │                                │ │ │                         │ │
│  │ [0%] opacity: 0    [✕]        │ │ │    ┌──────┐             │ │
│  │ [50%] opacity: 0.5  [✕]       │ │ │    │ ■■■■ │ ← animated │ │
│  │ [100%] opacity: 1   [✕]       │ │ │    └──────┘             │ │
│  │                                │ │ │                         │ │
│  │ [+ Add Keyframe]              │ │ └─────────────────────────┘ │
│  │                                │ │                             │
│  │─── Settings ──────────────────│ │ ┌─── CSS Output ──────────┐ │
│  │ Duration   [────●──] 1s       │ │ │ @keyframes anim {       │ │
│  │ Timing     [ease      ▾]     │ │ │   0% { opacity: 0; }    │ │
│  │ Iterations [1         ]       │ │ │   100% { opacity: 1; }  │ │
│  │ Direction  [normal    ▾]     │ │ │ }                        │ │
│  │ Fill Mode  [forwards  ▾]     │ │ │ animation: anim 1s ease..│ │
│  └────────────────────────────────┘ │ │                  [Copy] │ │
│                                      │ └────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Default Animation Config

```typescript
const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  direction: 'normal',
  duration: 1,
  fillMode: 'forwards',
  iterationCount: '1',
  keyframes: [
    { backgroundColor: '#6366f1', opacity: 0, percent: 0, rotate: 0, scale: 1, translateX: 0, translateY: 0 },
    { backgroundColor: '#6366f1', opacity: 1, percent: 100, rotate: 0, scale: 1, translateX: 0, translateY: 0 },
  ],
  name: 'custom-animation',
  timingFunction: 'ease',
}
```

### CSS Output Format

```css
@keyframes custom-animation {
  0% {
    opacity: 0;
    transform: translateX(0px) translateY(0px) rotate(0deg) scale(1);
    background-color: #6366f1;
  }
  100% {
    opacity: 1;
    transform: translateX(0px) translateY(0px) rotate(0deg) scale(1);
    background-color: #6366f1;
  }
}

.animated-element {
  animation: custom-animation 1s ease 1 normal forwards;
}
```

### Architecture Compliance

- **Named export only** — `export const CssAnimationBuilder`
- **Lazy-loaded** — code split via registry
- **100% client-side** — pure CSS generation
- **Dialog pattern** — follows ImageResizer/JsonFormatter
- **ToolComponentProps** — accepts `autoOpen`, `onAfterDialogClose`
- **No debounce** — synchronous CSS generation
- **CopyButton** — on CSS output
- **No new dependencies** — pure string generation

### TOOL_REGISTRY Entry

```typescript
{
  category: 'CSS',
  component: lazy(() =>
    import('@/components/feature/css/CssAnimationBuilder').then(
      ({ CssAnimationBuilder }: { CssAnimationBuilder: ComponentType }) => ({
        default: CssAnimationBuilder,
      }),
    ),
  ),
  description: 'Visually create CSS keyframe animations with live preview and configurable timing',
  emoji: '🎬',
  key: 'css-animation-builder',
  name: 'CSS Animation Builder',
  routePath: '/tools/css-animation-builder',
  seo: {
    description:
      'Build CSS @keyframes animations visually. Define keyframe steps, timing functions, and preview animations in real-time.',
    title: 'CSS Animation Builder - CSR Dev Tools',
  },
}
```

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/css-animation.ts` | NEW | generateAnimationCss(), AnimationConfig, KeyframeStep types |
| `src/utils/css-animation.spec.ts` | NEW | Unit tests (~8 tests) |
| `src/components/feature/css/CssAnimationBuilder.tsx` | NEW | CSS Animation Builder component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'css-animation-builder' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry |
| `src/components/feature/css/index.ts` | MODIFY | Add barrel export |
| `src/utils/index.ts` | MODIFY | Add css-animation barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 20.3]
- [Source: src/components/feature/css/BoxShadowGenerator.tsx] — CSS category component pattern
- [Source: src/components/feature/image/ImageResizer.tsx] — Dialog pattern with ToolComponentProps
- [Source: src/components/feature/data/JsonFormatter.tsx] — Dialog size="screen" pattern
- [Source: src/constants/tool-registry.ts] — Registry entry format
- [Source: MDN — @keyframes, animation shorthand]

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Debug Log References
N/A

### Completion Notes List
- All 8 unit tests pass
- TypeScript clean
- Component follows dialog pattern (like ImageResizer/JavaScriptMinifier)
- Live preview with dynamic style injection and key-based re-trigger

### Change Log
- NEW: `src/utils/css-animation.ts` — KeyframeStep, AnimationConfig types, generateAnimationCss, buildTransformString
- NEW: `src/utils/css-animation.spec.ts` — 8 unit tests
- NEW: `src/components/feature/css/CssAnimationBuilder.tsx` — Dialog-based animation builder
- MOD: `src/types/constants/tool-registry.ts` — Added 'css-animation-builder' to ToolRegistryKey
- MOD: `src/constants/tool-registry.ts` — Added registry entry
- MOD: `src/components/feature/css/index.ts` — Added barrel export
- MOD: `src/utils/index.ts` — Added css-animation barrel export
- MOD: `vite.config.ts` — Added pre-render route
