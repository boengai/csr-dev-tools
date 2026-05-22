use pdf::compile_markdown;

#[test]
fn renders_multi_section_document() {
    let md = r#"# Title

A paragraph with **bold** and *italic* text.

## Subheading

- one
- two
- three

```rust
fn main() {
    println!("hello");
}
```

Visit [example](https://example.com).
"#;

    let result = compile_markdown(md).expect("compile should succeed");
    assert!(result.page_count() >= 1, "expected at least 1 page");
    assert!(result.pdf().len() > 1000, "expected substantive PDF bytes, got {}", result.pdf().len());

    let svg = result.page_svg(0).expect("first page should exist");
    assert!(svg.contains("<svg"), "page should be valid SVG");
    assert!(svg.len() > 2000, "expected substantive SVG for multi-section doc");
}

#[test]
fn invalid_input_does_not_panic() {
    // Null bytes / control characters survive MD parsing but may break Typst.
    // Result may or may not error depending on Typst tolerance — this test
    // exists to confirm no panic, not to assert a specific error path.
    let result = compile_markdown("\u{0000}");
    let _ = result;
}
