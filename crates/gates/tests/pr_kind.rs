//! The path check by PR kind, the gate-file mixing check and the size warning
//! (`docs/quality/gates.md` → "PR kinds").

use gates::pr_kind::{ChangedFile, Kind, PathContext, check_paths, parse_title, size_warning};

fn files(paths: &[&str]) -> Vec<ChangedFile> {
    paths.iter().map(|p| ChangedFile::new(*p, 1, 0)).collect()
}

fn rules(title: &str, paths: &[&str]) -> Result<Vec<&'static str>, gates::Finding> {
    let kind = parse_title(title)?;
    Ok(check_paths(&kind, &files(paths), &PathContext::default())
        .into_iter()
        .map(|f| f.rule)
        .collect())
}

const NONE: Vec<&str> = Vec::new();

#[test]
fn titles_name_their_kind() {
    assert_eq!(
        parse_title("port(hash-generator): Hash Generator").unwrap(),
        Kind::Port {
            key: "hash-generator".into()
        }
    );
    assert_eq!(
        parse_title("split(hash): move the digests into logic-hash").unwrap(),
        Kind::Split {
            name: "hash".into()
        }
    );
    assert_eq!(
        parse_title("shell(transformer): TransformerShell").unwrap(),
        Kind::Shell {
            layout: "transformer".into()
        }
    );
    assert_eq!(
        parse_title("ui(select): the select primitive").unwrap(),
        Kind::Foundation {
            layer: "ui".into(),
            part: "select".into()
        }
    );
    assert_eq!(parse_title("gates: deny unwrap").unwrap(), Kind::Gates);
    assert_eq!(parse_title("docs: explain the gates").unwrap(), Kind::Docs);
    assert_eq!(
        parse_title("chore: sync main into develop (#12)").unwrap(),
        Kind::Sync
    );
}

#[test]
fn a_title_without_a_kind_is_rejected() {
    for title in [
        "Add hash generator",
        "feat: hash",
        "port: missing key",
        "ui(): empty",
        "fix(x): y",
    ] {
        let finding = parse_title(title).unwrap_err();
        assert_eq!(finding.rule, "pr-kind", "{title}");
    }
}

#[test]
fn a_port_stays_inside_its_tool() {
    assert_eq!(
        rules(
            "port(hash-generator): Hash Generator",
            &[
                "crates/tools/hash-generator/src/lib.rs",
                "crates/tools/hash-generator/Cargo.toml",
                "crates/logic/hash/src/lib.rs",
                "crates/app/Cargo.toml",
                "crates/app/src/ported_tools.rs",
                "crates/registry/src/storage.rs",
                "e2e/stored-values/golden.json",
                "docs/perf/byte-ceilings.json",
                "Cargo.lock",
            ],
        )
        .unwrap(),
        NONE
    );
    assert_eq!(
        rules(
            "port(hash-generator): Hash Generator",
            &[
                "crates/tools/hash-generator/src/lib.rs",
                "crates/tools/uuid-generator/src/lib.rs",
                "crates/ui/src/lib.rs"
            ],
        )
        .unwrap(),
        vec!["pr-paths", "pr-paths"]
    );
}

#[test]
fn a_port_never_changes_logic_another_tool_uses() {
    let kind = parse_title("port(hmac-generator): HMAC").unwrap();
    let mut ctx = PathContext::default();
    ctx.logic_users
        .entry("hash".into())
        .or_default()
        .insert("hash-generator".into());
    let found = check_paths(&kind, &files(&["crates/logic/hash/src/lib.rs"]), &ctx);
    assert_eq!(found.len(), 1);
    assert_eq!(found[0].rule, "pr-paths");
}

#[test]
fn a_shell_holds_one_tool() {
    assert_eq!(
        rules(
            "shell(transformer): TransformerShell",
            &[
                "crates/ui/src/shells/transformer.rs",
                "crates/tools/base64-encoder/src/lib.rs"
            ],
        )
        .unwrap(),
        NONE
    );
    assert_eq!(
        rules(
            "shell(transformer): TransformerShell",
            &[
                "crates/tools/base64-encoder/src/lib.rs",
                "crates/tools/url-encoder/src/lib.rs"
            ],
        )
        .unwrap(),
        vec!["pr-paths"]
    );
}

