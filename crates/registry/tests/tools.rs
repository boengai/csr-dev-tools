//! The generated table, read through `ToolKey`. It checks what holds for any
//! `tool-routes.ts`, so a Tool added on `main` needs no edit here: the
//! renderer's spec pins the text and order on fixed routes.

use std::collections::BTreeSet;

use registry::{Category, Layout, TOOLS, ToolKey};

#[test]
fn a_key_reads_as_tool_routes_spells_it() {
    assert_eq!(ToolKey::Base64Codec.as_str(), "base64-codec");
    assert_eq!(ToolKey::Base64Codec.tool().key, ToolKey::Base64Codec);
}

#[test]
fn every_key_finds_its_own_row_and_reads_uniquely() {
    let mut spellings = BTreeSet::new();
    for tool in &TOOLS {
        assert_eq!(tool.key.tool(), tool, "{}", tool.key.as_str());
        assert!(spellings.insert(tool.key.as_str()), "{}", tool.key.as_str());
    }
}

#[test]
fn every_custom_tool_names_its_opt_out_adr() {
    let custom = TOOLS.iter().filter(|tool| tool.layout == Layout::Custom);
    for tool in custom {
        assert!(
            tool.layout_opt_out_adr
                .is_some_and(|adr| adr.starts_with("ADR-")),
            "{}",
            tool.key.as_str()
        );
    }
}

#[test]
fn categories_and_layouts_read_as_tool_routes_spells_them() {
    assert_eq!(Category::Css.as_str(), "CSS");
    assert_eq!(Layout::FileProcessor.as_str(), "file-processor");
}
