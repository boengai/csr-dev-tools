use pdf::compile_markdown;

#[test]
fn smoke_compiles_without_panic() {
    // v2: input is raw Typst (Markdown→Typst translation lands in Task 3).
    // "= Smoke" is a valid Typst level-1 heading.
    let result = compile_markdown("= Smoke").expect("compile_markdown returned Err on simple input");
    assert!(result.page_count() >= 1, "expected at least one page");
}
