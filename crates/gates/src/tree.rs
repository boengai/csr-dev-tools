//! Runs every manifest, registry and source check over a real tree: the
//! wiring behind `tests/real_tree.rs` and the PR checks.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::Path;

use crate::paths::{PORTED_LIST, TOOL_ROUTES};
use crate::pr_kind::PathContext;
use crate::registry::{Route, ToolSets, check_opt_out_adrs, check_tool_sets, parse_tool_routes};
use crate::sources::{FileContext, SourceFile, check_file, check_tool_entries};
use crate::workspace::{Layer, Member, Workspace};
use crate::{Finding, layers, manifests};

pub fn check_tree(root: &Path) -> Result<Vec<Finding>, String> {
    let workspace =
        Workspace::load(root).map_err(|error| format!("cannot read the workspace: {error}"))?;
    let routes = read_routes(root)?;
    let mut findings = layers::check(&workspace);
    findings.extend(manifests::check_inheritance(&workspace));
    findings.extend(check_opt_out_adrs(&routes, &adr_files(root)?));
    let sets = tool_sets(&workspace, &routes, &mut findings);
    findings.extend(check_tool_sets(&sets));
    for member in workspace.gated() {
        let files = read_sources(root, member)?;
        let custom_tool = match &member.layer {
            Layer::Tool { key } => routes
                .iter()
                .any(|route| route.key == *key && route.layout == "custom"),
            _ => false,
        };
        for (file, crate_root) in &files {
            let context = FileContext {
                layer: member.layer.clone(),
                crate_root: *crate_root,
                custom_tool,
            };
            findings.extend(check_file(&context, file));
        }
        if matches!(member.layer, Layer::Tool { .. }) {
            let sources: Vec<SourceFile> = files.into_iter().map(|(file, _)| file).collect();
            findings.extend(check_tool_entries(member.name(), &sources));
        }
    }
    Ok(findings)
}

/// For the path check: each logic crate's users among the Tool crates.
pub fn path_context(root: &Path) -> Result<PathContext, String> {
    let workspace =
        Workspace::load(root).map_err(|error| format!("cannot read the workspace: {error}"))?;
    let mut logic_users: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for member in &workspace.members {
        let Layer::Tool { key } = &member.layer else {
            continue;
        };
        for dep in &member.package.dependencies {
            if let Some(name) = dep.name.strip_prefix("logic-") {
                logic_users
                    .entry(name.to_owned())
                    .or_default()
                    .insert(key.clone());
            }
        }
    }
    Ok(PathContext { logic_users })
}

fn read_routes(root: &Path) -> Result<Vec<Route>, String> {
    let text = fs::read_to_string(root.join(TOOL_ROUTES))
        .map_err(|error| format!("cannot read {TOOL_ROUTES}: {error}"))?;
    let routes = parse_tool_routes(&text);
    if routes.is_empty() {
        return Err(format!(
            "read no Tool from {TOOL_ROUTES}: has its layout changed?"
        ));
    }
    Ok(routes)
}

fn adr_files(root: &Path) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(root.join("docs/adr"))
        .map_err(|error| format!("cannot list docs/adr: {error}"))?;
    Ok(entries
        .filter_map(Result::ok)
        .map(|entry| entry.file_name().to_string_lossy().into_owned())
        .collect())
}

fn tool_sets(workspace: &Workspace, routes: &[Route], findings: &mut Vec<Finding>) -> ToolSets {
    let directories: BTreeSet<String> = workspace
        .members
        .iter()
        .filter_map(|member| match &member.layer {
            Layer::Tool { key } => Some(key.clone()),
            _ => None,
        })
        .collect();
    let registry_keys = routes.iter().map(|route| route.key.clone()).collect();
    let Some(app) = workspace
        .members
        .iter()
        .find(|member| member.layer == Layer::App)
    else {
        // No app yet: the other two sets are empty, so every Tool crate is reported.
        return ToolSets {
            directories,
            registry_keys,
            ..ToolSets::default()
        };
    };
    let app_dependencies = app
        .package
        .dependencies
        .iter()
        .filter_map(|dep| dep.name.strip_prefix("tool-"))
        .map(str::to_owned)
        .collect();
    findings.push(Finding::new(
        "tool-sets",
        PORTED_LIST,
        0,
        "app exists, so read its ported-Tool list here: the reader is built with the list (#57)",
    ));
    ToolSets {
        directories,
        app_dependencies,
        ported_list: BTreeSet::new(),
        registry_keys,
    }
}

/// Every `.rs` file under the member, with whether it is the crate root.
fn read_sources(root: &Path, member: &Member) -> Result<Vec<(SourceFile, bool)>, String> {
    let dir = root.join(&member.dir);
    let mut paths = Vec::new();
    collect_rust_files(&dir, &root.join("crates/gates/fixtures"), &mut paths)
        .map_err(|error| format!("cannot walk {}: {error}", member.dir))?;
    paths.sort();
    paths
        .into_iter()
        .map(|path| {
            let text = fs::read_to_string(&path)
                .map_err(|error| format!("cannot read {}: {error}", path.display()))?;
            let relative = path
                .strip_prefix(root)
                .unwrap_or(&path)
                .to_string_lossy()
                .replace('\\', "/");
            let crate_root =
                relative.ends_with("/src/lib.rs") || relative.ends_with("/src/main.rs");
            Ok((
                SourceFile {
                    path: relative,
                    text,
                },
                crate_root,
            ))
        })
        .collect()
}

fn collect_rust_files(
    dir: &Path,
    fixtures: &Path,
    paths: &mut Vec<std::path::PathBuf>,
) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let path = entry?.path();
        let is_target = path.file_name().is_some_and(|name| name == "target");
        if path.is_dir() {
            // The gates crate's must-fail fixtures and build output are not source.
            if path != fixtures && !is_target {
                collect_rust_files(&path, fixtures, paths)?;
            }
        } else if path.extension().is_some_and(|extension| extension == "rs") {
            paths.push(path);
        }
    }
    Ok(())
}
