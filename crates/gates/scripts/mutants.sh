#!/usr/bin/env bash
# cargo-mutants on the lines this PR changed (ADR-0036 §9): each changed logic
# crate and `persist`, against the merge base, with a rename-aware diff so a
# `git mv` is not judged as new code. No mutant may survive.
# Usage: crates/gates/scripts/mutants.sh <merge-base> <pr-head>
set -euo pipefail

BASE="$1"
HEAD_REF="$2"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

dirs=$(git diff -M --name-only "$BASE" "$HEAD_REF" -- crates/logic crates/persist |
  awk -F/ '$2 == "persist" { print "crates/persist"; next } { print $1 "/" $2 "/" $3 }' | sort -u)

if [[ -z "$dirs" ]]; then
  echo "No logic crate or persist changed: no mutants to run."
  exit 0
fi

for dir in $dirs; do
  [[ -f "$dir/Cargo.toml" ]] || continue # the crate was deleted
  package=$(cargo metadata --no-deps --offline --format-version 1 --manifest-path "$dir/Cargo.toml" |
    jq -r --arg manifest "$ROOT/$dir/Cargo.toml" '.packages[] | select(.manifest_path == $manifest) | .name')
  diff_file="$(mktemp)"
  git diff -M "$BASE" "$HEAD_REF" -- "$dir" >"$diff_file"
  echo "Mutating the changed lines of $package"
  cargo mutants -p "$package" --in-diff "$diff_file" --no-shuffle
done
