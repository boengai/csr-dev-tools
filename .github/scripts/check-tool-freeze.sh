#!/usr/bin/env bash
# Fails when the set of tool keys differs from <base-ref>. `main` takes bug
# fixes only until the Dioxus cutover (CONTRIBUTING.md -> "Branches").
# Usage: check-tool-freeze.sh <base-ref>
set -euo pipefail

BASE_REF="${1:?usage: check-tool-freeze.sh <base-ref>}"
ROUTES="src/constants/tool-routes.ts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

keys() {
  # Node strips the types; tool-routes.ts has no runtime imports.
  node --input-type=module -e '
    const { TOOL_ROUTES } = await import(process.argv[1])
    if (!TOOL_ROUTES.length) throw new Error("no tools found")
    console.log(TOOL_ROUTES.map((route) => route.key).sort().join("\n"))
  ' "$1"
}

git show "$BASE_REF:$ROUTES" > "$TMP/base.ts"
cp "$ROUTES" "$TMP/head.ts"
keys "$TMP/base.ts" > "$TMP/base.txt"
keys "$TMP/head.ts" > "$TMP/head.txt"

if ! diff -u --label "$BASE_REF" --label head "$TMP/base.txt" "$TMP/head.txt"; then
  echo "error: main is frozen: the set of tool keys cannot change here" >&2
  exit 1
fi
echo "Tool keys unchanged ($(wc -l < "$TMP/head.txt" | tr -d ' '))."
