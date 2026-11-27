<!-- Title: gates: <what changes in what CI accepts>. Gate files only (docs/quality/gates.md → PR kinds). -->

## What

<!-- The gate that changes, and what it accepts or rejects afterwards. -->

## Why

<!-- The PR or issue that hit it, or the decision that asks for it. For a new crate: what it is for, its licence, its last release, and its brotli byte cost from a scratch build. -->

## Proof it fires

<!-- The must-fail fixture added or changed, and its failing output. -->

## Automated review

<!-- Each `code-review` finding and its outcome: fixed, or why not. -->

## Hand check

<!-- The maintainer ticks these before merging. Agents never tick them. -->

- [ ] The change makes the gate no weaker than the reason above needs
- [ ] Read the diff: each change is one I would have chosen
