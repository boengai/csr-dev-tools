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
/// resolve, from a branch that merges `main` into the base (`merges_main`).
pub fn check_sync_source(kind: &Kind, head_ref: &str, merges_main: bool) -> Option<Finding> {
    (*kind == Kind::Sync && head_ref != "main" && !merges_main).then(|| {
        Finding::new(
            "pr-kind",
            head_ref,
            0,
            "a `chore: sync main into develop` PR comes from `main`, or from a branch that merges main into develop",
        )
    })
}

/// Whether `head` is a merge of `main` into `base`, as a sync branch is:
/// it brings `main` commits `base` lacks, and `base` commits `main` lacks.
/// A branch cut from `base` brings nothing from `main`; a branch cut from
/// `main` merges nothing of `base`. Any git error is an `Err`, never a pass.
/// `repo` is the checkout; the refs are anything `git` resolves.
pub fn merges_main(repo: &Path, main: &str, base: &str, head: &str) -> Result<bool, String> {
    Ok(brings(repo, main, head, base)? && brings(repo, base, head, main)?)
}

/// Whether `head` holds commits of `from` that `without` lacks. Every merge
/// base counts: in a criss-cross history git reports one of several, and the
/// one it picks may already be in `without` while another is not.
fn brings(repo: &Path, from: &str, head: &str, without: &str) -> Result<bool, String> {
    for meet in git(repo, &["merge-base", "--all", from, head])?.lines() {
        if !is_ancestor(repo, meet.trim(), without)? {
            return Ok(true);
        }
    }
    Ok(false)
}

fn is_ancestor(repo: &Path, commit: &str, of: &str) -> Result<bool, String> {
    let output = command(repo, &["merge-base", "--is-ancestor", commit, of])?;
    // --is-ancestor exits 0 for yes, 1 for no, and anything else on error.
    match output.status.code() {
        Some(0) => Ok(true),
        Some(1) => Ok(false),
        _ => Err(format!(
            "git merge-base --is-ancestor failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        )),
    }
}

fn git(repo: &Path, args: &[&str]) -> Result<String, String> {
    let output = command(repo, args)?;
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

/// git in `repo`, whatever `GIT_DIR` the caller has set.
fn command(repo: &Path, args: &[&str]) -> Result<std::process::Output, String> {
    Command::new("git")
        .args(args)
        .current_dir(repo)
        .env_remove("GIT_DIR")
        .env_remove("GIT_WORK_TREE")
        .env_remove("GIT_INDEX_FILE")
        .output()
        .map_err(|error| format!("cannot run git: {error}"))
}
