<!-- Title: split(<crate>): move <crate>'s logic into logic-<name>. No Dioxus Tool (docs/quality/gates.md → PR kinds). -->

## What

<!-- The crate, and the Tool or worker whose port needs it. -->

## What changed besides the move

<!-- Files were moved with `git mv`. List every real change: unwraps removed, clippy --fix, API types. -->

## Proof

<!-- React's tests and the crate's native tests, both passing. -->

## Whole-crate mutation report

<!-- The one-off cargo-mutants run over the whole crate, and the follow-up issue for its gaps. -->

## Exemptions

<!-- Each new #[expect], with its reason. "None" if there are none. -->

## Automated review

<!-- Each `code-review` finding and its outcome: fixed, or why not. -->

## Hand check

<!-- The maintainer ticks these before merging. Agents never tick them. -->

- [ ] The wrapper's package name and exports are unchanged for React
- [ ] Every new `#[expect]` reason accepted
- [ ] The `## Automated review` findings read
- [ ] Read the diff: each real change is one I would have chosen
