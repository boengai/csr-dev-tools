#!/usr/bin/env bash
# Builds a checkout's Dioxus app into <out>: dx's release web build, with
# wasm-split, so each Tool's loader emits its own module (ADR-0035 §7).
# Usage: crates/gates/scripts/build-dioxus.sh <checkout> <out>
# dx keeps old files in its output, so the output is emptied first.
set -euo pipefail

checkout="$(cd "$1" && pwd)"
out="$2"
public="${CARGO_TARGET_DIR:-$checkout/target}/dx/app/release/web/public"

rm -rf "$public" "$out"
(cd "$checkout/crates/app" && dx build --release --platform web --package app --wasm-split)
cp -R "$public" "$out"
