# `crates/workers`

Worker crates, `worker-<name>`: separate wasm-bindgen packages, never a dependency of `app` (ADR-0035 §2).

This file must stay. The root `Cargo.toml` lists `crates/workers/*` as members, and cargo rejects a member glob that matches nothing; this file is the match while the directory holds no crate, and cargo skips it because it is not a directory.
