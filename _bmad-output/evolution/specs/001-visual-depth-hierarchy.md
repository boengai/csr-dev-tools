# Visual Depth Hierarchy — Update Specification

## Change Summary
Introduce a 3-tone visual depth system across all tools by raising container backgrounds from `gray-950` to `gray-900`, brightening input borders from `gray-800` to `gray-700`, and muting output labels from `gray-100` to `gray-400`. This creates layered depth where containers recede, inputs invite interaction, and outputs read as passive/read-only.

## Before
| Layer | Background | Border | Label |
|-------|-----------|--------|-------|
| Dialog/Card | `gray-950` | `gray-800` | — |
| Input | `gray-950` | `gray-800` | `gray-100` |
| Output | `gray-950` | `gray-800` | `gray-100` |

## After
| Layer | Background | Border | Label |
|-------|-----------|--------|-------|
| Dialog/Card | `gray-900` | `gray-800` | — |
| Input | `gray-950` | `gray-700` | `gray-100` |
| Output | `gray-950` | `gray-800` | `gray-400` |

## Components

### 1. Dialog (`src/components/common/dialog/Dialog.tsx`)
- Content container: `bg-gray-950` -> `bg-gray-900`
- No other changes

### 2. Card (`src/components/common/card/Card.tsx`)
- Article element: `bg-gray-950` -> `bg-gray-900`
- No other changes

### 3. TextInput (`src/components/common/input/TextInput.tsx`)
- `inputVariants` base: `border-gray-800` -> `border-gray-700`
- TextAreaInput inherits this change automatically

### 4. CodeInput (`src/components/common/input/CodeInput.tsx`)
- `codeInputBaseTheme` `'&'` border: `var(--color-gray-800)` -> `var(--color-gray-700)`
- Editor background stays `gray-950` (inset into container)

### 5. CodeOutput (`src/components/common/output/CodeOutput.tsx`)
- Label: `text-gray-100` -> `text-gray-400`
- Border stays `gray-800` (quieter than input)
- Background stays `gray-950`

### 6. FieldForm (`src/components/common/form/FieldForm.tsx`)
- Label stays `text-gray-100` (input labels remain bright)
- No changes needed

## Responsive Behavior
No layout changes — color shifts only. Works identically across mobile, tablet, and desktop breakpoints.

## Acceptance Criteria
- [x] Dialog/Card containers visually distinct from input/output fields (background contrast)
- [x] Input fields have brighter borders than output areas
- [x] Input labels brighter than output labels
- [x] Focus ring on inputs still clearly visible against new container background
- [x] No WCAG AA contrast ratio regressions
- [x] Dashboard cards on home page reflect same depth treatment
- [x] All 80+ tools inherit changes without per-tool modifications
