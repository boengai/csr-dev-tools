#!/bin/sh
# Static check behind the write-up's claim: neither shipped JS file calls
# eval or new Function. Run from the repo root after `pnpm build` and
# build-wasm.sh. Prints a count per file (0 = none).
H=docs/research/tract-bg-removal-trial/harness
for f in dist/assets/background-removal.worker-*.js "$H/pkg/tract_trial.js"; do
  printf '%s: ' "$f"
  grep -Eo '(^|[^A-Za-z0-9_$.])eval\(|new Function\(|[^A-Za-z0-9_$]Function\(' "$f" | wc -l | tr -d ' '
done
