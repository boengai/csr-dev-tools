# Comparator

Two inputs in, their difference out. Built from `ComparatorShell`
(`src/components/common/comparator/`).

```
┌ JSON Diff Checker ───────────────────────────────────────────── [×] ┐
│ Status  ⚠ Invalid JSON in Original: unexpected token at 1:2           │
├───────────────────────────────┬──────────────────────────────────────┤
│ Original                      │ Modified                             │
│ {"a":1}                       │ {"a":2}                              │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┴╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ Diff Output                                                     [⧉]  │
│  1 - "a": 1                     │  1 + "a": 2                         │
└──────────────────────────────────────────────────────────────────────┘
```

On a Comparator the work area is the two inputs stacked above the diff.
The status slot still sits above all of it.

## Journey

```mermaid
journey
  title Compare two inputs
  section Open
    Click the tile: 5: User
    Placeholder says to paste into both sides: 4: Shell
  section Compare
    Paste Original and Modified: 5: User
    Diff updates as you type (300 ms): 5: Shell
  section Bad input
    One side becomes invalid: 2: User
    Status slot shows which side and why; diff clears: 4: Shell
  section Leave
    Copy the unified diff: 5: User
    Closing (dialog or page) clears both sides: 4: User
```

## Tools

On the shell: Text Diff, JSON Diff.
