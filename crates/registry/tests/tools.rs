//! The generated table, read through `ToolKey`, holds what `tool-routes.ts` says.

use registry::{Category, Layout, TOOLS, ToolKey};

#[test]
fn a_key_reads_its_tool_from_tool_routes() {
    let tool = ToolKey::Base64Codec.tool();
    assert_eq!(ToolKey::Base64Codec.as_str(), "base64-codec");
    assert_eq!(tool.name, "Base64 Codec");
    assert_eq!(tool.category, Category::Encoding);
    assert_eq!(tool.layout, Layout::Codec);
    assert_eq!(tool.seo.title, "Base64 Codec - CSR Dev Tools");
    assert_eq!(tool.layout_opt_out_adr, None);
}

#[test]
fn a_custom_tool_carries_its_opt_out_adr() {
    let tool = ToolKey::AspectRatioCalculator.tool();
    assert_eq!(tool.layout, Layout::Custom);
    assert_eq!(tool.layout_opt_out_adr, Some("ADR-0027"));
}

#[test]
fn the_table_keeps_tool_routes_order_and_every_key_finds_its_own_row() {
    assert_eq!(TOOLS.len(), 84);
    assert_eq!(TOOLS[0].key, ToolKey::AesEncryptDecrypt);
    assert_eq!(TOOLS[83].key, ToolKey::ProtobufToJson);
    for tool in &TOOLS {
        assert_eq!(tool.key.tool(), tool, "{}", tool.key.as_str());
    }
}

#[test]
fn categories_and_layouts_read_as_tool_routes_spells_them() {
    assert_eq!(Category::Css.as_str(), "CSS");
    assert_eq!(Layout::FileProcessor.as_str(), "file-processor");
}
