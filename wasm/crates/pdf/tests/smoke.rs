use pdf::compile_markdown;

#[test]
fn smoke_compiles_without_panic() {
    let result = compile_markdown("# Smoke").expect("compile_markdown returned Err on simple input");
    assert!(result.page_count() >= 1, "expected at least one page");
}
