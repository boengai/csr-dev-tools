# Visual Depth Hierarchy

## Target
Establish a layered visual depth system so users can instantly distinguish containers, input areas, and output areas. Users report "not knowing where input is, where result is — it all looks the same."

## Current State
Dialog, Card, input fields, and output areas all share identical styling: `bg-gray-950` background, `border-gray-800` borders, `text-gray-200` content, `text-gray-100` labels. The result is a flat, undifferentiated dark surface where interactive zones are indistinguishable from read-only zones and container chrome.

## Desired State
A 3-tone depth system:
- **Containers** (Dialog/Card) use a lifted surface tone (`gray-900`) so fields feel inset
- **Inputs** have brighter borders (`gray-700`) signaling interactivity
- **Outputs** remain recessive with muted labels (`gray-400`) signaling read-only

Users can identify input vs output areas without reading labels.

## User Journey
1. User opens any tool via sidebar, Cmd+K, or dashboard
2. Dialog opens with a `gray-900` surface — slightly lighter than field wells
3. Input area is visually prominent: brighter border, bright label — "type here"
4. Output area is visually quieter: standard border, muted label — "results here"
5. User immediately orients and begins working

## Success Criteria
- Input area visually distinct from output area without reading labels
- Container edges distinct from field edges
- WCAG contrast ratios maintained (no accessibility regression)
- Consistent across all 80+ tools via shared component changes

## Scope
- **Pages affected**: All tools (via 6 shared components)
- **Components**: Dialog, Card, CodeOutput, TextInput (inputVariants), CodeInput (theme), TextAreaInput (inherits)
- **Data changes**: None
- **Risk level**: Low (visual-only, no behavior changes)
