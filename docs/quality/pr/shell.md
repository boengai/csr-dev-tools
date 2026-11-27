<!-- Title: shell(<layout>): <Shell name>. One shell, plus its first Tool as proof (docs/quality/gates.md → PR kinds). -->

## What

<!-- The shell, the layout contract it implements (docs/ux/<layout>.md), and the proof Tool. -->

## Shell API

<!-- The props a Tool hands the shell, and why each one exists. -->

## React reference

<!-- The `main` commit compared against, and the React spec files the proof Tool mirrors. -->

## Case mapping

<!-- Every case in the proof Tool's React spec, and the Rust test that covers it. -->

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
- [ ] The shell API holds nothing that only the proof Tool needs
- [ ] Every new `#[expect]` reason accepted
- [ ] Read the diff: each new item is one I would have chosen
