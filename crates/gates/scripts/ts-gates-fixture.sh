#!/usr/bin/env bash
# Proves the TypeScript gates fire: ts-gates.sh must fail on the fixture
# directory, through the npm import ban (by name, by path and by an
# unreadable import()) and through oxfmt.
# Usage: crates/gates/scripts/ts-gates-fixture.sh
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"
output=$("$ROOT/crates/gates/scripts/ts-gates.sh" crates/gates/fixtures/ts 2>&1)
status=$?
echo "$output"

if [[ $status -eq 0 ]]; then
  echo "::error::the TypeScript gates passed their fixture; they should fail it" >&2
  exit 1
fi
missing=0
for expected in "'left-pad' import is restricted" "node_modules/right-pad/index.js' import is restricted" "no-dynamic-require" "crates/gates/fixtures/ts/unformatted.ts"; do
  if ! grep -qF -- "$expected" <<<"$output"; then
    echo "::error::the TypeScript gates did not report: $expected" >&2
    missing=1
  fi
done
[[ $missing -eq 0 ]] && echo "TypeScript gates fixture: the import ban and oxfmt all fired."
exit $missing
