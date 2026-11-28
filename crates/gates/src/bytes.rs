//! The byte check (`docs/perf/budgets.md` → "CI on `develop`",
//! `docs/quality/gates.md` → "Byte ceilings").
//!
//! `scripts/measure-bytes.mjs` measures a build: each file's brotli size and
//! the files each page's HTML loads. Here that becomes one row per page and
//! per wasm module, judged against the base branch (2%) and the committed
//! ceiling file.

use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

use crate::Finding;
use crate::paths::{CEILING_FILE, tool_key};
use crate::pr_kind::Kind;

/// Bytes by row key: `page:<route>`, `wasm:main`, `wasm:<loader module>` or
/// `wasm:chunk:<name>`.
pub type Rows = BTreeMap<String, u64>;

/// What `measure-bytes.mjs` read from a build.
#[derive(Debug, Default)]
pub struct Build {
    /// Each file's brotli size, by its path in the build.
    pub files: BTreeMap<String, u64>,
    /// Each page's route, and the files its HTML loads (the HTML first).
    pub pages: BTreeMap<String, Vec<String>>,
}

impl Build {
    pub fn from_json(text: &str) -> Result<Self, String> {
        let value: Value =
            serde_json::from_str(text).map_err(|error| format!("is not JSON: {error}"))?;
        let object = |name: &str| {
            value
                .get(name)
                .and_then(Value::as_object)
                .ok_or_else(|| format!("has no `{name}` object"))
        };
        let files = object("files")?
            .iter()
            .map(|(path, bytes)| {
                let bytes = bytes
                    .as_u64()
                    .ok_or_else(|| format!("{path}'s size is not a byte count"))?;
                Ok((path.clone(), bytes))
            })
            .collect::<Result<_, String>>()?;
        let pages = object("pages")?
            .iter()
            .map(|(route, loads)| {
                let loads = loads
                    .as_array()
                    .into_iter()
                    .flatten()
                    .filter_map(Value::as_str)
                    .map(str::to_owned)
                    .collect();
                (route.clone(), loads)
            })
            .collect();
        Ok(Self { files, pages })
    }
}

/// The ceiling file: a JSON object of row keys and byte counts.
pub fn parse_rows(text: &str) -> Result<Rows, String> {
    let value: Value =
        serde_json::from_str(text).map_err(|error| format!("is not JSON: {error}"))?;
    value
        .as_object()
        .ok_or("is not a JSON object")?
        .iter()
        .map(|(key, bytes)| {
            let bytes = bytes
                .as_u64()
                .ok_or_else(|| format!("{key}'s ceiling is not a byte count"))?;
            Ok((key.clone(), bytes))
        })
        .collect()
}

/// What a wasm file in the build is, from the name dx gives it.
enum Wasm {
    Main,
    /// A `lazy_loader!` module, by its module name (`hash_generator`).
    Module(String),
    /// Code that wasm-split shares between modules.
    Chunk(String),
}

/// dx names files `<stem>-dxh<hex>.<ext>`; wasm-split names a loader's module
/// `module_<n>_<name><32 hex>` and a shared chunk `chunk_<n>_<name>`.
fn classify_wasm(path: &str) -> Option<Wasm> {
    let file = path.rsplit('/').next()?;
    let (stem, _) = file.strip_suffix(".wasm")?.rsplit_once("-dxh")?;
    if stem == "app_bg" {
        return Some(Wasm::Main);
    }
    let numbered = |prefix: &str| {
        let rest = stem.strip_prefix(prefix)?;
        let (index, name) = rest.split_once('_')?;
        index.bytes().all(|b| b.is_ascii_digit()).then_some(name)
    };
    if let Some(name) = numbered("module_") {
        let split = name.len().checked_sub(32)?;
        let (module, hash) = (name.get(..split)?, name.get(split..)?);
        return hash
            .bytes()
            .all(|b| b.is_ascii_hexdigit())
            .then(|| Wasm::Module(module.to_owned()));
    }
    numbered("chunk_").map(|name| Wasm::Chunk(name.to_owned()))
}

