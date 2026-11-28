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
use crate::paths::CEILING_FILE;

/// Bytes by row key: `page:<route>`, `wasm:main`, `wasm:<Tool entry>` for
/// each loader's module, or `wasm:chunks` for the chunks they share.
pub type Rows = BTreeMap<String, u64>;

/// What `measure-bytes.mjs` read from a build.
#[derive(Debug, Default)]
pub struct Build {
    /// Each file's brotli size, by its path in the build.
    pub files: BTreeMap<String, u64>,
    /// Each page's route, and the files its HTML loads (the HTML first).
    pub pages: BTreeMap<String, Vec<String>>,
}

fn parse_json(text: &str) -> Result<Value, String> {
    serde_json::from_str(text).map_err(|error| format!("is not JSON: {error}"))
}

/// A JSON object whose every value is a byte count.
fn byte_counts(object: &serde_json::Map<String, Value>) -> Result<Rows, String> {
    object
        .iter()
        .map(|(key, bytes)| {
            let bytes = bytes
                .as_u64()
                .ok_or_else(|| format!("{key}: {bytes} is not a byte count"))?;
            Ok((key.clone(), bytes))
        })
        .collect()
}

impl Build {
    pub fn from_json(text: &str) -> Result<Self, String> {
        let value = parse_json(text)?;
        let object = |name: &str| {
            value
                .get(name)
                .and_then(Value::as_object)
                .ok_or_else(|| format!("has no `{name}` object"))
        };
        let files = byte_counts(object("files")?)?;
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
    byte_counts(
        parse_json(text)?
            .as_object()
            .ok_or("is not a JSON object")?,
    )
}

/// What a wasm file in the build is, from the name dx gives it.
enum Wasm {
    Main,
    /// A `lazy_loader!` module, by the function it loads: a Tool's entry
    /// (`HashGeneratorEntry`). Its file names no module.
    Module(String),
    /// Code that wasm-split shares between modules.
    Chunk,
}

/// dx 0.7.10 names files `<stem>-dxh<hex>.<ext>`. wasm-split names a loader's
/// module `module_<n>_<function>`, and every shared chunk `chunk_<n>_split`,
/// where `<n>` is an index that can move between builds.
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
    if let Some(function) = numbered("module_") {
        return Some(Wasm::Module(function.to_owned()));
    }
    numbered("chunk_").map(|_| Wasm::Chunk)
}

/// The build's rows. A page's row is its HTML, the files it loads and the
/// main module, counted once even when the HTML preloads it. A wasm, JS or
/// CSS file that is neither a known module nor loaded by a page is a finding:
/// its kind of row (a bridge or worker file) is built in a `gates` PR with the
/// first such file.
pub fn rows(build: &Build) -> (Rows, Vec<Finding>) {
    let mut rows = Rows::new();
    let mut findings = Vec::new();
    let loaded: BTreeSet<&String> = build.pages.values().flatten().collect();
    for (path, &bytes) in &build.files {
        let key = match classify_wasm(path) {
            Some(Wasm::Main) => "wasm:main".to_owned(),
            Some(Wasm::Module(function)) => format!("wasm:{function}"),
            Some(Wasm::Chunk) => {
                *rows.entry("wasm:chunks".to_owned()).or_default() += bytes;
                continue;
            }
            None => {
                let code = std::path::Path::new(path).extension().is_some_and(|ext| {
                    ["wasm", "js", "mjs", "css"].iter().any(|kind| ext == *kind)
                });
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
        for path in loads
            .iter()
            // The main module is already counted; a main-shaped name the build does not
            // hold (a stale hash) still falls through to the missing-file finding.
            .filter(|path| {
                !(build.files.contains_key(*path)
                    && matches!(classify_wasm(path), Some(Wasm::Main)))
            })
        {
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

/// A Tool's entry (ADR-0035 §7): its key in Pascal case, plus `Entry`.
fn entry_name(key: &str) -> String {
    let mut name: String = key
        .split('-')
        .flat_map(|part| {
            let mut chars = part.chars();
            chars
                .next()
                .map(|first| first.to_ascii_uppercase())
                .into_iter()
                .chain(chars)
        })
        .collect();
    name.push_str("Entry");
    name
}

/// The rows a Tool's own PR adds: its page and its module.
pub(crate) fn tool_rows(key: &str) -> [String; 2] {
    [
        format!("page:/tools/{key}"),
        format!("wasm:{}", entry_name(key)),
    ]
}

/// Every ported Tool emits its own wasm module (ADR-0035 §7), and the build
/// holds its stamped page (`gates.md` → "Definition of done", 7). A Tool whose
/// code landed in main has no module row; one the stamper missed has no page row.
pub fn check_tool_rows(ported: &BTreeSet<String>, rows: &Rows) -> Vec<Finding> {
    let mut findings = Vec::new();
    for key in ported {
        let [page, module] = tool_rows(key);
        if !rows.contains_key(&module) {
            let message = format!(
                "emits no wasm module for `{}`: its code is in main, so its loader is missing or not split",
                entry_name(key)
            );
            findings.push(Finding::new("tool-module", key, 0, message));
        }
        if !rows.contains_key(&page) {
            let route = page.trim_start_matches("page:");
            let message = format!("the build has no stamped page at {route}/index.html");
            findings.push(Finding::new("tool-page", key, 0, message));
        }
    }
    findings
}

/// The two limits: no row more than 2% over the base branch, none over its
/// ceiling. Every measured row has a ceiling, and every ceiling a row.
pub fn check_ceilings(head: &Rows, base: Option<&Rows>, ceilings: &Rows) -> Vec<Finding> {
    let mut findings = Vec::new();
    let mut report = |rule: &'static str, key: &str, message: String| {
        findings.push(Finding::new(rule, key, 0, message));
    };
    for (key, &bytes) in head {
        match ceilings.get(key) {
            Some(&ceiling) if bytes > ceiling => {
                report(
                    "bytes",
                    key,
                    format!("{bytes} B is over its ceiling of {ceiling} B"),
                );
            }
            Some(_) => {}
            None => report(
                "bytes",
                key,
                format!(
                    "{bytes} B has no row in {CEILING_FILE}: the PR that first ships it sets it"
                ),
            ),
        }
        if let Some(&before) = base.and_then(|base| base.get(key))
            && u128::from(bytes) * 100 > u128::from(before) * 102
        {
            // Its own rule: a jump the maintainer accepted (`bytes-jump-accepted`) warns.
            report(
                "bytes-jump",
                key,
                format!("{bytes} B is more than 2% over the base branch's {before} B"),
            );
        }
    }
    for key in ceilings.keys().filter(|key| !head.contains_key(*key)) {
        report(
            "bytes",
            key,
            format!("is in {CEILING_FILE}, but the build has no such file"),
        );
    }
    findings
}