#[test]
fn a_split_moves_one_crate() {
    assert_eq!(
        rules(
            "split(hash): x",
            &[
                "crates/logic/hash/src/lib.rs",
                "wasm/crates/hash/src/lib.rs"
            ]
        )
        .unwrap(),
        NONE
    );
    assert_eq!(
        rules("split(hash): x", &["wasm/crates/uuid/src/lib.rs"]).unwrap(),
        vec!["pr-paths"]
    );
}

#[test]
fn a_foundation_pr_stays_in_its_crate() {
    assert_eq!(
        rules(
            "ui(select): x",
            &[
                "crates/ui/src/primitives/select.rs",
                "crates/app/Cargo.toml"
            ]
        )
        .unwrap(),
        NONE
    );
    assert_eq!(
        rules(
            "bridge(mermaid): x",
            &[
                "crates/bridges/src/mermaid.rs",
                "crates/bridges/js/mermaid.ts"
            ]
        )
        .unwrap(),
        NONE
    );
    assert_eq!(
        rules(
            "registry(generator): x",
            &[
                "crates/registry/src/generated.rs",
                "scripts/dioxus/registry.ts"
            ]
        )
        .unwrap(),
        NONE
    );
    assert_eq!(
        rules("logic(hash): x", &["crates/logic/hash/src/lib.rs"]).unwrap(),
        NONE
    );
    assert_eq!(
        rules("ui(select): x", &["crates/tools/hash-generator/src/lib.rs"]).unwrap(),
        vec!["pr-paths"]
    );
    assert_eq!(
        rules("logic(hash): x", &["crates/logic/uuid/src/lib.rs"]).unwrap(),
        vec!["pr-paths"]
    );
}

#[test]
fn gate_files_change_only_in_a_gates_pr() {
    assert_eq!(
        rules(
            "gates: deny x",
            &[
                "clippy.toml",
                "crates/gates/src/lib.rs",
                "docs/quality/gates.md",
                "docs/adr/0040-x.md"
            ]
        )
        .unwrap(),
        NONE
    );
    assert_eq!(rules("gates: cargo update", &["Cargo.lock"]).unwrap(), NONE);
    assert_eq!(
        rules("gates: deny x", &["clippy.toml", "crates/ui/src/lib.rs"]).unwrap(),
        vec!["pr-paths"]
    );
    assert_eq!(
        rules("ui(select): x", &["crates/ui/src/lib.rs", "clippy.toml"]).unwrap(),
        vec!["gate-file-mixing"]
    );
    assert_eq!(
        rules(
            "port(hash-generator): x",
            &[
                "crates/tools/hash-generator/src/lib.rs",
                ".github/workflows/dioxus.yml"
            ]
        )
        .unwrap(),
        vec!["gate-file-mixing"]
    );
}

#[test]
fn docs_never_touch_code_or_the_lockfile() {
    assert_eq!(
        rules(
            "docs: x",
            &["docs/ux/README.md", "CONTEXT.md", ".claude/CLAUDE.md"]
        )
        .unwrap(),
        NONE
    );
    assert_eq!(
        rules("docs: x", &["Cargo.lock", "docs/quality/gates.md"]).unwrap(),
        vec!["pr-paths", "pr-paths"]
    );
    assert_eq!(
        rules("docs: x", &["docs/quality/pr/docs.md"]).unwrap(),
        vec!["gate-file-mixing"]
    );
}

#[test]
fn a_sync_may_change_anything() {
    assert_eq!(
        rules(
            "chore: sync main into develop",
            &["src/App.tsx", "clippy.toml"]
        )
        .unwrap(),
        NONE
    );
}

#[test]
fn a_large_diff_warns_without_counting_lockfiles() {
    let small = vec![
        ChangedFile::new("crates/ui/src/a.rs", 600, 300),
        ChangedFile::new("Cargo.lock", 5000, 0),
    ];
    assert_eq!(size_warning(&small), None);
    let large = vec![ChangedFile::new("crates/ui/src/a.rs", 700, 301)];
    assert!(size_warning(&large).unwrap().contains("1001"));
}
