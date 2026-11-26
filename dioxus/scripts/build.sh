#!/usr/bin/env bash
# Builds the Dioxus spike into dioxus/dist, ready to serve or deploy.
#
#   dioxus/scripts/build.sh [--no-split] [--no-emoji] [--features <list>] [--preload <mode>] [--preload-via <how>] [--out <dir>]
#
#   --no-split   one WebAssembly module instead of one per route
#   --no-emoji   drop the Noto emoji images, for budget runs (docs/perf/budgets.md)
#   --features   extra cargo features, comma-separated (e.g. native-select)
#   --preload    how tool pages preload WebAssembly: auto, all, main, low or none
#                (stamp.ts; the default is the remedy the spike adopted)
#   --preload-via  how the download starts early: inline, script or link
#                (stamp.ts; link downloads every module twice in WebKit, issue 35)
#   --out        output directory (default dioxus/dist)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/dioxus/app"
OUT="$ROOT/dioxus/dist"
SPLIT=1
EMOJI=1
EXTRA=""
PRELOAD="auto"
PRELOAD_VIA="inline"
while [ $# -gt 0 ]; do
  case "$1" in
    --no-split) SPLIT=0 ;;
    --no-emoji) EMOJI=0 ;;
    --features) EXTRA=",$2"; shift ;;
    --preload) PRELOAD="$2"; shift ;;
    --preload-via) PRELOAD_VIA="$2"; shift ;;
    # Resolved from the caller's directory, before the `cd` below.
    --out) OUT="$(mkdir -p "$2" && cd "$2" && pwd)"; shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
  shift
done
case "$PRELOAD" in auto|all|main|low|none) ;; *) echo "unknown --preload $PRELOAD" >&2; exit 2 ;; esac
case "$PRELOAD_VIA" in inline|script|link) ;; *) echo "unknown --preload-via $PRELOAD_VIA" >&2; exit 2 ;; esac
DX="${DX:-dx}"

cd "$ROOT"
node dioxus/scripts/tool-meta.ts
node dioxus/scripts/template.ts
pnpm exec vite build --config dioxus/js/vite.config.ts --logLevel warn
pnpm exec tailwindcss -i "$APP/style/tailwind.css" -o "$APP/assets/generated/tailwind.css" --minify

FEATURES="web"
[ "$EMOJI" = 1 ] && FEATURES="$FEATURES,emoji"
[ "$SPLIT" = 1 ] && FEATURES="$FEATURES,split"
FEATURES="$FEATURES$EXTRA"
ARGS=(build --release --platform web --debug-symbols false --no-default-features --features "$FEATURES")
[ "$SPLIT" = 1 ] && ARGS+=(--wasm-split)

PUBLIC="$ROOT/dioxus/target/dx/csr-dev-tools-dioxus/release/web/public"
# Old hashed files stay in dx's output otherwise.
rm -rf "$PUBLIC"
(cd "$APP" && "$DX" "${ARGS[@]}")

# A wasm-opt failure exits 0 and ships unoptimised wasm with DWARF (hazards doc).
# `grep -c` reads all its input: `grep -q` would SIGPIPE `strings` under pipefail
# and turn a match into a failed condition.
for wasm in "$PUBLIC"/assets/*.wasm; do
  if [ "$(strings "$wasm" | grep -c -E '\.debug_(info|line|abbrev)' || true)" != 0 ]; then
    echo "[build] $wasm still has debug info: wasm-opt did not run" >&2
    exit 1
  fi
done

rm -rf "$OUT"
mkdir -p "$OUT"
# The React site's static files (favicon, manifest, robots, _headers with the
# /assets/* cache rule and the CSP). There is no public/index.html to collide.
cp -R "$ROOT/public/." "$OUT/"
cp -R "$PUBLIC/." "$OUT/"
if [ "$PRELOAD" = none ]; then
  node dioxus/scripts/stamp.ts "$OUT" --no-preload
else
  node dioxus/scripts/stamp.ts "$OUT" "--preload-wasm=$PRELOAD" "--preload-via=$PRELOAD_VIA"
fi
MAIN_WASM="$(ls "$OUT"/assets/csr-dev-tools-dioxus_bg-*.wasm)"
echo "[build] main wasm: $(wc -c < "$MAIN_WASM" | tr -d ' ') bytes uncompressed"
