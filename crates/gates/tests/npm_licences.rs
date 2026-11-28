//! The npm licence check (`docs/quality/gates.md` → "Dependencies"): every
//! package in `pnpm licenses list --json --prod` is under a licence
//! `deny.toml` allows.

use std::path::Path;

use gates::npm_licences::{allowed_licences, check_licences};

fn read(path: &str) -> std::io::Result<String> {
    std::fs::read_to_string(Path::new(env!("CARGO_MANIFEST_DIR")).join(path))
}

fn allowed() -> Result<Vec<String>, String> {
    let deny = read("../../deny.toml").map_err(|error| error.to_string())?;
    allowed_licences(&deny)
}

#[test]
fn the_allowed_list_is_deny_toml_s() {
    let allowed = allowed().unwrap();
    assert!(allowed.iter().any(|licence| licence == "MIT"));
    assert!(
        allowed
            .iter()
            .any(|licence| licence == "Apache-2.0 WITH LLVM-exception")
    );
    assert!(!allowed.iter().any(|licence| licence == "MPL-2.0"));
}

#[test]
fn the_fixture_fails_on_each_package_outside_the_list() {
    let found = check_licences(
        &read("fixtures/npm/licences.json").unwrap(),
        &allowed().unwrap(),
    )
    .unwrap();
    let at: Vec<&str> = found.iter().map(|finding| finding.at.as_str()).collect();
    assert_eq!(
        at,
        vec![
            "bad-alternative@8.0.0",
            "bad-both@5.0.0",
            "bad-gpl@1.0.0, 1.1.0",
            "bad-unknown@6.0.0",
            "bad-unparsed@7.0.0",
        ],
        "{found:#?}"
    );
    assert!(
        found[0].message.contains("not a licence expression"),
        "{found:#?}"
    );
    assert!(found[1].message.contains("do not satisfy"), "{found:#?}");
}

#[test]
fn output_that_is_not_pnpm_s_shape_is_an_error() {
    let allowed = allowed().unwrap();
    for json in ["", "[]", r#"{"MIT": {}}"#, r#"{"MIT": [{"versions": []}]}"#] {
        assert!(check_licences(json, &allowed).is_err(), "read {json:?}");
    }
    assert_eq!(check_licences("{}", &allowed).unwrap(), vec![]);
    // pnpm 10 prints this, not JSON, when there is nothing to list.
    assert_eq!(
        check_licences("No licenses in packages found\n", &allowed).unwrap(),
        vec![]
    );
}
