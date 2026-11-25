# How stable are Dioxus 0.7 and 0.8?

Research for boengai/csr-dev-tools issue 6. Facts gathered on 2026-11-25 from the GitHub REST and GraphQL APIs (releases, tags, branches, commits, issues, discussions), the crates.io API, docs.rs, dioxuslabs.com, and the `DioxusLabs/docsite` repo that holds the blog's source.

## Answer

- **Latest stable:** `dioxus` 0.7.10, released 2026-07-30. No 0.7 release has followed it.
- **Latest pre-release:** 0.8.0-alpha.3, released 2026-10-16. There has been no beta or RC.
- **Timeline:** the team's own 0.8 roadmap says "We have no official timeline for Dioxus 0.8". For 1.0 it states only a hope to "1.0" a subset of the core.
- **0.7 to 0.8 breaks things:**
  - rewritten template and hydration internals
  - elements moved out of `dioxus_elements`
  - keyboard-types 0.8
  - a CLI that can't run apps older than 0.7.2
  - more crate and env-var renames on `main` that are not released yet
- **Policy:** I found no written semver, MSRV or support-window policy. A `cargo-semver-checks` PR is still open.
- **Patch history:** each old line stopped getting patches within weeks of the next line's first alpha. 0.7 has had one patch since 0.8-alpha.0.
- **Health:** on 2026-09-10 the team joined Cognition and said it would "naturally have less time to devote entirely to Dioxus". Since late August, one maintainer has written 57 of the 71 commits on `main`.

## Findings

### 1. Latest stable and pre-release, with dates

For every release, GitHub `published_at` and crates.io `created_at` fall on the same day, except where the Notes column says otherwise.

| Version | GitHub release | crates.io `dioxus` | Notes |
|---|---|---|---|
| 0.8.0-alpha.3 | 2026-10-16T19:56Z (prerelease) | 2026-10-16T19:45Z | latest pre-release |
| 0.8.0-alpha.2 | 2026-10-14T20:53Z | 2026-10-14T20:41Z | |
| 0.8.0-alpha.1 | 2026-07-31T00:29Z | 2026-07-31T00:13Z | |
| 0.7.10 | 2026-07-30T23:46Z (stable) | 2026-07-30T23:14Z | **latest stable** |
| 0.8.0-alpha.0 | 2026-05-19T19:56Z | 2026-05-19T19:49Z | first 0.8 build |
| 0.7.9 / 0.7.8 | 2026-05-08 / 2026-05-07 | same | |
| 0.7.5 | 2026-04-06 | 2026-04-07T18:21Z | `dioxus-router` 0.7.5 is not on crates.io |
| 0.7.0 | 2025-10-31T04:49Z | 2025-10-31T04:42Z | |
| 0.6.0 | 2024-12-09 | 2024-12-07 | |

Sources: GitHub releases API [1]; crates.io versions of `dioxus` [2], `dioxus-cli` [3] and `dioxus-router` [4].
- docs.rs lists `dioxus 0.7.10` as latest [5].
- The workspace version on `main` is `0.8.0-alpha.3` [6].
- The tag list goes straight from `v0.8.0-alpha.3` back to `v0.7.10`; there is no 0.8 beta or RC tag [7].
- `main` has commits through 2026-11-24, but no release has been cut since alpha.3 [8].

### 2. Breaking changes between 0.7 and 0.8, and timeline

What the release notes say:

