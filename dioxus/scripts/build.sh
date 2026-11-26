#!/usr/bin/env bash
# Builds the Dioxus spike into dioxus/dist, ready to serve or deploy.
#
#   dioxus/scripts/build.sh [--no-split] [--no-emoji] [--out <dir>]
#
#   --no-split   one WebAssembly module instead of one per route
#   --no-emoji   drop the Noto emoji images, for budget runs (docs/perf/budgets.md)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/dioxus/app"
OUT="$ROOT/dioxus/dist"
SPLIT=1
EMOJI=1
while [ $# -gt 0 ]; do
  case "$1" in
    --no-split) SPLIT=0 ;;
    --no-emoji) EMOJI=0 ;;
    --out) OUT="$2"; shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
  shift
done
DX="${DX:-dx}"

cd "$ROOT"
node dioxus/scripts/tool-meta.ts
node dioxus/scripts/template.ts
pnpm exec vite build --config dioxus/js/vite.config.ts --logLevel warn
pnpm exec tailwindcss -i "$APP/style/tailwind.css" -o "$APP/assets/generated/tailwind.css" --minify

FEATURES="web"
[ "$EMOJI" = 1 ] && FEATURES="$FEATURES,emoji"
ARGS=(build --release --platform web --debug-symbols false --no-default-features --features "$FEATURES")
[ "$SPLIT" = 1 ] && ARGS=(build --release --platform web --debug-symbols false --wasm-split --no-default-features --features "$FEATURES,split")

PUBLIC="$ROOT/dioxus/target/dx/csr-dev-tools-dioxus/release/web/public"
# Old hashed files stay in dx's output otherwise.
rm -rf "$PUBLIC"
(cd "$APP" && "$DX" "${ARGS[@]}")

# wasm-opt failures exit 0 and ship unoptimised wasm with DWARF (hazards doc).
MAIN_WASM="$(ls "$PUBLIC"/assets/csr-dev-tools-dioxus_bg-*.wasm)"
if strings "$MAIN_WASM" | grep -q -E '^\.debug_(info|line)$|debug_info'; then
  echo "[build] $MAIN_WASM still has debug info: wasm-opt did not run" >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"
# The React site's static files (favicon, manifest, robots, _headers with the
# /assets/* cache rule and the CSP). There is no public/index.html to collide.
cp -R "$ROOT/public/." "$OUT/"
cp -R "$PUBLIC/." "$OUT/"
node dioxus/scripts/stamp.ts "$OUT"
echo "[build] main wasm: $(wc -c < "$MAIN_WASM" | tr -d ' ') bytes uncompressed"
