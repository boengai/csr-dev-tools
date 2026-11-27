#!/usr/bin/env bash
# cargo-mutants on the lines this PR changed (ADR-0036 §9): each changed logic
# crate and `persist`, against the merge base. The diff is rename-aware and
# taken over the whole tree before any path filter, because git matches a
# rename only when both sides are in the diff: a `git mv` out of wasm/ must
# read as a move, not as new code.
# Usage: crates/gates/scripts/mutants.sh <merge-base> <pr-head>
set -euo pipefail

BASE="$1"
HEAD_REF="$2"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

diff_file="$(mktemp)"
git diff -M "$BASE" "$HEAD_REF" >"$diff_file"

dirs=$(git diff -M --name-only "$BASE" "$HEAD_REF" |
  awk -F/ '$1 == "crates" && $2 == "persist" { print "crates/persist" }
           $1 == "crates" && $2 == "logic" && NF > 3 { print $1 "/" $2 "/" $3 }' | sort -u)

if [[ -z "$dirs" ]]; then
  echo "No logic crate or persist changed: no mutants to run."
  exit 0
fi

for dir in $dirs; do
  [[ -f "$dir/Cargo.toml" ]] || continue # the crate was deleted
  package=$(cargo metadata --no-deps --offline --format-version 1 --manifest-path "$dir/Cargo.toml" |
    jq -r --arg manifest "$ROOT/$dir/Cargo.toml" '.packages[] | select(.manifest_path == $manifest) | .name')
  echo "Mutating the changed lines of $package"
  cargo mutants -p "$package" --in-diff "$diff_file" --no-shuffle
done
