//! The PR checks CI runs on a pull request, reading it from the environment:
//!
//! - `GATES_PR_TITLE` and `GATES_PR_BODY`: the PR's title and body;
//! - `GATES_PR_HEAD_REF`: the PR's source branch;
//! - `GATES_BASE_REF`: the PR's base as a remote ref, such as `origin/develop`;
//! - `GATES_NUMSTAT`: a file holding `git diff --numstat --no-renames` from
//!   the merge base;
//! - `GATES_BASE_MANIFEST`: a file holding the root `Cargo.toml` at the merge
//!   base;
//! - `GATES_BASE_CEILINGS`: a file holding the ceiling file at the base
//!   branch's tip, empty when it has none.
//!
//! They are `#[ignore]`d so a plain `cargo test` skips them; CI runs them with
//! `--ignored`, and a missing variable fails rather than passes.

use std::env;
use std::fs;
use std::path::Path;

use gates::bytes::{Rows, check_ceiling_rows, parse_rows};
use gates::paths::CEILING_FILE;
use gates::pr_body::{check_body, template_name};
use gates::pr_kind::{ChangedFile, Kind, check_paths, parse_title, size_warning};
use gates::pr_source::{added_member, check_sync_source, merges_main};

fn var(name: &str) -> Result<String, String> {
    env::var(name).map_err(|_| format!("{name} is not set; CI sets it"))
}

fn root() -> &'static Path {
    Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/../.."))
}

/// The PR's kind, from its title, and a sync PR's source checked too.
fn kind() -> Result<Kind, String> {
    let kind = parse_title(&var("GATES_PR_TITLE")?).map_err(|finding| finding.to_string())?;
    // Only a sync PR needs the ancestry: it runs git on the checkout.
    let is_main_merge = kind == Kind::Sync
        && merges_main(root(), "origin/main", &var("GATES_BASE_REF")?, "HEAD^2")?;
    match check_sync_source(&kind, &var("GATES_PR_HEAD_REF")?, is_main_merge) {
        Some(finding) => Err(finding.to_string()),
        None => Ok(kind),
    }
}

fn report(findings: &[gates::Finding]) -> String {
    findings
        .iter()
        .map(ToString::to_string)
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
#[ignore = "CI runs it with the PR in the environment"]
#[expect(
    clippy::print_stdout,
    reason = "the size warning is a GitHub annotation, not a failure"
)]
fn pr_paths() {
    let kind = kind().unwrap();
    let numstat = fs::read_to_string(var("GATES_NUMSTAT").unwrap()).unwrap();
    let files: Vec<ChangedFile> = numstat
        .lines()
        .filter_map(|line| {
            let mut parts = line.splitn(3, '\t');
            let (added, removed, path) = (parts.next()?, parts.next()?, parts.next()?);
            Some(ChangedFile::new(
                path,
                added.parse().unwrap_or(0),
                removed.parse().unwrap_or(0),
            ))
        })
        .collect();
    if let Some(warning) = size_warning(&files) {
        println!("::warning::{warning}");
    }
    if kind == Kind::Sync {
        // A sync may change anything, even nothing at all.
        return;
    }
    assert!(!files.is_empty(), "the numstat file lists no changed file");
    let mut context = gates::tree::path_context(root()).unwrap();
    if files.iter().any(|file| file.path == "Cargo.toml") {
        let base = fs::read_to_string(var("GATES_BASE_MANIFEST").unwrap()).unwrap();
        let head = fs::read_to_string(root().join("Cargo.toml")).unwrap();
        context.added_member = added_member(&base, &head);
    }
    let mut findings = check_paths(&kind, &files, &context);
    if files.iter().any(|file| file.path == CEILING_FILE) {
        // The path check sees only that the file changed; the row check sees which rows.
        let base = fs::read_to_string(var("GATES_BASE_CEILINGS").unwrap()).unwrap();
        let base = if base.trim().is_empty() {
            Rows::new()
        } else {
            parse_rows(&base).unwrap()
        };
        let head = parse_rows(&fs::read_to_string(root().join(CEILING_FILE)).unwrap()).unwrap();
        let changed: Vec<&str> = files.iter().map(|file| file.path.as_str()).collect();
        findings.extend(check_ceiling_rows(&kind, &changed, &base, &head));
    }
    assert!(findings.is_empty(), "{}", report(&findings));
}

#[test]
#[ignore = "CI runs it with the PR in the environment"]
fn pr_body() {
    let kind = kind().unwrap();
    let template = template_name(&kind).map(|name| {
        fs::read_to_string(root().join("docs/quality/pr").join(format!("{name}.md"))).unwrap()
    });
    let findings = check_body(&kind, &var("GATES_PR_BODY").unwrap(), template.as_deref());
    assert!(findings.is_empty(), "{}", report(&findings));
}
