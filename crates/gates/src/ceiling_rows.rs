//! The ceiling file's row check (`docs/quality/gates.md` → "Byte ceilings"):
//! which rows a PR may add, change or remove. It runs in `pr-body`, next to the
//! path check, which sees only that the ceiling file changed.

use std::collections::BTreeSet;

use crate::Finding;
use crate::bytes::{Rows, tool_rows};
use crate::paths::{CEILING_FILE, tool_key};
use crate::pr_kind::Kind;

/// A `port` or `shell` PR only adds rows for its own Tool; only a `gates` PR
/// (or a sync) changes or removes one. `changed` are the PR's changed paths,
/// which name a `shell` PR's Tool.
pub fn check_ceiling_rows(kind: &Kind, changed: &[&str], base: &Rows, head: &Rows) -> Vec<Finding> {
    let own: BTreeSet<String> = match kind {
        Kind::Gates | Kind::Sync => return Vec::new(),
        Kind::Port { key } => tool_rows(key).into(),
        Kind::Shell { .. } => changed
            .iter()
            .filter_map(|path| tool_key(path))
            .flat_map(tool_rows)
            .collect(),
        _ => BTreeSet::new(),
    };
    let mut findings = Vec::new();
    for (key, before) in base {
        if head.get(key) != Some(before) {
            findings.push(Finding::new(
                "ceiling-rows",
                key,
                0,
                format!("only a `gates` PR changes or removes a row of {CEILING_FILE}"),
            ));
        }
    }
    for key in head.keys().filter(|key| !base.contains_key(*key)) {
        if !own.contains(key) {
            findings.push(Finding::new(
                "ceiling-rows",
                key,
                0,
                format!("a {} PR adds rows for its own Tool only", kind.label()),
            ));
        }
    }
    findings
}
