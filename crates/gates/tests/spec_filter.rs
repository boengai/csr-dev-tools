//! The Dioxus spec filter's `PORTED` equals `app`'s ported-Tool list, so no
//! ported Tool skips its parity checks (`docs/quality/gates.md` → "Manifests").
//!
//! `GATES_SPEC_FILTER` is a file holding `PORTED` as JSON, printed by
//! `scripts/spec-filter.mjs`, which lets Node evaluate the TypeScript. It is
//! `#[ignore]`d so a plain `cargo test` skips it; a missing variable fails.

use std::path::Path;

use gates::registry::{check_spec_filter, parse_spec_filter};

#[test]
#[ignore = "CI runs it with the filter Node printed"]
fn spec_filter() {
    let path = std::env::var("GATES_SPEC_FILTER")
        .map_err(|_| "GATES_SPEC_FILTER is not set; CI sets it")
        .unwrap();
    let filter = parse_spec_filter(&std::fs::read_to_string(path).unwrap()).unwrap();
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let ported = gates::tree::ported_list(&root).unwrap();
    let report: Vec<String> = check_spec_filter(&ported, &filter)
        .iter()
        .map(ToString::to_string)
        .collect();
    assert!(report.is_empty(), "{}", report.join("\n"));
}