- **alpha.0 (2026-05-19).** The notes say: "We've merged a number of breaking changes to internal APIs and slight behavior changes that improve reliability and performance of the CLI and Signals". They do not mark which PRs are the breaking ones. My selection of changes from the changelog that plausibly affect users:
  - `#[non_exhaustive]` on derived props (#5422)
  - const-hash template diffing (#5276)
  - store-derive visibility enforcement (#5425)
  - edition 2024 (#5502)
  - hot-patching on by default (#5506)

  The notes also say the CLI must be installed with `--locked` when built from source [9].
- **alpha.1 (2026-07-31).** "The 0.7 asset format fallback has been removed (#5576). The 0.8 CLI can't run apps built with Dioxus older than 0.7.2." [10]
- **alpha.2 (2026-10-14).** The template and rendering internals were rewritten in #5554, merged 2026-08-20 [11]:
  - "Dioxus no longer uses comment-node placeholders and markers, either at runtime or during hydration."
  - `rsx!` "now expands to a const builder API".
  - Elements are trait-based.
  - Listed as breaking: "HTML elements are no longer namespaced under `dioxus_elements`", so a name can clash with your own items (for example, write `html::main {}`).
  - `libxdo` becomes opt-in on Linux [12].
- **alpha.3 (2026-10-16).**
  - keyboard-types 0.8: `Key::Enter` becomes `Key::Named(NamedKey::Enter)`.
  - `WriteMutations::set_attribute` takes `BorrowedAttributeValue<'_>`.
  - The gloo-net 0.7 `ClientRequest` builder.
  - Assorted desktop, Android and fullstack changes.
  - Known issue: "`dx components` doesn't work in this release" [13].

On `main` but not yet released:
- `dioxus-core` was renamed to `dioxus-vdom` (#6021), and a new `dioxus-core` facade sits under the prelude (#6024).
- The router's dependency on `dioxus-fullstack-core` was inverted (#6022).
- The `dioxus-cli-*` packages were renamed to `dx-*` (#6055).
- The `DIOXUS_*` env vars were renamed to `DX_*` (#6057).
- The `dioxus-base-types` crate was removed (#6054) [8][14].

**Timeline.** The "Dioxus 0.8 Roadmap" discussion (#5024, opened 2025-11-25 by jkelleyrtp) is the only primary statement I found [15]. In it:
- Its timeline section says: "We have no official timeline for Dioxus 0.8."
- It lists as goals "Attempt to “1.0” a subset of Dioxus for library authors, freeing up “Dioxus” versions to update more frequently" and "Extracting our `DX` tool into its own repository". Both are still unchecked.
- It says: "We have a strong desire to “1.0” the core of dioxus ... There are no guarantees here."
- It says 0.8 is "focused primarily on developing **Native APIs, cross-platform compatibility, and squashing bugs**" and that "We have no plans to drastically change state management or fullstack."
- It records that 0.7's "*polishing* ... took nearly 6 months".
- Its last progress comment is dated 2026-01-04.

Other places I checked:
- The blog has no 0.8 or 1.0 post. The newest release post is for 0.7 [16].
- The `0.8.0` milestone has `due_on: 2025-06-30` and 41 open issues, mostly from the 0.6 era. It is a backlog, not a schedule [17].
- The Cognition post names no versions or dates [18].

### 3. Stability, semver and MSRV policy, and how long past lines got patches

**Written policy.** I looked in these places:
- `notes/SECURITY.md` [19]
- `notes/RELEASING.md` [20]
- `notes/FAQ.md`, `notes/CONTRIBUTING.md` and `README.md` [21]
- repository discussions and issue titles searched for "roadmap", "1.0", "MSRV", "semver" and "LTS" [22]
- the 0.8 roadmap [15]

None of them states a semver scope, an MSRV policy or a support window. What they do say:
- SECURITY.md covers only reporting and disclosure.
- RELEASING.md (written as of 2024-12-17) says: "create a new branch for the last version that we backport fixes to ... We generally only create this branch when we're ready to start merging breaking PRs" [20].
- Issue #2378 (2024-04-30), "Dioxus CLI MSRV", asked "What is the MSRV for Dioxus itself? I can't find any information about it". It was closed by #2716, which added an MSRV check to CI [22].

**Semver in practice.** Each 0.x minor breaks APIs, and Cargo treats a 0.x minor bump as breaking. Patch releases on 0.7 also carried features; 0.7.4, for example, added a Kotlin/Java/Swift FFI and iOS widget bundling [23]. Tooling:
- The repo has a `semver: compatible` label [24].
- PR #5828, "Add cargo-semver-checks workflow that classifies PR API changes", by jkelleyrtp (2026-09-12), is still open [25].
- `main.yml` has no semver-checks job [26].

**MSRV in practice.** CI job "Lint | Clippy, fmt, schema, msrv" runs `cargo msrv verify` [26]. The `rust-version` values declared on crates.io are [2][3]:

| Crate and versions | Declared `rust-version` |
|---|---|
| `dioxus` 0.7.0–0.7.2 | 1.80.0 |
| `dioxus` 0.7.3–0.7.10 | 1.83.0 (raised within the 0.7 patch line) |
| `dioxus` 0.8 alphas | 1.85.0 |
| `dioxus-cli` 0.7.10 | 1.82.0 |
| `dioxus-cli` 0.8.0-alpha.1 and later | 1.93.0 |

**How long past lines got patches.** Dates are from crates.io [2][3] and the tags [7].

- **0.5:** released 2024-03-28.
  - Last `dioxus` 0.5.x: 0.5.6 on 2024-07-18, two weeks before 0.6.0-alpha.0 (2024-08-01).
  - Last `dioxus-cli` 0.5.x: 0.5.7 on 2024-09-01, about a month after 0.6-alpha.0.
  - Nothing after 0.6.0 stable (2024-12-07).
- **0.6:** last release 0.6.3 on 2025-02-08.
  - The `v0.6-last` tag points at a commit from 2025-03-04 [7].
  - No 0.6.x release after 0.7.0-alpha.0 (2025-05-14) or after 0.7.0 (2025-10-31).
- **0.7:** released 2025-10-31.
  - 0.7.6 to 0.7.9 shipped between 2026-04-22 and 2026-05-08.
  - 0.7.10 shipped 2026-07-30, ten weeks after 0.8.0-alpha.0, with a single backport (#5720) [27].
  - The `v0.7` branch has had no commit since 2026-07-30 [28].
  - Seven open PRs target `v0.7`, created between 2026-07-16 and 2026-10-30. One of them is a router fix (#5683). Separately, a backport of the Rust 1.99 wasm hot-patch fix (#6011) was closed without being merged [29].
- **Pattern:**
  - Regular patches stop once the next line's alpha starts.
  - No line has received a patch after its successor went stable.
  - 0.7's successor is not stable yet.

### 4. Changes between 0.7 and 0.8 in the features this migration depends on

Method: release notes [9][10][12][13], plus commits on `main` per package path since 2026-05-08, the day 0.7.9 shipped [30].

- **WebAssembly code splitting (`packages/wasm-split`).**
  - Introduced in 0.7.0 ("Code splitting and lazy loading for WebAssembly"; "router-based wasm bundle splitting", #3683) [31].
  - Only 2 commits since 2026-05-08, and both are maintenance: #5843, a wasm-bindgen 0.2.128 hot-patch fix, and #6078, clippy fixes. So the splitter is essentially unchanged between the lines [30].
  - Open bugs [32]:
    - #6090: non-deterministic split modules and hashed names (2026-11-16)
    - #5993: failed chunk requests never settle `LazyLoader` or reach a route error boundary
    - #4769: panic with `codegen-units = 1`
    - #5764: `wasm-split-cli` panic
    - #5768: dropped call-graph edges
    - #5769: truncated data symbol
    - #4631: fullstack + wasm-split hydration
- **Hydration and the web renderer (`packages/web`, `packages/interpreter`).**
  - `packages/web` has 13 commits and `packages/interpreter` has 8 since 2026-05-08. The large one is #5554, markerless hydration. Others are new events (#5570, #5581, #5611), the `set_attribute` signature change (#5945), `tracing-wasm` replaced (#5921) and devtools made optional (#6028) [30].
  - Open regression #6086, opened 2026-11-15: "Hydration registers an element under its last dynamic child's id, so its listeners and attribute updates miss (0.8.0-alpha.3)" [33].
  - Older open hydration issues: #5427 and #5411 [32].
- **Static site generation.**
  - The 0.8 changes are fixes: "Respect https for ssg static routes" (#5553) and "prevent duplicate SSG output on rebuild" (#5702) [9][10].
  - `packages/ssr` has 4 commits: #5493, `initial_*` attributes now render as HTML; #5554; and two renames [30].
  - Open SSG issues [32]:
    - #5760: "`document::Title` renders before `<!DOCTYPE html>` in `dx build --web --ssg --release`" (2026-08-18)
    - #5500: no `<!DOCTYPE html>` for server builds
    - #5050: "Bundling SSG is broken"
    - #3641: extra root elements leak across SSG pages
    - #2919: SSG with pending resources
  - RELEASING.md notes "SSG is flakey and occasionally fails" [20].
- **Router (`packages/router`).**
  - 6 commits: two fixes (#5613, which keeps query and hash on child routes, and #5845, empty query arguments), #5554, and three refactors on `main` (#6021, #6022, #6056) [30].
  - 17 open issues carry the `router` label [34].
- **`dx` CLI (`packages/cli`, renamed to `packages/dx`).**
  - 51 commits under `packages/cli` and 4 under `packages/dx` since 2026-05-08 [30].
  - User-visible changes: hot-patching on by default (alpha.0) [9]; no support for apps older than 0.7.2 (alpha.1) [10]; MSRV 1.93 [3]; `dx components` broken in alpha.3 [13]; `dx-*` package and `DX_*` env-var renames, which are unreleased [14].
  - The roadmap plans to move `dx` into its own repository [15].
  - 71 open issues carry the `cli` label [34].
- **`dioxus-primitives`.**
  - Not really published on crates.io; the only version there is a `0.0.0` placeholder from 2025-04-13 [35].
  - The source lives in `DioxusLabs/components`. On `main`, `primitives/Cargo.toml` declares `version = "0.0.1"` and `rust-version = "1.80.0"`, and the repo has no releases or tags [36].
  - The 0.8.0-alpha.3 notes say `dx components add` takes the crate "from the components repo's default branch, which still targets Dioxus 0.7". The workaround they give is a git dependency on the `0.8` branch [13].
  - So on either line it is an unversioned git dependency.

### 5. Health signals

- **Cadence:**
  - Minor releases: 0.5 on 2024-03-28, 0.6 on 2024-12-07 and 0.7 on 2025-10-31, so 8 to 11 months apart.
  - 0.7 has had 10 patch releases in 13 months.
  - 0.8 alphas: 2026-05-19, 2026-07-31, 2026-10-14 and 2026-10-16 [1][2].
- **Team and funding:**
  - The README describes "a small team of fulltime engineers" funded by "FutureWei, Satellite.im, the GitHub Accelerator program" [21].
  - The blog post "Dioxus Labs is joining Cognition" (2026-09-10) says:
    - "By joining Cognition, we will naturally have less time to devote entirely to Dioxus."
    - "Our lead engineer on Blitz, Nico Burns, will be devoted full time to maintaining and improving Dioxus."
    - "Going forward, we will be investing heavily in Dioxus-Native and Blitz, our native HTML/CSS renderer."
    - "Collectively we raised $3.5M in venture funding."

    It lists Y Combinator, Khosla Ventures and Futurewei as backers [18].
  - Sponsorship channels: GitHub Sponsors and Open Collective [37].
- **Who is committing:**
  - Since 2026-08-25, `main` has 71 commits, 57 of them by nicoburns.
  - Most recent commit on `main` by each core maintainer: jkelleyrtp 2026-08-19, ealmloff 2026-09-03, nicoburns 2026-11-24.
  - From 2026-02-25 to 2026-05-25 the leading authors were jkelleyrtp (33), ealmloff (11) and nicoburns (5) [8][38].
- **Open issues (2026-11-25):**
  - 680 open issues and 260 open PRs across the repo.
  - By label: `web` 7 (2 of them also `bug`), `cli` 71, `fullstack` 22, `router` 17, `ssg` 1, `static-generation` 2, `breaking` 10.
  - Labels are applied sparsely. No issue opened since 2026-08-01 carries `web`, yet keyword search finds 16 open "hydration" issues and 14 open "wasm-split" issues. The label counts therefore understate web-target issues [34].
  - The repo has 39,911 stars [39].
- **Docs:**
  - dioxuslabs.com serves `/learn/0.7/` and `/learn/0.6/`. `/learn/0.8/` returns 404 [40].
  - The README still sends readers to the "0.6 branch" for examples that match the latest stable [21].

## Not verified

- **0.7 blog post date.** The blog's `SUMMARY.md` dates the 0.7 post "Sep 8, 2025", but the 0.7.0 tag and release are dated 2025-10-31 [41]. I did not work out why they differ. The release date used throughout is the tag and crates.io date.
- **Further 0.7 releases.** No public statement says whether the seven open `v0.7` PRs will be merged or a 0.7.11 shipped.
- **Pre-stable API freeze for 0.8.** I found no statement either way.
- **`dioxus-primitives` against 0.7.10.** I did not check whether the components repo's `main` builds against exactly 0.7.10; its manifest uses `dioxus.workspace = true`, and I did not read the workspace root.
- **Maintainer activity.** jkelleyrtp's and ealmloff's work outside `main`, such as other repos and reviews, was not measured. A last commit on `main` does not mean someone has left.
- **Scope of #6086.** I did not test whether the hydration regression affects client-only or SSG-only builds without a fullstack server.
- **Roadmap comments.** Only comments by maintainers, or comments containing timeline keywords, were read in discussion #5024 (7 comments in total).

## Implications for this migration

- **Building on 0.7.10.** It is a stable line, but going by 0.5 and 0.6 it will get at most occasional backports, and probably none once 0.8 is stable. The port to 0.8 is then unavoidable and touches:
  - the element namespace
  - keyboard types
  - hydration internals
  - crate and env-var renames
- **Building on a 0.8 alpha** means accepting:
  - API churn that is still landing on `main`
  - a broken `dx components`
  - an open hydration regression
  - no 0.8 docs
  - no target date for stable
- **Features the migration depends on.** wasm-split, SSG and `dioxus-primitives` have open bugs, or have no crates.io release, on **both** lines. wasm-split is nearly unchanged between them. The spike should test these directly rather than expect either version to settle them.
- **Maintenance capacity.** The team has said it will have less time for Dioxus and will invest in Native/Blitz, and most current commits come from one person. That bears on how fast web-target bugs get fixed.

## Sources

1. GitHub releases: https://github.com/DioxusLabs/dioxus/releases (API: https://api.github.com/repos/DioxusLabs/dioxus/releases)
2. https://crates.io/crates/dioxus/versions (API: https://crates.io/api/v1/crates/dioxus/versions)
3. https://crates.io/crates/dioxus-cli/versions
4. https://crates.io/crates/dioxus-router/versions
5. https://docs.rs/crate/dioxus/latest
6. https://github.com/DioxusLabs/dioxus/blob/main/Cargo.toml
7. https://github.com/DioxusLabs/dioxus/tags, https://github.com/DioxusLabs/dioxus/branches/all, https://github.com/DioxusLabs/dioxus/tree/v0.6-last
8. https://github.com/DioxusLabs/dioxus/commits/main
9. https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.0
10. https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.1
11. https://github.com/DioxusLabs/dioxus/pull/5554
12. https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.2
13. https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.3
14. https://github.com/DioxusLabs/dioxus/pull/6021, /pull/6022, /pull/6024, /pull/6054, /pull/6055, /pull/6057
15. "Dioxus 0.8 Roadmap" discussion: https://github.com/DioxusLabs/dioxus/discussions/5024
16. https://dioxuslabs.com/blog
17. https://github.com/DioxusLabs/dioxus/milestones?state=all
18. https://dioxuslabs.com/blog/joining-cognition (source: https://github.com/DioxusLabs/docsite/blob/main/docs-src/blog/src/joining-cognition.md)
19. https://github.com/DioxusLabs/dioxus/blob/main/notes/SECURITY.md
20. https://github.com/DioxusLabs/dioxus/blob/main/notes/RELEASING.md
21. https://github.com/DioxusLabs/dioxus/blob/main/README.md, https://github.com/DioxusLabs/dioxus/blob/main/notes/FAQ.md, https://github.com/DioxusLabs/dioxus/blob/main/notes/CONTRIBUTING.md
22. Discussion and issue searches: https://github.com/DioxusLabs/dioxus/discussions?discussions_q=roadmap; https://github.com/DioxusLabs/dioxus/issues/2378; https://github.com/DioxusLabs/dioxus/pull/2716
23. https://github.com/DioxusLabs/dioxus/releases/tag/v0.7.4
24. https://github.com/DioxusLabs/dioxus/labels
25. https://github.com/DioxusLabs/dioxus/pull/5828
26. https://github.com/DioxusLabs/dioxus/blob/main/.github/workflows/main.yml
27. https://github.com/DioxusLabs/dioxus/releases/tag/v0.7.10
28. https://github.com/DioxusLabs/dioxus/commits/v0.7
29. https://github.com/DioxusLabs/dioxus/pulls?q=is%3Apr+base%3Av0.7
30. Per-path history, e.g. https://github.com/DioxusLabs/dioxus/commits/main/packages/wasm-split (and likewise `packages/web`, `packages/interpreter`, `packages/ssr`, `packages/router`, `packages/cli`, `packages/dx`)
31. https://github.com/DioxusLabs/dioxus/releases/tag/v0.7.0
32. https://github.com/DioxusLabs/dioxus/issues/ + 6090, 5993, 4769, 5764, 5768, 5769, 4631, 5427, 5411, 5760, 5500, 5050, 3641, 2919
33. https://github.com/DioxusLabs/dioxus/issues/6086
34. Issue searches, e.g. https://github.com/DioxusLabs/dioxus/issues?q=is%3Aissue+is%3Aopen+label%3Aweb (same pattern for `cli`, `router`, `fullstack`, `ssg`, `static-generation`, `breaking`, plus keywords `hydration`, `wasm-split`)
35. https://crates.io/crates/dioxus-primitives
36. https://github.com/DioxusLabs/components, https://github.com/DioxusLabs/components/blob/main/primitives/Cargo.toml, https://github.com/DioxusLabs/components/tree/0.8
37. https://github.com/DioxusLabs/dioxus/blob/main/.github/FUNDING.yml
38. https://github.com/DioxusLabs/dioxus/commits/main?author=nicoburns (and `?author=jkelleyrtp`, `?author=ealmloff`)
39. https://github.com/DioxusLabs/dioxus
40. https://dioxuslabs.com/learn/0.7/, https://dioxuslabs.com/learn/0.6/, https://dioxuslabs.com/learn/0.8/ (404)
41. https://github.com/DioxusLabs/docsite/blob/main/docs-src/blog/src/SUMMARY.md
