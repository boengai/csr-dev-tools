//! The byte check (docs/quality/gates.md → "Byte ceilings"): a build's rows,
//! the module each ported Tool emits, the two limits, and which rows a PR
//! may add to the ceiling file.

use std::collections::BTreeSet;
use std::path::Path;

use gates::bytes::{Build, Rows, check_ceilings, check_tool_rows, parse_rows, rows};
use gates::ceiling_rows::check_ceiling_rows;
use gates::pr_kind::Kind;

const NONE: [&str; 0] = [];

fn fixture(name: &str) -> std::io::Result<String> {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("fixtures/bytes")
        .join(name);
    std::fs::read_to_string(path)
}

fn row_set(pairs: &[(&str, u64)]) -> Rows {
    pairs
        .iter()
        .map(|(key, bytes)| ((*key).to_owned(), *bytes))
        .collect()
}

fn keys(items: &[&str]) -> BTreeSet<String> {
    items.iter().map(|item| (*item).to_owned()).collect()
}

fn ats(findings: &[gates::Finding]) -> Vec<String> {
    findings.iter().map(|finding| finding.at.clone()).collect()
}

#[test]
fn a_build_is_read_into_rows() {
    let build = Build::from_json(&fixture("build.json").unwrap()).unwrap();
    let (rows, findings) = rows(&build);
    assert_eq!(
        rows,
        row_set(&[
            ("page:/", 129_200),
            ("page:/tools/hash-generator", 129_300),
            ("wasm:HashGeneratorEntry", 40_000),
            // wasm-split names every shared chunk "split", so they share one row.
            ("wasm:chunks", 331),
            ("wasm:main", 120_000),
        ])
    );
    // A wasm, JS (.mjs too) or CSS file with no row kind, loaded by no page, fails.
    assert_eq!(
        ats(&findings),
        vec![
            "assets/stray-bridge-dxh0123456789abcdef.js",
            "assets/stray-dxh0123456789abcdef.css",
            "assets/stray-dxh0123456789abcdef.wasm",
            "assets/worker-dxh0123456789abcdef.mjs"
        ]
    );
}

#[test]
fn a_build_without_one_main_module_fails_to_read() {
    let json = r#"{"files": {"index.html": 1}, "pages": {"/": ["index.html"]}}"#;
    assert!(Build::from_json(json).is_ok_and(|build| !rows(&build).1.is_empty()));
    assert!(Build::from_json("{}").is_err());
}

#[test]
fn every_ported_tool_emits_its_own_module_and_page() {
    let build = Build::from_json(&fixture("build.json").unwrap()).unwrap();
    let (rows, _) = rows(&build);
    let findings = check_tool_rows(&keys(&["hash-generator", "uuid-generator"]), &rows);
    // Neither its module nor its stamped page.
    assert_eq!(ats(&findings), vec!["uuid-generator", "uuid-generator"]);

    // A module without its stamped page fails too.
    let module_only = row_set(&[("wasm:UuidGeneratorEntry", 1)]);
    let findings = check_tool_rows(&keys(&["uuid-generator"]), &module_only);
    assert_eq!(findings.len(), 1);
    assert!(findings[0].message.contains("/tools/uuid-generator"));
}

#[test]
fn the_ceiling_fixture_fails_on_each_limit() {
    let build = Build::from_json(&fixture("build.json").unwrap()).unwrap();
    let (head, _) = rows(&build);
    let ceilings = parse_rows(&fixture("ceilings.json").unwrap()).unwrap();
    let base = row_set(&[("page:/", 126_000), ("wasm:main", 110_000)]);
    let findings = check_ceilings(&head, Some(&base), &ceilings);
    let mut found = ats(&findings);
    found.sort();
    assert_eq!(
        found,
        vec![
            // 129,200 is over 126,000 + 2%.
            "page:/",
            // over its ceiling of 129,000
            "page:/tools/hash-generator",
            // a measured row with no ceiling
            "wasm:HashGeneratorEntry",
            // a ceiling row whose file is gone
            "wasm:gone",
            // 120,000 is over 110,000 + 2%
            "wasm:main",
        ]
    );
}

