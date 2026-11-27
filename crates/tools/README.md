# `crates/tools`

Tool crates, `tool-<key>`: one per Tool, named by its key, holding one Tool entry and glue only (ADR-0035 §4 and §7).

This file must stay. The root `Cargo.toml` lists `crates/tools/*` as members, and cargo rejects a member glob that matches nothing; this file is the match while the directory holds no crate, and cargo skips it because it is not a directory.
