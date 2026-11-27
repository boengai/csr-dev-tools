//! The path check by PR kind, the gate-file mixing check and the size warning
//! (`docs/quality/gates.md` → "PR kinds").

use std::collections::{BTreeMap, BTreeSet};

use crate::Finding;
use crate::paths::{
    APP_MANIFEST, CEILING_FILE, DIOXUS_SPEC_FILTER, GOLDENS, PORTED_LIST, STORAGE_TABLE,
    is_gate_file, is_generated, logic_name, tool_key,
};

/// Above this many changed lines a PR gets a warning, never a failure.
pub const SIZE_WARNING_LINES: usize = 1000;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Kind {
    Port { key: String },
    Split { name: String },
    Shell { layout: String },
    Foundation { layer: String, part: String },
    Gates,
    Docs,
    Sync,
}

impl Kind {
    /// The kind as a PR title names it.
    pub fn label(&self) -> String {
        match self {
            Self::Port { key } => format!("port({key})"),
            Self::Split { name } => format!("split({name})"),
            Self::Shell { layout } => format!("shell({layout})"),
            Self::Foundation { layer, part } => format!("{layer}({part})"),
            Self::Gates => "gates".to_owned(),
            Self::Docs => "docs".to_owned(),
            Self::Sync => "sync".to_owned(),
        }
    }
}

const FOUNDATION_LAYERS: [&str; 8] = [
    "ui", "platform", "bridge", "persist", "registry", "worker", "app", "logic",
];

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ChangedFile {
    pub path: String,
    pub added: usize,
    pub removed: usize,
}

impl ChangedFile {
    pub fn new(path: impl Into<String>, added: usize, removed: usize) -> Self {
        Self {
            path: path.into(),
            added,
            removed,
        }
    }
}

/// What the path check needs to know about the tree beyond the diff.
#[derive(Clone, Debug, Default)]
pub struct PathContext {
    /// For each logic crate (by `<name>`), the keys of the Tools that use it.
    pub logic_users: BTreeMap<String, BTreeSet<String>>,
}

/// Reads the PR kind from the title's prefix.
pub fn parse_title(title: &str) -> Result<Kind, Finding> {
    let reject = || {
        Finding::new(
            "pr-kind",
            title,
            0,
            "the title must start with a PR kind: port(<key>), split(<crate>), shell(<layout>), \
             ui(…)/platform(…)/bridge(…)/persist(…)/registry(…)/worker(…)/app(…)/logic(…), gates:, docs:, \
             or `chore: sync main into develop`",
        )
    };
    if title.starts_with("chore: sync main into develop") {
        return Ok(Kind::Sync);
    }
    let (prefix, summary) = title.split_once(": ").ok_or_else(reject)?;
    if summary.trim().is_empty() {
        return Err(reject());
    }
    match prefix {
        "gates" => return Ok(Kind::Gates),
        "docs" => return Ok(Kind::Docs),
        _ => {}
    }
    let (word, rest) = prefix.split_once('(').ok_or_else(reject)?;
    let arg = rest
        .strip_suffix(')')
        .filter(|arg| is_kebab(arg))
        .ok_or_else(reject)?
        .to_owned();
    match word {
        "port" => Ok(Kind::Port { key: arg }),
        "split" => Ok(Kind::Split { name: arg }),
        "shell" => Ok(Kind::Shell { layout: arg }),
        layer if FOUNDATION_LAYERS.contains(&layer) => Ok(Kind::Foundation {
            layer: layer.to_owned(),
            part: arg,
        }),
        _ => Err(reject()),
    }
}

