use wasm_bindgen::prelude::*;

/// Opaque handle returned from `compile_markdown`.
///
/// Holds the per-page SVG strings and the PDF byte buffer.
/// JS-side consumers iterate via `page_count` + `page_svg(i)` and pull
/// the final document via `pdf` once.
#[wasm_bindgen]
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
/// v0 (this task): returns a single placeholder SVG + empty PDF.
/// Real Typst pipeline lands in Task 3.
#[wasm_bindgen]
pub fn compile_markdown(md: &str) -> Result<CompileResult, JsError> {
    if md.trim().is_empty() {
        return Ok(CompileResult {
            svgs: vec![],
            pdf_bytes: vec![],
        });
    }
    Ok(CompileResult {
        svgs: vec!["<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>".to_string()],
        pdf_bytes: vec![],
    })
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
    fn nonempty_input_returns_one_placeholder_page() {
        let result = compile_markdown("# hello").unwrap();
        assert_eq!(result.page_count(), 1);
        assert!(result.page_svg(0).unwrap().contains("<svg"));
    }
}
