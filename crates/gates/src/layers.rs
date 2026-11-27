//! ADR-0035's layer allowlist (§2, §3) and ADR-0034's crate ban.
//!
//! Every declared dependency counts: normal, dev, build, target-specific,
//! optional and renamed (`cargo metadata` names the real package).

use cargo_metadata::Dependency;

use crate::Finding;
use crate::workspace::{Layer, Member, Workspace};

/// Banned for every member, in every kind of dependency (ADR-0034).
const BANNED: [&str; 2] = ["dioxus-primitives", "dioxus-motion"];

/// Logic crates only a worker uses; `app` never takes them (ADR-0035 §2).
const WORKER_ONLY_LOGIC: [&str; 2] = ["logic-pdf", "logic-bcrypt"];

/// Crates that reach the browser directly.
const BROWSER: [&str; 4] = ["web-sys", "js-sys", "wasm-bindgen", "wasm-bindgen-futures"];

pub fn check(workspace: &Workspace) -> Vec<Finding> {
    let mut findings = Vec::new();
    for member in &workspace.members {
        if member.layer == Layer::Fixture {
            continue;
        }
        if let Layer::Wasm { .. } = member.layer {
            // A split wrapper is gated: the crate ban holds for it too.
            if workspace
                .gated()
                .iter()
                .any(|gated| gated.name() == member.name())
            {
                findings.extend(
                    member
                        .package
                        .dependencies
                        .iter()
                        .filter_map(|dep| banned(member, dep)),
                );
            }
            continue;
        }
        if member.layer == Layer::Unknown {
            findings.push(edge(
                member,
                format!("{} is not in any layer of ADR-0035", member.dir),
            ));
            continue;
        }
        if let Some(expected) = member
            .layer
            .package_name()
            .filter(|expected| expected != member.name())
        {
            findings.push(edge(
                member,
                format!("the package in {} must be named {expected}", member.dir),
            ));
        }
        for dep in &member.package.dependencies {
            findings.extend(check_dependency(workspace, member, dep));
        }
        findings.extend(check_features(member));
    }
    findings
}

fn edge(member: &Member, message: String) -> Finding {
    Finding::new("layers", member.name(), 0, message)
}

fn banned(member: &Member, dep: &Dependency) -> Option<Finding> {
    let name = dep.name.as_str();
    BANNED.contains(&name).then(|| {
        let message =
            format!("{name} is banned (ADR-0034): build the primitive or the motion in `ui`");
        Finding::new("banned-crate", member.name(), 0, message)
    })
}

fn check_dependency(workspace: &Workspace, member: &Member, dep: &Dependency) -> Option<Finding> {
    let name = dep.name.as_str();
    if let Some(finding) = banned(member, dep) {
        return Some(finding);
    }
    if member.layer == Layer::Gates {
        return None;
    }
    // A path dependency is a member; a registry one is third-party even when it
    // shares a member's name, as crates.io `csv` shares React's `csv`.
    let internal = dep.path.as_ref().and_then(|_| workspace.member(name));
    let allowed = match internal {
        Some(target) => internal_allowed(&member.layer, &target.layer, name),
        None => external_allowed(&member.layer, name),
    };
    if !allowed {
        return Some(edge(
            member,
            format!("may not depend on {name} (ADR-0035 §2)"),
        ));
    }
    let turns_on_web = name == "dioxus" && dep.features.iter().any(|feature| feature == "web");
    (turns_on_web && member.layer != Layer::App)
        .then(|| edge(member, "only app turns on dioxus/web".to_owned()))
}

fn internal_allowed(from: &Layer, to: &Layer, name: &str) -> bool {
    use Layer::{App, Bridges, Logic, Persist, Platform, Registry, Tool, Ui, Worker};
    match (from, to) {
        (App, Logic { .. }) => !WORKER_ONLY_LOGIC.contains(&name),
        (App, Tool { .. } | Ui | Platform | Bridges | Persist | Registry)
        | (Tool { .. }, Ui | Platform | Bridges | Registry | Logic { .. })
        | (Ui, Platform | Bridges | Registry | Persist)
        // Logic may share logic (as `hash` shares `shared`'s digests today).
        | (Logic { .. } | Worker { .. }, Logic { .. }) => true,
        _ => false,
    }
}

fn external_allowed(from: &Layer, name: &str) -> bool {
    let dioxus = name == "dioxus" || name.starts_with("dioxus-") || name == "wasm-splitter";
    let browser = BROWSER.contains(&name);
    match from {
        Layer::App | Layer::Ui | Layer::Tool { .. } => !browser,
        // `platform` turns Dioxus events into its opaque types (ADR-0035 §8).
        Layer::Platform => dioxus || matches!(name, "web-sys" | "js-sys" | "wasm-bindgen"),
        Layer::Bridges => matches!(name, "wasm-bindgen" | "js-sys"),
        Layer::Persist => matches!(name, "serde" | "serde_json"),
        Layer::Registry => false,
        Layer::Logic { .. } => !dioxus && !browser,
        Layer::Worker { .. } => name == "wasm-bindgen",
        Layer::Gates | Layer::Fixture | Layer::Wasm { .. } | Layer::Unknown => true,
    }
}

/// A crate's own `[features]` may not turn on `dioxus/web`, except in `app`.
fn check_features(member: &Member) -> Option<Finding> {
    if member.layer == Layer::App {
        return None;
    }
    // [features] names a dependency by the alias it goes by in this manifest.
    let aliases: Vec<&str> = member
        .package
        .dependencies
        .iter()
        .filter(|dep| dep.name == "dioxus")
        .map(|dep| dep.rename.as_deref().unwrap_or("dioxus"))
        .collect();
    let turns_on_web = member.package.features.values().flatten().any(|feature| {
        aliases
            .iter()
            .any(|alias| *feature == format!("{alias}/web") || *feature == format!("{alias}?/web"))
    });
    turns_on_web.then(|| {
        edge(
            member,
            "only app turns on dioxus/web, here through [features]".to_owned(),
        )
    })
}
