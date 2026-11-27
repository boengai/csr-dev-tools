//! Every gated member inherits the workspace's lints, licence and
//! third-party dependencies (`docs/quality/gates.md` → "Manifests").

use std::path::Path;

use gates::manifests;
use gates::workspace::Workspace;

#[test]
fn the_inheritance_fixture_fails_once_per_broken_rule() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/workspaces/inheritance");
    let workspace = Workspace::load(&root).unwrap();
    let mut found: Vec<String> = manifests::check_inheritance(&workspace)
        .iter()
        .map(|f| format!("{} {}", f.at, f.message))
        .collect();
    found.sort();
    assert_eq!(found.len(), 4, "{found:#?}");
    assert!(
        found.iter().all(|line| line.starts_with("logic-bad ")),
        "{found:#?}"
    );
    for needle in [
        "[lints] workspace = true",
        "license.workspace = true",
        "serde",
        "itoa",
    ] {
        assert!(
            found.iter().any(|line| line.contains(needle)),
            "missing {needle}: {found:#?}"
        );
    }
}
