//! The PR checks CI runs on a pull request, reading it from the environment:
//!
//! - `GATES_PR_TITLE` and `GATES_PR_BODY`: the PR's title and body;
//! - `GATES_PR_HEAD_REF`: the PR's source branch;
//! - `GATES_BASE_REF`: the PR's base as a remote ref, such as `origin/develop`;
//! - `GATES_NUMSTAT`: a file holding `git diff --numstat --no-renames` from
//!   the merge base;
//! - `GATES_BASE_MANIFEST`: a file holding the root `Cargo.toml` at the merge
//!   base.
//!
//! They are `#[ignore]`d so a plain `cargo test` skips them; CI runs them with
//! `--ignored`, and a missing variable fails rather than passes.

use std::env;
use std::fs;
use std::path::Path;

use gates::pr_body::{check_body, template_name};
use gates::pr_kind::{ChangedFile, Kind, check_paths, parse_title, size_warning};
use gates::pr_source::{added_member, brings_main, check_sync_source};

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
    let brings_main = kind == Kind::Sync
        && brings_main(root(), "origin/main", &var("GATES_BASE_REF")?, "HEAD^2")?;
    match check_sync_source(&kind, &var("GATES_PR_HEAD_REF")?, brings_main) {
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
    assert!(!files.is_empty(), "the numstat file lists no changed file");
    if let Some(warning) = size_warning(&files) {
        println!("::warning::{warning}");
    }
    let mut context = gates::tree::path_context(root()).unwrap();
    if files.iter().any(|file| file.path == "Cargo.toml") {
        let base = fs::read_to_string(var("GATES_BASE_MANIFEST").unwrap()).unwrap();
        let head = fs::read_to_string(root().join("Cargo.toml")).unwrap();
        context.added_member = added_member(&base, &head);
    }
    let findings = check_paths(&kind, &files, &context);
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
