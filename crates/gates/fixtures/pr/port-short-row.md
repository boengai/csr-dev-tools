## What

Ports the Hash Generator, a transformer Tool.

## React reference

main at db2915ef, src/utils/hash.spec.ts.

## Case mapping

| React case (file › name) | Rust test |
|---|---|
| hash.spec.ts › md5 of empty |

## Rows added

Ceiling rows for hash_generator.

## Exemptions

None.

## Automated review

- Restated comment in lib.rs: fixed.

## Hand check

- [x] Side by side with `main` in GPU Chrome, at desktop and phone width
- [X] The golden path and one error case, driven by hand on the preview
- [x] Feel: motion, focus rings, hover and pressed states, the debounce
- [x] Every new `#[expect]` reason accepted
- [x] Every new row (ceilings, storage keys, goldens) accepted
- [x] The `## Automated review` findings read
- [x] Read the diff: each new item is one I would have chosen