fn is_kebab(text: &str) -> bool {
    !text.is_empty()
        && text
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

/// Fails each changed file outside the kind's set. A gate file outside the
/// set is reported as mixing, so the message says what to do: a `gates` PR.
pub fn check_paths(kind: &Kind, files: &[ChangedFile], ctx: &PathContext) -> Vec<Finding> {
    if *kind == Kind::Sync {
        return Vec::new();
    }
    // A shell PR's one proof Tool: the first Tool it touches. Files of any
    // other Tool fall outside that Tool's `port` set.
    let proof_tool = files
        .iter()
        .find_map(|file| tool_key(&file.path))
        .unwrap_or_default();
    files
        .iter()
        .filter(|file| !allowed(kind, &file.path, proof_tool, ctx))
        .map(|file| outside_kind(kind, &file.path))
        .collect()
}

fn outside_kind(kind: &Kind, path: &str) -> Finding {
    if is_gate_file(path) && *kind != Kind::Gates {
        Finding::new(
            "gate-file-mixing",
            path,
            0,
            "a gate file changes only in a `gates: …` PR of its own",
        )
    } else {
        Finding::new(
            "pr-paths",
            path,
            0,
            format!(
                "outside what a `{}` PR may change (docs/quality/gates.md → PR kinds)",
                kind.label()
            ),
        )
    }
}

fn allowed(kind: &Kind, path: &str, proof_tool: &str, ctx: &PathContext) -> bool {
    match kind {
        Kind::Port { key } => in_port_set(key, path, ctx),
        Kind::Split { name } => {
            path == "Cargo.lock"
                || logic_name(path) == Some(name.as_str())
                || path.starts_with(&format!("wasm/crates/{name}/"))
        }
        Kind::Shell { .. } => path.starts_with("crates/ui/") || in_port_set(proof_tool, path, ctx),
        Kind::Foundation { layer, part } => {
            path == APP_MANIFEST
                || path == "Cargo.lock"
                || foundation_roots(layer, part)
                    .iter()
                    .any(|root| path.starts_with(root))
        }
        Kind::Gates => {
            is_gate_file(path)
                || path.starts_with("docs/quality/")
                || path.starts_with("docs/adr/")
                || path == "Cargo.lock"
        }
        Kind::Docs => {
            !is_gate_file(path)
                && ((path.starts_with("docs/") && !path.starts_with("docs/quality/"))
                    || matches!(path, "CONTEXT.md" | "CONTRIBUTING.md" | "CLAUDE.md")
                    || path.starts_with(".claude/"))
        }
        Kind::Sync => true,
    }
}

fn in_port_set(key: &str, path: &str, ctx: &PathContext) -> bool {
    if tool_key(path) == Some(key) {
        return true;
    }
    if let Some(name) = logic_name(path) {
        return ctx
            .logic_users
            .get(name)
            .is_none_or(|users| users.iter().all(|user| user == key));
    }
    [
        APP_MANIFEST,
        PORTED_LIST,
        CEILING_FILE,
        STORAGE_TABLE,
        GOLDENS,
        DIOXUS_SPEC_FILTER,
        "Cargo.lock",
    ]
    .contains(&path)
}

fn foundation_roots(layer: &str, part: &str) -> Vec<String> {
    match layer {
        "ui" => vec!["crates/ui/".into()],
        "platform" => vec!["crates/platform/".into()],
        "bridge" => vec!["crates/bridges/".into()],
        "persist" => vec!["crates/persist/".into()],
        "registry" => vec!["crates/registry/".into(), "scripts/dioxus/".into()],
        "worker" => vec![format!("crates/workers/{part}/")],
        "app" => vec!["crates/app/".into()],
        "logic" => vec![format!("crates/logic/{part}/")],
        _ => Vec::new(),
    }
}

/// The warning shown above [`SIZE_WARNING_LINES`] changed lines, not
/// counting lockfiles and generated files.
pub fn size_warning(files: &[ChangedFile]) -> Option<String> {
    let lines: usize = files
        .iter()
        .filter(|file| !is_generated(&file.path))
        .map(|file| file.added + file.removed)
        .sum();
    (lines > SIZE_WARNING_LINES).then(|| {
        format!("{lines} changed lines, over {SIZE_WARNING_LINES}: consider splitting this PR")
    })
}
