//! Every manifest, registry and source check over this repository: the
//! gated packages pass the gates as committed.

use std::path::Path;

#[test]
fn the_repository_passes_every_custom_check() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let findings = gates::tree::check_tree(&root).unwrap();
    let report: Vec<String> = findings.iter().map(ToString::to_string).collect();
    assert!(report.is_empty(), "{}", report.join("\n"));
}
