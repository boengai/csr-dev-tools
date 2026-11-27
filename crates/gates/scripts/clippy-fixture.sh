#!/usr/bin/env bash
# Proves the denied lints and banned methods fire (ADR-0036 §8): Clippy must
# fail on the fixture crate, and every line of expected.txt must appear in
# its output. Usage: crates/gates/scripts/clippy-fixture.sh
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"
FIXTURE="$ROOT/crates/gates/fixtures/clippy"
OUT="$(mktemp)"

cargo clippy -p gates-fixture-clippy --target wasm32-unknown-unknown \
  --message-format=json -- -D warnings >"$OUT.json" 2>"$OUT.err"
status=$?
jq -r 'select(.reason == "compiler-message") | (.message.code.code // "") + " " + .message.message' \
  "$OUT.json" >"$OUT"
cat "$OUT.err" >>"$OUT"

if [[ $status -eq 0 ]]; then
  echo "::error::the Clippy fixture passed; every denied lint should fail it" >&2
  exit 1
fi

missing=0
while IFS= read -r line; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  if ! grep -qF -- "$line" "$OUT"; then
    echo "::error::the Clippy fixture did not report: $line" >&2
    missing=1
  fi
done <"$FIXTURE/expected.txt"

[[ $missing -eq 0 ]] && echo "Clippy fixture: every expected lint and banned method fired."
exit $missing
