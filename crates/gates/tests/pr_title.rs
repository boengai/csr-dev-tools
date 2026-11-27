//! A PR title names its kind (`docs/quality/gates.md` → "PR kinds").

use gates::pr_kind::{Kind, parse_title};

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