#[test]
fn within_both_limits_passes() {
    let head = row_set(&[("wasm:main", 102_000)]);
    let base = row_set(&[("wasm:main", 100_000)]);
    let ceilings = row_set(&[("wasm:main", 102_000)]);
    assert_eq!(ats(&check_ceilings(&head, Some(&base), &ceilings)), NONE);
    assert_eq!(ats(&check_ceilings(&head, None, &ceilings)), NONE);
}

#[test]
fn a_port_pr_adds_only_its_own_tools_rows() {
    let base = row_set(&[("page:/", 100), ("wasm:main", 100)]);
    let port = Kind::Port {
        key: "hash-generator".to_owned(),
    };
    let own = row_set(&[
        ("page:/", 100),
        ("wasm:main", 100),
        ("page:/tools/hash-generator", 100),
        ("wasm:HashGeneratorEntry", 100),
    ]);
    assert_eq!(ats(&check_ceiling_rows(&port, &[], &base, &own)), NONE);

    let other = row_set(&[
        ("page:/", 101),
        ("wasm:UuidGeneratorEntry", 100),
        ("wasm:HashGeneratorEntry", 100),
    ]);
    let mut found = ats(&check_ceiling_rows(&port, &[], &base, &other));
    found.sort();
    // raised, removed, and another Tool's row
    assert_eq!(
        found,
        vec!["page:/", "wasm:UuidGeneratorEntry", "wasm:main"]
    );
}

#[test]
fn a_shell_pr_adds_the_rows_of_the_tool_it_ports() {
    let shell = Kind::Shell {
        layout: "transformer".to_owned(),
    };
    let changed = ["crates/tools/hash-generator/src/lib.rs"];
    let head = row_set(&[("wasm:HashGeneratorEntry", 1)]);
    assert_eq!(
        ats(&check_ceiling_rows(&shell, &changed, &Rows::new(), &head)),
        NONE
    );
    let head = row_set(&[("wasm:UuidGeneratorEntry", 1)]);
    assert_eq!(
        ats(&check_ceiling_rows(&shell, &changed, &Rows::new(), &head)),
        vec!["wasm:UuidGeneratorEntry"]
    );
}

#[test]
fn a_gates_pr_may_change_any_row() {
    let base = row_set(&[("wasm:main", 100)]);
    let head = row_set(&[("wasm:main", 200), ("page:/", 1)]);
    assert_eq!(
        ats(&check_ceiling_rows(&Kind::Gates, &[], &base, &head)),
        NONE
    );
}

