//! Registry checks. Until cutover the registry's source is `tool-routes.ts`
//! (ADR-0035 §6), so the Tool list is read from there.

use std::collections::BTreeSet;

use crate::Finding;

/// One Tool in `tool-routes.ts`, in file order.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Route {
    pub key: String,
    pub layout: String,
    pub layout_opt_out_adr: Option<String>,
}

/// Reads each entry's top-level `key`, `layout` and `layoutOptOutAdr`. An
/// entry is the block between a two-space `{` and its `},`.
pub fn parse_tool_routes(text: &str) -> Vec<Route> {
    let mut routes = Vec::new();
    let mut current: Option<Route> = None;
    for line in text.lines() {
        if line == "  {" {
            current = Some(Route {
                key: String::new(),
                layout: String::new(),
                layout_opt_out_adr: None,
            });
        } else if line == "  }," {
            routes.extend(current.take());
        } else if let Some(route) = current.as_mut() {
            if let Some(value) = field(line, "key") {
                route.key = value;
            } else if let Some(value) = field(line, "layout") {
                route.layout = value;
            } else if let Some(value) = field(line, "layoutOptOutAdr") {
                route.layout_opt_out_adr = Some(value);
            }
        }
    }
    routes
}

/// The value of `    <name>: '<value>',` at the entry's own indent.
fn field(line: &str, name: &str) -> Option<String> {
    let rest = line
        .strip_prefix("    ")?
        .strip_prefix(name)?
        .strip_prefix(": '")?;
    rest.strip_suffix("',").map(str::to_owned)
}

/// Every `custom` Tool names an ADR, and every named ADR has a file in
/// `docs/adr` (`adr_files` holds their names, such as `0027-….md`).
pub fn check_opt_out_adrs(routes: &[Route], adr_files: &[String]) -> Vec<Finding> {
    routes
        .iter()
        .filter_map(
            |route| match (&route.layout_opt_out_adr, route.layout.as_str()) {
                (None, "custom") => Some(Finding::new(
                    "layout-opt-out-adr",
                    &route.key,
                    0,
                    "a custom Tool names the ADR that says why in layoutOptOutAdr",
                )),
                (Some(adr), _) => {
                    let number = adr.strip_prefix("ADR-").unwrap_or(adr);
                    let exists = adr_files.iter().any(|file| {
                        file.strip_prefix(number)
                            .is_some_and(|rest| rest.starts_with('-'))
                    });
                    (!exists).then(|| {
                        Finding::new(
                            "layout-opt-out-adr",
                            &route.key,
                            0,
                            format!("{adr} has no file in docs/adr"),
                        )
                    })
                }
                (None, _) => None,
            },
        )
        .collect()
}

/// ADR-0035 §3's four sets, each as Tool keys.
#[derive(Clone, Debug, Default)]
pub struct ToolSets {
    /// The `crates/tools/*` directories.
    pub directories: BTreeSet<String>,
    /// `app`'s `tool-<key>` dependencies.
    pub app_dependencies: BTreeSet<String>,
    /// `app`'s ported-Tool list.
    pub ported_list: BTreeSet<String>,
    /// Every key in the registry.
    pub registry_keys: BTreeSet<String>,
}

/// The Tool crates, `app`'s dependencies and the ported-Tool list are the
/// same set, and each of its keys is a registry key.
pub fn check_tool_sets(sets: &ToolSets) -> Vec<Finding> {
    let mut findings = Vec::new();
    let mut report =
        |key: &String, message: String| findings.push(Finding::new("tool-sets", key, 0, message));
    for (other, name) in [
        (&sets.app_dependencies, "app's dependencies"),
        (&sets.ported_list, "the ported-Tool list"),
    ] {
        for key in sets.directories.difference(other) {
            report(key, format!("{key} has a Tool crate but is not in {name}"));
        }
        for key in other.difference(&sets.directories) {
            report(key, format!("{key} is in {name} but has no Tool crate"));
        }
    }
    for key in sets.directories.difference(&sets.registry_keys) {
        report(
            key,
            format!("{key} has a Tool crate but is not a registry key"),
        );
    }
    findings
}

/// Every entry read from `tool-routes.ts` has a key and a layout: a blank
/// field means the file's layout drifted from what the parser reads.
pub fn check_routes_read(routes: &[Route]) -> Vec<Finding> {
    routes
        .iter()
        .enumerate()
        .filter(|(_, route)| route.key.is_empty() || route.layout.is_empty())
        .map(|(index, route)| {
            let message = format!(
                "entry {} has no key or no layout: has tool-routes.ts changed shape?",
                index + 1
            );
            Finding::new("registry-read", &route.key, 0, message)
        })
        .collect()
}

/// Reads `app`'s ported-Tool list: the string keys of the one
/// `ported_tools![…]` invocation in `crates/app/src/ported_tools.rs`.
pub fn parse_ported_list(text: &str) -> Result<BTreeSet<String>, String> {
    let file = syn::parse_file(text).map_err(|error| format!("does not parse: {error}"))?;
    let mut lists = file.items.iter().filter_map(|item| match item {
        syn::Item::Macro(item) if item.mac.path.is_ident("ported_tools") => Some(&item.mac),
        _ => None,
    });
    let (Some(list), None) = (lists.next(), lists.next()) else {
        return Err("must hold exactly one `ported_tools![…]`".to_owned());
    };
    let keys = list
        .parse_body_with(
            syn::punctuated::Punctuated::<syn::LitStr, syn::Token![,]>::parse_terminated,
        )
        .map_err(|error| format!("`ported_tools!` takes Tool keys as strings: {error}"))?;
    let mut set = BTreeSet::new();
    for key in keys {
        if !set.insert(key.value()) {
            return Err(format!("{} is listed twice", key.value()));
        }
    }
    Ok(set)
}
