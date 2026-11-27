#!/usr/bin/env bash
# Prints the gated packages (ADR-0036 §1), one per line: every member under
# crates/ except the gates crate's fixtures, and each wasm/crates wrapper that
# depends on a logic crate. Mirrors `Workspace::gated` in src/workspace.rs.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cargo metadata --no-deps --offline --format-version 1 --manifest-path "$ROOT/Cargo.toml" |
  jq -r --arg root "$ROOT/" '
    .workspace_members as $members
    | .packages[]
    | select(.id as $id | $members | index($id))
    | (.manifest_path | ltrimstr($root)) as $manifest
    | select(
        ($manifest | startswith("crates/") and (startswith("crates/gates/fixtures/") | not))
        or ($manifest | startswith("wasm/crates/")) and any(.dependencies[]; .name | startswith("logic-"))
      )
    | .name' | sort
