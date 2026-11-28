#!/usr/bin/env bash
# The TypeScript gates (docs/quality/gates.md → "Required checks", step 7):
# oxlint and oxfmt over each directory that exists, and the npm licence rule.
# A directory with no package.json takes no npm package, which oxlint checks
# with crates/gates/oxlint-no-npm.json. One with a package.json has its own
# packages, and their licences are not fed to the licence check yet, so it
# fails until the PR that adds it does that.
# Usage: crates/gates/scripts/ts-gates.sh [dir…]  (default: crates/bridges/js scripts/dioxus)
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"
[[ $# -gt 0 ]] || set -- crates/bridges/js scripts/dioxus

status=0
for dir in "$@"; do
  [[ -e "$dir" ]] || continue
  config=crates/gates/oxlint-no-npm.json
  if [[ -e "$dir/package.json" ]]; then
    echo "::error file=$dir/package.json::$dir has npm packages: feed \`pnpm licenses list --json --prod\` for it to the licence check (tests/npm_licences.rs)"
    status=1
    config=.oxlintrc.json
  fi
  pnpm exec oxlint -c "$config" --deny-warnings "$dir" || status=1
  pnpm exec oxfmt --check "$dir" || status=1
done
exit $status
