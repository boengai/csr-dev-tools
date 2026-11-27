//! What the path check needs beyond file names: the member a foundation PR
//! adds to the root manifest, and where a sync PR comes from.

use gates::pr_kind::{ChangedFile, Kind, PathContext, check_paths, parse_title};
use gates::pr_source::{added_member, check_sync_source};

const BASE: &str = r#"[workspace]
resolver = "3"
members = [
  "crates/gates",
  "crates/logic/*",
]

[workspace.lints.clippy]
unwrap_used = "deny"
"#;

fn rules(
    title: &str,
    path: &str,
    added: Option<&str>,
) -> Result<Vec<&'static str>, gates::Finding> {
    let context = PathContext {
        added_member: added.map(str::to_owned),
        ..PathContext::default()
    };
    Ok(check_paths(
        &parse_title(title)?,
        &[ChangedFile::new(path, 1, 0)],
        &context,
    )
    .into_iter()
    .map(|f| f.rule)
    .collect())
}

#[test]
fn only_a_new_member_line_is_read_as_an_added_member() {
    let head = BASE.replace(
        "  \"crates/logic/*\",\n",
        "  \"crates/logic/*\",\n  \"crates/ui\",\n",
    );
    assert_eq!(added_member(BASE, &head), Some("crates/ui".to_owned()));
    let also_lints = head.replace("\"deny\"", "\"allow\"");
    assert_eq!(added_member(BASE, &also_lints), None);
    let two = head.replace(
        "  \"crates/ui\",\n",
        "  \"crates/ui\",\n  \"crates/platform\",\n",
    );
    assert_eq!(added_member(BASE, &two), None);
    assert_eq!(added_member(BASE, BASE), None);
}

#[test]
fn a_foundation_pr_may_add_its_own_crate_to_the_workspace() {
    assert_eq!(
        rules("ui(button): x", "Cargo.toml", Some("crates/ui")).unwrap(),
        Vec::<&str>::new()
    );
    assert_eq!(
        rules("ui(button): x", "Cargo.toml", None).unwrap(),
        vec!["gate-file-mixing"]
    );
    assert_eq!(
        rules("platform(files): x", "Cargo.toml", Some("crates/ui")).unwrap(),
        vec!["gate-file-mixing"]
    );
    assert_eq!(
        rules("port(hash-generator): x", "Cargo.toml", Some("crates/ui")).unwrap(),
        vec!["gate-file-mixing"]
    );
}

#[test]
fn a_sync_comes_from_main_or_merges_its_tip() {
    // Straight from main, as a conflict-free sync is opened.
    assert_eq!(check_sync_source(&Kind::Sync, "main", true), None);
    // From a branch that merged main's tip, to resolve conflicts.
    assert_eq!(
        check_sync_source(&Kind::Sync, "sync/main-into-develop", true),
        None
    );
    // A topic branch that only borrowed the title.
    assert_eq!(
        check_sync_source(&Kind::Sync, "my-topic", false).map(|f| f.rule),
        Some("pr-kind")
    );
    assert_eq!(check_sync_source(&Kind::Docs, "my-topic", false), None);
}
