//! What the path check reads beyond file names: the root manifest's change,
//! and where a sync PR comes from.

use std::path::Path;
use std::process::Command;

use toml::{Table, Value};

use crate::Finding;
use crate::pr_kind::Kind;

/// The one member the head's root manifest adds, when adding it is the
/// manifest's only change. A foundation PR that brings in a new layer crate
/// (`crates/ui`, `crates/app`, …) may make exactly that edit.
pub fn added_member(base: &str, head: &str) -> Option<String> {
    let base: Table = base.parse().ok()?;
    let mut head: Table = head.parse().ok()?;
    let base_members = members(&base)?.clone();
    let head_members = members(&head)?.clone();
    let mut added = head_members
        .iter()
        .filter(|member| !base_members.contains(member));
    let member = added.next()?.as_str()?.to_owned();
    if added.next().is_some() || head_members.len() != base_members.len() + 1 {
        return None;
    }
    let workspace = head.get_mut("workspace")?.as_table_mut()?;
    workspace.insert("members".to_owned(), Value::Array(base_members));
    (head == base).then_some(member)
}

fn members(manifest: &Table) -> Option<&Vec<Value>> {
    manifest.get("workspace")?.get("members")?.as_array()
}

/// A `sync` PR skips the path and body checks, so its title alone is not
/// enough. It comes from `main` itself, or, when the sync has conflicts to
/// resolve, from a branch that brings `main` commits the base lacks
/// (`brings_main`). "Contains main's tip" would not do: once a sync lands,
/// every branch cut from `develop` contains it.
pub fn check_sync_source(kind: &Kind, head_ref: &str, brings_main: bool) -> Option<Finding> {
    (*kind == Kind::Sync && head_ref != "main" && !brings_main).then(|| {
        Finding::new(
            "pr-kind",
            head_ref,
            0,
            "a `chore: sync main into develop` PR comes from `main`, or from a branch that brings main commits develop lacks",
        )
    })
}

/// Whether `head` brings `main` commits `base` lacks: the point where `head`
/// meets `main` is not already in `base`. Any git error is an `Err`, never a
/// pass. `repo` is the checkout; the refs are anything `git` resolves.
pub fn brings_main(repo: &Path, main: &str, base: &str, head: &str) -> Result<bool, String> {
    let meet = git(repo, &["merge-base", main, head])?;
    let output = Command::new("git")
        .args(["merge-base", "--is-ancestor", meet.trim(), base])
        .current_dir(repo)
        .output()
        .map_err(|error| format!("cannot run git: {error}"))?;
    // --is-ancestor exits 0 for yes, 1 for no, and anything else on error.
    match output.status.code() {
        Some(0) => Ok(false),
        Some(1) => Ok(true),
        _ => Err(format!(
            "git merge-base --is-ancestor failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        )),
    }
}

fn git(repo: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(repo)
        .output()
        .map_err(|error| format!("cannot run git: {error}"))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        Err(format!(
            "git {} failed: {}",
            args.join(" "),
            String::from_utf8_lossy(&output.stderr).trim()
        ))
    }
}
