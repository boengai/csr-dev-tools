# `crates/logic`

Logic crates, `logic-<name>`: pure Rust with native tests, no browser crates (ADR-0035 §2 and §5).

This file must stay. The root `Cargo.toml` lists `crates/logic/*` as members, and cargo rejects a member glob that matches nothing; this file is the match while the directory holds no crate, and cargo skips it because it is not a directory.
