//! What the path check reads beyond file names: the root manifest's change,
//! and where a sync PR comes from.

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
/// enough: it must come from `main`.
pub fn check_sync_source(kind: &Kind, head_ref: &str) -> Option<Finding> {
    (*kind == Kind::Sync && head_ref != "main").then(|| {
        Finding::new(
            "pr-kind",
            head_ref,
            0,
            "a `chore: sync main into develop` PR comes from `main`, not from a topic branch",
        )
    })
}
