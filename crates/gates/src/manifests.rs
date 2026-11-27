//! The inheritance check (ADR-0036 §5): `cargo metadata` does not say whether
//! a member inherits, so each gated member's manifest is read as TOML.

use std::fs;

use toml::{Table, Value};

use crate::Finding;
use crate::workspace::{Member, Workspace};

const DEPENDENCY_TABLES: [&str; 3] = ["dependencies", "dev-dependencies", "build-dependencies"];

pub fn check_inheritance(workspace: &Workspace) -> Vec<Finding> {
    workspace
        .gated()
        .into_iter()
        .flat_map(|member| match read_manifest(workspace, member) {
            Ok(manifest) => check_manifest(member.name(), &manifest),
            Err(message) => vec![Finding::new("inheritance", member.name(), 0, message)],
        })
        .collect()
}

fn read_manifest(workspace: &Workspace, member: &Member) -> Result<Table, String> {
    let path = workspace.root.join(&member.dir).join("Cargo.toml");
    let text = fs::read_to_string(&path)
        .map_err(|error| format!("cannot read {}: {error}", path.display()))?;
    text.parse::<Table>()
        .map_err(|error| format!("cannot parse {}: {error}", path.display()))
}

fn check_manifest(name: &str, manifest: &Table) -> Vec<Finding> {
    let mut findings = Vec::new();
    let finding = |message: String| Finding::new("inheritance", name, 0, message);
    if !is_workspace_true(manifest.get("lints")) {
        findings.push(finding("needs `[lints] workspace = true`".to_owned()));
    }
    if !is_workspace_true(
        manifest
            .get("package")
            .and_then(|package| package.get("license")),
    ) {
        findings.push(finding("needs `license.workspace = true`".to_owned()));
    }
    for (dependency, spec) in dependency_entries(manifest) {
        let internal = spec.get("path").is_some();
        if !internal && !is_workspace_true(Some(spec)) {
            findings.push(finding(format!(
                "takes {dependency} without `workspace = true`"
            )));
        }
    }
    findings
}

fn is_workspace_true(value: Option<&Value>) -> bool {
    value
        .and_then(|value| value.get("workspace"))
        .and_then(Value::as_bool)
        == Some(true)
}

/// Every dependency entry, including the ones under `[target.'cfg'.*]`.
fn dependency_entries(manifest: &Table) -> Vec<(&String, &Value)> {
    let targets = manifest
        .get("target")
        .and_then(Value::as_table)
        .into_iter()
        .flat_map(|targets| targets.values());
    std::iter::once(manifest)
        .chain(targets.filter_map(Value::as_table))
        .flat_map(|table| {
            DEPENDENCY_TABLES
                .iter()
                .filter_map(|kind| table.get(*kind).and_then(Value::as_table))
        })
        .flat_map(|deps| deps.iter())
        .collect()
}