/// The build's rows. A page's row is its HTML, the files it loads and the
/// main module. A wasm or JS file that is neither a known module nor loaded by
/// a page is a finding: its kind of row (a bridge or worker file) is built in
/// a `gates` PR with the first such file.
pub fn rows(build: &Build) -> (Rows, Vec<Finding>) {
    let mut rows = Rows::new();
    let mut findings = Vec::new();
    let loaded: BTreeSet<&String> = build.pages.values().flatten().collect();
    for (path, &bytes) in &build.files {
        let key = match classify_wasm(path) {
            Some(Wasm::Main) => "wasm:main".to_owned(),
            Some(Wasm::Module(name)) => format!("wasm:{name}"),
            Some(Wasm::Chunk(name)) => format!("wasm:chunk:{name}"),
            None => {
                let code = std::path::Path::new(path)
                    .extension()
                    .is_some_and(|ext| ext.eq_ignore_ascii_case("wasm") || ext == "js");
                if code && !loaded.contains(path) {
                    findings.push(Finding::new(
                        "bytes",
                        path,
                        0,
                        "no kind of ceiling row covers this file: add one in a `gates` PR",
                    ));
                }
                continue;
            }
        };
        if rows.insert(key.clone(), bytes).is_some() {
            findings.push(Finding::new("bytes", key, 0, "two files claim this row"));
        }
    }
    let Some(&main) = rows.get("wasm:main") else {
        findings.push(Finding::new(
            "bytes",
            "wasm:main",
            0,
            "the build has no main module (assets/app_bg-dxh….wasm)",
        ));
        return (rows, findings);
    };
    for (route, loads) in &build.pages {
        let mut total = main;
        for path in loads {
            match build.files.get(path) {
                Some(bytes) => total += bytes,
                None => findings.push(Finding::new(
                    "bytes",
                    format!("page:{route}"),
                    0,
                    format!("loads {path}, which the build does not hold"),
                )),
            }
        }
        rows.insert(format!("page:{route}"), total);
    }
    (rows, findings)
}

/// The module name a Tool's loader takes: its key in snake case.
fn module_name(key: &str) -> String {
    key.replace('-', "_")
}

/// Every ported Tool emits its own wasm module (ADR-0035 §7): a Tool whose
/// code landed in main has no row of its own.
pub fn check_tool_modules(ported: &BTreeSet<String>, rows: &Rows) -> Vec<Finding> {
    ported
        .iter()
        .filter(|key| !rows.contains_key(&format!("wasm:{}", module_name(key))))
        .map(|key| {
            let message = format!(
                "emits no wasm module `{}`: its code is in main, so its loader is missing or not split",
                module_name(key)
            );
            Finding::new("tool-module", key, 0, message)
        })
        .collect()
}

/// The two limits: no row more than 2% over the base branch, none over its
/// ceiling. Every measured row has a ceiling, and every ceiling a row.
pub fn check_ceilings(head: &Rows, base: Option<&Rows>, ceilings: &Rows) -> Vec<Finding> {
    let mut findings = Vec::new();
    let mut report = |key: &str, message: String| {
        findings.push(Finding::new("bytes", key, 0, message));
    };
    for (key, &bytes) in head {
        match ceilings.get(key) {
            Some(&ceiling) if bytes > ceiling => {
                report(key, format!("{bytes} B is over its ceiling of {ceiling} B"));
            }
            Some(_) => {}
            None => report(
                key,
                format!(
                    "{bytes} B has no row in {CEILING_FILE}: the PR that first ships it sets it"
                ),
            ),
        }
        if let Some(&before) = base.and_then(|base| base.get(key))
            && u128::from(bytes) * 100 > u128::from(before) * 102
        {
            report(
                key,
                format!("{bytes} B is more than 2% over the base branch's {before} B"),
            );
        }
    }
    for key in ceilings.keys().filter(|key| !head.contains_key(*key)) {
        report(
            key,
            format!("is in {CEILING_FILE}, but the build has no such file"),
        );
    }
    findings
}

/// The Tool a row belongs to, by its module name, if any.
fn row_tool(key: &str) -> Option<String> {
    if let Some(tool) = key.strip_prefix("page:/tools/") {
        return Some(module_name(tool));
    }
    let module = key.strip_prefix("wasm:")?;
    (module != "main" && !module.starts_with("chunk:")).then(|| module.to_owned())
}

/// A `port` or `shell` PR only adds rows for its own Tool; only a `gates` PR
/// (or a sync) changes or removes one. `changed` are the PR's changed paths,
/// which name a `shell` PR's Tool.
pub fn check_ceiling_rows(kind: &Kind, changed: &[&str], base: &Rows, head: &Rows) -> Vec<Finding> {
    let own: BTreeSet<String> = match kind {
        Kind::Gates | Kind::Sync => return Vec::new(),
        Kind::Port { key } => BTreeSet::from([module_name(key)]),
        Kind::Shell { .. } => changed
            .iter()
            .filter_map(|path| tool_key(path))
            .map(module_name)
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
        if !row_tool(key).is_some_and(|tool| own.contains(&tool)) {
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
