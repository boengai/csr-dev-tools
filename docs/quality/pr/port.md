<!-- Title: port(<key>): <Tool name>. One Tool only (docs/quality/gates.md → PR kinds). -->

## What

<!-- The Tool, its layout and shell, and the issue this PR is for. -->

## React reference

<!-- The `main` commit compared against, and the React spec files this port mirrors. -->

## Case mapping

<!-- Every case in the Tool's React spec, and the Rust test that covers it. -->

| React case (file › name) | Rust test |
|---|---|
|  |  |

## Rows added

<!-- New rows in the ceiling file, storage.rs and the #38 goldens, and the line removed from the Dioxus spec filter. -->

## Exemptions

<!-- Each new #[expect], with its reason. "None" if there are none. -->

## Automated review

<!-- Each `code-review` finding and its outcome: fixed, or why not. -->

## Hand check

<!-- The maintainer ticks these before merging. Agents never tick them. -->

- [ ] Side by side with `main` in GPU Chrome, at desktop and phone width
- [ ] The golden path and one error case, driven by hand on the preview
- [ ] Feel: motion, focus rings, hover and pressed states, the debounce
- [ ] Every new `#[expect]` reason accepted
- [ ] Every new row (ceilings, storage keys, goldens) accepted
- [ ] The `## Automated review` findings read
- [ ] Read the diff: each new item is one I would have chosen
