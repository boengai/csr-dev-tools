//! The `pr-body` check against the templates in `docs/quality/pr/`
//! (`docs/quality/gates.md` → "The PR body").

use std::fs;
use std::path::{Path, PathBuf};

use gates::pr_body::check_body;
use gates::pr_kind::Kind;

fn root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../..")
}

fn template(name: &str) -> std::io::Result<String> {
    fs::read_to_string(root().join("docs/quality/pr").join(format!("{name}.md")))
}

fn rules(kind: &Kind, fixture: &str) -> std::io::Result<Vec<String>> {
    let body = fs::read_to_string(
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("fixtures/pr")
            .join(fixture),
    )?;
    let name = match kind {
        Kind::Gates => "gates",
        _ => "port",
    };
    Ok(check_body(kind, &body, Some(&template(name)?))
        .into_iter()
        .map(|f| format!("{} {}", f.rule, f.message))
        .collect())
}

fn port() -> Kind {
    Kind::Port {
        key: "hash-generator".into(),
    }
}

#[test]
fn a_filled_port_body_passes() {
    assert_eq!(
        rules(&port(), "port-filled.md").unwrap(),
        Vec::<String>::new()
    );
}

#[test]
fn an_unticked_hand_check_fails() {
    let found = rules(&port(), "port-unticked.md").unwrap();
    assert_eq!(found.len(), 1, "{found:#?}");
    assert!(found[0].starts_with("pr-body-hand-check"));
}

#[test]
fn an_empty_case_mapping_fails() {
    let found = rules(&port(), "port-empty-cases.md").unwrap();
    assert_eq!(found.len(), 1, "{found:#?}");
    assert!(found[0].starts_with("pr-body-cases"));
}

#[test]
fn a_missing_heading_and_an_empty_review_fail() {
    let found = rules(&Kind::Gates, "gates-missing-heading.md").unwrap();
    assert_eq!(found.len(), 2, "{found:#?}");
    assert!(
        found
            .iter()
            .any(|f| f.starts_with("pr-body-heading") && f.contains("## Proof it fires"))
    );
    assert!(found.iter().any(|f| f.starts_with("pr-body-review")));
}

#[test]
fn a_sync_needs_only_its_title() {
    assert_eq!(check_body(&Kind::Sync, "", None), vec![]);
}

#[test]
fn every_template_names_the_shared_sections() {
    for name in ["port", "split", "shell", "foundation", "gates", "docs"] {
        let text = template(name).unwrap();
        assert!(text.contains("\n## Automated review\n"), "{name}");
        assert!(text.contains("\n## Hand check\n"), "{name}");
    }
}

#[test]
fn every_hand_check_box_of_the_template_is_ticked() {
    let found = rules(&Kind::Gates, "gates-two-boxes.md").unwrap();
    assert_eq!(found.len(), 1, "{found:#?}");
    assert!(
        found[0].starts_with("pr-body-hand-check") && found[0].contains("Read the diff"),
        "{found:#?}"
    );
}
