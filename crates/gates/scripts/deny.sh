#!/usr/bin/env bash
# cargo-deny over app's tree and each worker's tree (deny.toml says why).
# Usage: crates/gates/scripts/deny.sh [manifest ...]
# With no arguments it checks crates/app and crates/workers/*, whichever
# exist, and the gates crate, so the config is exercised before they do.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [[ $# -gt 0 ]]; then
  manifests=("$@")
else
  manifests=(crates/gates/Cargo.toml)
  [[ -f crates/app/Cargo.toml ]] && manifests+=(crates/app/Cargo.toml)
  for worker in crates/workers/*/Cargo.toml; do
    [[ -f "$worker" ]] && manifests+=("$worker")
  done
fi

for manifest in "${manifests[@]}"; do
  echo "cargo deny over $(dirname "$manifest")"
  case "$manifest" in
    crates/app/*) cargo deny --manifest-path "$manifest" check -W unmaintained ;;
    *) cargo deny --manifest-path "$manifest" check -W unmaintained -W duplicate ;;
  esac
done
