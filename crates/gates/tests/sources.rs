//! The source rules (`docs/quality/gates.md` → "Source rules"), each proven by
//! a must-fail fixture in `fixtures/sources`.

use std::path::Path;

use gates::Finding;
use gates::sources::{FileContext, SourceFile, check_file, check_tool_entries};
use gates::workspace::Layer;

fn read(name: &str) -> std::io::Result<SourceFile> {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("fixtures/sources")
        .join(name);
    Ok(SourceFile {
        path: name.to_owned(),
        text: std::fs::read_to_string(path)?,
    })
}

fn logic() -> FileContext {
    FileContext {
        layer: Layer::Logic { name: "x".into() },
        crate_root: false,
        custom_tool: false,
    }
}

fn ui() -> FileContext {
    FileContext {
        layer: Layer::Ui,
        crate_root: false,
        custom_tool: false,
    }
}

fn custom_tool_root() -> FileContext {
    FileContext {
        layer: Layer::Tool { key: "x".into() },
        crate_root: true,
        custom_tool: true,
    }
}

fn rules(found: &[Finding]) -> Vec<&'static str> {
    found.iter().map(|finding| finding.rule).collect()
}

#[test]
fn each_fixture_fails_its_own_rule() {
    let cases = [
        ("style_string.rs", logic(), "style-string", 5),
        ("style_element.rs", logic(), "style-element", 5),
        ("nested_rsx_style.rs", logic(), "style-string", 6),
        ("component_lazy.rs", logic(), "component-lazy", 2),
        ("component_too_long.rs", logic(), "component-size", 2),
        ("file_too_long.rs", logic(), "file-size", 0),
        ("commented_out_code.rs", logic(), "commented-out-code", 4),
        ("todo_without_issue.rs", logic(), "todo-issue", 2),
        ("jscpd_ignore.rs", logic(), "jscpd-ignore", 2),
        ("mutants_skip.rs", logic(), "mutants-skip", 2),
        ("crate_expect.rs", custom_tool_root(), "crate-expect", 2),
        ("off_theme_text.rs", custom_tool_root(), "off-theme-text", 4),
    ];
    for (name, context, rule, line) in cases {
        let found = check_file(&context, &read(name).unwrap());
        assert_eq!(rules(&found), vec![rule], "{name}: {found:#?}");
        assert_eq!(found[0].line, line, "{name}: {found:#?}");
    }
}

#[test]
fn ui_components_take_no_class_or_style() {
    let found = check_file(&ui(), &read("ui_props.rs").unwrap());
    assert_eq!(
        rules(&found),
        vec!["ui-props", "ui-props", "ui-props"],
        "{found:#?}"
    );
    let elsewhere = check_file(&logic(), &read("ui_props.rs").unwrap());
    assert_eq!(elsewhere, vec![]);
}

#[test]
fn a_tool_reaches_no_app_only_ui_item() {
    let found = check_file(&custom_tool_root(), &read("tool_app_only.rs").unwrap());
    assert_eq!(
        rules(&found),
        vec!["tool-app-only", "tool-app-only"],
        "{found:#?}"
    );
}

#[test]
fn a_tool_crate_has_exactly_one_entry() {
    let two = check_tool_entries("x", &[read("tool_two_entries.rs").unwrap()]);
    assert_eq!(rules(&two), vec!["tool-entry"]);
    let none = check_tool_entries("x", &[read("clean.rs").unwrap()]);
    assert_eq!(rules(&none), vec!["tool-entry"]);
}

#[test]
fn near_misses_pass_every_rule() {
    for context in [logic(), ui(), custom_tool_root()] {
        let found = check_file(&context, &read("clean.rs").unwrap());
        assert_eq!(found, vec![], "{context:?}");
    }
}
