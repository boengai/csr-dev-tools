#!/bin/sh
# Build the tract candidate for the browser: release (opt-level 3), +simd128,
# wasm-bindgen 0.2.130 (--target web), then wasm-opt -Oz (the judged build)
# and -O3 (reported). Run from the repo root.
set -eu
H=docs/research/tract-bg-removal-trial/harness
WB=${WASM_BINDGEN:-wasm-bindgen}
RUSTFLAGS="-C target-feature=+simd128" cargo build --release --lib \
  --target wasm32-unknown-unknown --manifest-path "$H/tract-trial/Cargo.toml"
rm -rf "$H/pkg"
"$WB" --target web --out-dir "$H/pkg" \
  "$H/tract-trial/target/wasm32-unknown-unknown/release/tract_trial.wasm"
FEATURES="--enable-simd --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext --enable-mutable-globals --enable-reference-types --enable-multivalue"
cp "$H/pkg/tract_trial_bg.wasm" "$H/pkg/raw.wasm"
wasm-opt -Oz $FEATURES "$H/pkg/raw.wasm" -o "$H/pkg/oz.wasm"
wasm-opt -O3 $FEATURES "$H/pkg/raw.wasm" -o "$H/pkg/o3.wasm"
ls -l "$H/pkg"