/// CI's byte check, over the Dioxus build it measured:
///
/// - `GATES_BYTES_HEAD`: `measure-bytes.mjs` over the PR's build;
/// - `GATES_BYTES_BASE`: the same over the base branch's build, or empty when
///   the base branch has no `crates/app`;
/// - `GATES_BYTES_JUMP_ACCEPTED`: `1` when the maintainer put the
///   `bytes-jump-accepted` label on the PR, empty otherwise. A jump of more than
///   2% then warns instead of failing; a ceiling still fails.
///
/// `#[ignore]`d so a plain `cargo test` skips it; a missing variable fails.
#[test]
#[ignore = "CI runs it over the build it measured"]
#[expect(
    clippy::print_stdout,
    reason = "the measured rows and accepted jumps go in the job log"
)]
fn byte_check() {
    let read = |name: &str| -> Option<String> {
        let path = std::env::var(name)
            .map_err(|_| format!("{name} is not set; CI sets it"))
            .unwrap();
        (!path.is_empty()).then(|| std::fs::read_to_string(path).unwrap())
    };
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let head = Build::from_json(&read("GATES_BYTES_HEAD").unwrap()).unwrap();
    let base = read("GATES_BYTES_BASE").map(|text| rows(&Build::from_json(&text).unwrap()).0);
    // Without its main module the base has no page rows either, and the 2% rule
    // would skip every one of them: fail rather than pass over nothing.
    assert!(
        base.as_ref()
            .is_none_or(|base| base.contains_key("wasm:main")),
        "the base branch's build has no main module, so the 2% rule cannot run"
    );
    let ceilings =
        parse_rows(&std::fs::read_to_string(root.join(gates::paths::CEILING_FILE)).unwrap())
            .unwrap();
    let (head, mut findings) = rows(&head);
    findings.extend(check_tool_rows(
        &gates::tree::ported_list(&root).unwrap(),
        &head,
    ));
    findings.extend(check_ceilings(&head, base.as_ref(), &ceilings));
    // Printed first, so a failing run still shows the rows to set a ceiling from.
    for (key, bytes) in &head {
        println!("{key}: {bytes} B");
    }
    let jump_accepted = std::env::var("GATES_BYTES_JUMP_ACCEPTED")
        .map_err(|_| "GATES_BYTES_JUMP_ACCEPTED is not set; CI sets it")
        .unwrap()
        == "1";
    let (jumps, findings): (Vec<_>, Vec<_>) = findings
        .into_iter()
        .partition(|finding| jump_accepted && finding.rule == "bytes-jump");
    for jump in &jumps {
        println!("::warning::accepted by the bytes-jump-accepted label: {jump}");
    }
    let report: Vec<String> = findings.iter().map(ToString::to_string).collect();
    assert!(report.is_empty(), "{}", report.join("\n"));
}

#[test]
fn a_page_that_preloads_the_main_module_counts_it_once() {
    let json = r#"{"files": {"index.html": 1, "assets/app_bg-dxh0123.wasm": 100},
        "pages": {"/": ["index.html", "assets/app_bg-dxh0123.wasm"]}}"#;
    let (rows, _) = rows(&Build::from_json(json).unwrap());
    assert_eq!(rows.get("page:/"), Some(&101));
}

#[test]
fn a_page_that_preloads_a_stale_main_module_fails() {
    let json = r#"{"files": {"index.html": 1, "assets/app_bg-dxh0123.wasm": 100},
        "pages": {"/": ["index.html", "assets/app_bg-dxhdead.wasm"]}}"#;
    let (_, findings) = rows(&Build::from_json(json).unwrap());
    assert_eq!(ats(&findings), vec!["page:/"]);
}

#[test]
fn a_jump_is_its_own_rule_so_the_maintainer_can_accept_it() {
    let head = row_set(&[("wasm:main", 200), ("page:/", 300)]);
    let base = row_set(&[("wasm:main", 100), ("page:/", 100)]);
    let ceilings = row_set(&[("wasm:main", 250), ("page:/", 250)]);
    let rules: Vec<(&str, String)> = check_ceilings(&head, Some(&base), &ceilings)
        .iter()
        .map(|finding| (finding.rule, finding.at.clone()))
        .collect();
    // Both rows jumped; only page:/ is also over its ceiling, which no label lifts.
    assert_eq!(
        rules,
        vec![
            ("bytes", "page:/".to_owned()),
            ("bytes-jump", "page:/".to_owned()),
            ("bytes-jump", "wasm:main".to_owned()),
        ]
    );
}

#[test]
fn only_wasm_split_chunks_count_as_chunks() {
    // wasm-split names every chunk `split`; any other `chunk_` file is a stray.
    let json = r#"{"files": {"index.html": 1, "assets/app_bg-dxh0123.wasm": 100,
        "assets/chunk_0_split-dxh0a.wasm": 5, "assets/chunk_1_worker-dxh0b.wasm": 7},
        "pages": {"/": ["index.html"]}}"#;
    let (rows, findings) = rows(&Build::from_json(json).unwrap());
    assert_eq!(rows.get("wasm:chunks"), Some(&5));
    assert_eq!(ats(&findings), vec!["assets/chunk_1_worker-dxh0b.wasm"]);
}
