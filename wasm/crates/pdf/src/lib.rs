use wasm_bindgen::prelude::*;

mod compile;
mod fonts;
mod preamble;

/// Opaque handle returned from `compile_markdown`.
#[wasm_bindgen]
#[derive(Debug)]
pub struct CompileResult {
    svgs: Vec<String>,
    pdf_bytes: Vec<u8>,
}

#[wasm_bindgen]
impl CompileResult {
    #[wasm_bindgen(getter)]
    pub fn page_count(&self) -> usize {
        self.svgs.len()
    }

    pub fn page_svg(&self, index: usize) -> Option<String> {
        self.svgs.get(index).cloned()
    }

    #[wasm_bindgen(getter)]
    pub fn pdf(&self) -> Vec<u8> {
        self.pdf_bytes.clone()
    }
}

/// Compile a Markdown string to SVG pages + PDF bytes.
///
/// v2 (this task): bypasses real Markdown translation and treats the input
/// as Typst source directly. Real MD→Typst conversion lands in Task 3.
#[wasm_bindgen]
pub fn compile_markdown(md: &str) -> Result<CompileResult, JsError> {
    if md.trim().is_empty() {
        return Ok(CompileResult { svgs: vec![], pdf_bytes: vec![] });
    }

    let (svgs, pdf_bytes) = compile::compile(md.to_string())
        .map_err(|msg| JsError::new(&format!("Typst compile failed: {}", msg)))?;

    Ok(CompileResult { svgs, pdf_bytes })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_input_returns_empty_result() {
        let result = compile_markdown("").unwrap();
        assert_eq!(result.page_count(), 0);
        assert_eq!(result.pdf().len(), 0);
    }

    #[test]
    fn typst_source_compiles_to_pdf_and_svg() {
        let result = compile_markdown("Hello world.").unwrap();
        assert!(result.page_count() >= 1, "expected at least 1 page");
        assert!(result.pdf().len() > 100, "expected non-trivial PDF bytes");
        assert!(result.page_svg(0).unwrap().contains("<svg"));
    }

    #[test]
    fn malformed_typst_returns_err() {
        // `#unclosed_block(` is invalid Typst; test via compile() directly
        // to avoid constructing JsError (panics on non-wasm targets).
        let result = compile::compile("#unclosed_block(".to_string());
        assert!(result.is_err(), "expected compile error for malformed Typst");
    }
}
