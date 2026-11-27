//! The registry checks: `layoutOptOutAdr` names an ADR file that exists, and
//! ADR-0035's four sets of ported Tools agree.

use std::collections::BTreeSet;
use std::path::Path;

use gates::registry::{ToolSets, check_opt_out_adrs, check_tool_sets, parse_tool_routes};

fn fixture_routes() -> std::io::Result<Vec<gates::registry::Route>> {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/registry/tool-routes.ts");
    Ok(parse_tool_routes(&std::fs::read_to_string(path)?))
}

fn set(items: &[&str]) -> BTreeSet<String> {
    items.iter().map(|item| (*item).to_owned()).collect()
}

#[test]
fn routes_are_read_in_order_with_their_layout() {
    let routes = fixture_routes().unwrap();
    let keys: Vec<(&str, &str, Option<&str>)> = routes
        .iter()
        .map(|r| {
            (
                r.key.as_str(),
                r.layout.as_str(),
                r.layout_opt_out_adr.as_deref(),
            )
        })
        .collect();
    assert_eq!(
        keys,
        vec![
            ("alpha", "custom", Some("ADR-0001")),
            ("beta", "custom", Some("ADR-9999")),
            ("gamma", "custom", None),
            ("delta", "transformer", None),
        ]
    );
}

#[test]
fn the_opt_out_fixture_fails_on_a_missing_adr_and_a_custom_tool_without_one() {
    let adrs = vec!["0001-tool-computation-pipeline.md".to_owned()];
    let found: Vec<String> = check_opt_out_adrs(&fixture_routes().unwrap(), &adrs)
        .iter()
        .map(|f| f.at.clone())
        .collect();
    assert_eq!(found, vec!["beta", "gamma"]);
}

#[test]
fn the_four_sets_must_agree() {
    let agree = ToolSets {
        directories: set(&["hash-generator"]),
        app_dependencies: set(&["hash-generator"]),
        ported_list: set(&["hash-generator"]),
        registry_keys: set(&["hash-generator", "uuid-generator"]),
    };
    assert_eq!(check_tool_sets(&agree), vec![]);

    let drift = ToolSets {
        directories: set(&["hash-generator", "uuid-generator"]),
        app_dependencies: set(&["hash-generator"]),
        ported_list: set(&["hash-generator", "not-a-tool"]),
        registry_keys: set(&["hash-generator", "uuid-generator"]),
    };
    let found: Vec<String> = check_tool_sets(&drift)
        .iter()
        .map(|f| f.message.clone())
        .collect();
    assert_eq!(found.len(), 3, "{found:#?}");
    assert!(
        found
            .iter()
            .any(|m| m.contains("uuid-generator") && m.contains("app's dependencies"))
    );
    assert!(
        found
            .iter()
            .any(|m| m.contains("uuid-generator") && m.contains("ported-Tool list"))
    );
    assert!(
        found
            .iter()
            .any(|m| m.contains("not-a-tool") && m.contains("no Tool crate"))
    );

    let unknown = ToolSets {
        directories: set(&["ghost"]),
        app_dependencies: set(&["ghost"]),
        ported_list: set(&["ghost"]),
        registry_keys: set(&["hash-generator"]),
    };
    let found = check_tool_sets(&unknown);
    assert_eq!(found.len(), 1);
    assert!(found[0].message.contains("registry key"));
}
