//! The PR checks CI runs on a pull request, reading it from the environment:
//!
//! - `GATES_PR_TITLE` and `GATES_PR_BODY`: the PR's title and body;
//! - `GATES_NUMSTAT`: a file holding `git diff --numstat --no-renames` from
//!   the merge base.
//!
//! They are `#[ignore]`d so a plain `cargo test` skips them; CI runs them with
//! `--ignored`, and a missing variable fails rather than passes.

use std::env;
use std::fs;
use std::path::Path;

use gates::pr_body::{check_body, template_name};
use gates::pr_kind::{ChangedFile, check_paths, parse_title, size_warning};

fn var(name: &str) -> Result<String, String> {
    env::var(name).map_err(|_| format!("{name} is not set; CI sets it"))
}

fn root() -> &'static Path {
    Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/../.."))
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
    let kind =
        parse_title(&var("GATES_PR_TITLE").unwrap()).unwrap_or_else(|finding| panic!("{finding}"));
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
    let context = gates::tree::path_context(root()).unwrap();
    let findings = check_paths(&kind, &files, &context);
    assert!(findings.is_empty(), "{}", report(&findings));
}

#[test]
#[ignore = "CI runs it with the PR in the environment"]
fn pr_body() {
    let kind =
        parse_title(&var("GATES_PR_TITLE").unwrap()).unwrap_or_else(|finding| panic!("{finding}"));
    let template = template_name(&kind).map(|name| {
        fs::read_to_string(root().join("docs/quality/pr").join(format!("{name}.md"))).unwrap()
    });
    let findings = check_body(&kind, &var("GATES_PR_BODY").unwrap(), template.as_deref());
    assert!(findings.is_empty(), "{}", report(&findings));
}
