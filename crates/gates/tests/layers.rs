//! ADR-0035's layer allowlist and ADR-0034's crate ban, proven on a must-fail
//! fixture workspace whose members each break one rule.

use std::path::Path;

use gates::layers;
use gates::workspace::Workspace;

fn fixture() -> Result<Vec<String>, cargo_metadata::Error> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/workspaces/layers");
    let workspace = Workspace::load(&root)?;
    let mut found: Vec<String> = layers::check(&workspace)
        .iter()
        .map(|f| format!("{} {} {}", f.rule, f.at, f.message))
        .collect();
    found.sort();
    Ok(found)
}

#[test]
fn the_layers_fixture_fails_on_every_planted_edge() {
    let found = fixture().unwrap();
    let expect = [
        ("layers", "app", "worker-pdf"),
        ("layers", "app", "logic-pdf"),
        ("layers", "ui", "dioxus/web"),
        ("banned-crate", "ui", "dioxus-primitives"),
        ("layers", "persist", "dioxus"),
        ("layers", "registry", "serde"),
        ("layers", "logic-pdf", "wasm-bindgen"),
        ("layers", "tool-alpha", "tool-gamma"),
        ("layers", "tool-alpha", "web-sys"),
        ("banned-crate", "tool-alpha", "dioxus-motion"),
        ("layers", "tool-gamma", "tool-beta"),
        ("layers", "stray", "not in any layer"),
    ];
    for (rule, at, needle) in expect {
        assert!(
            found
                .iter()
                .any(|line| line.starts_with(&format!("{rule} {at} ")) && line.contains(needle)),
            "missing {rule} {at} {needle} in {found:#?}"
        );
    }
    assert_eq!(found.len(), expect.len(), "unexpected findings: {found:#?}");
}

#[test]
fn clean_members_raise_nothing() {
    let found = fixture().unwrap();
    assert!(
        !found.iter().any(|line| line
            .split(' ')
            .nth(1)
            .is_some_and(|at| at == "platform" || at == "worker-pdf")),
        "{found:#?}"
    );
}
