//! The facade the trial measures: an opaque document handle with
//! `page_count` and `render_page(index, scale)`, one parse per document and
//! one render cache shared by its pages (the way pdf.js holds a document).

use hayro::hayro_interpret::InterpreterSettings;
use hayro::hayro_syntax::{LoadPdfError, Pdf};
use hayro::vello_cpu::color::palette::css::WHITE;
use hayro::{PixmapSettings, RenderCache, RenderSettings, render};
use self_cell::self_cell;
use wasm_bindgen::prelude::*;

self_cell!(
    struct Cell {
        owner: Pdf,
        #[not_covariant]
        dependent: RenderCache,
    }
);

#[wasm_bindgen]
pub struct Doc {
    cell: Cell,
    settings: InterpreterSettings,
}

#[wasm_bindgen]
impl Doc {
    /// Parses once. An encrypted file opens only if its user password is empty.
    #[wasm_bindgen(constructor)]
    pub fn new(bytes: Vec<u8>) -> Result<Doc, JsError> {
        let pdf = Pdf::new(bytes).map_err(|e| match e {
            LoadPdfError::Decryption(d) => JsError::new(&format!("decryption: {d:?}")),
            LoadPdfError::Invalid => JsError::new("invalid PDF"),
        })?;
        Ok(Doc { cell: Cell::new(pdf, |_| RenderCache::new()), settings: InterpreterSettings::default() })
    }

    pub fn page_count(&self) -> usize {
        self.cell.borrow_owner().pages().len()
    }

    /// Straight RGBA (opaque, because the background is white), preceded by
    /// width and height as little-endian u16.
    pub fn render_page(&self, index: usize, scale: f32) -> Result<Vec<u8>, JsError> {
        self.cell.with_dependent(|pdf, cache| {
            let page = pdf.pages().get(index).ok_or_else(|| JsError::new("page out of range"))?;
            let pix = render(
                page,
                cache,
                &self.settings,
                &RenderSettings::default(),
                &PixmapSettings { x_scale: scale, y_scale: scale, bg_color: WHITE },
            );
            let (w, h) = (pix.width(), pix.height());
            let mut out = Vec::with_capacity(4 + usize::from(w) * usize::from(h) * 4);
            out.extend_from_slice(&w.to_le_bytes());
            out.extend_from_slice(&h.to_le_bytes());
            out.extend_from_slice(pix.data_as_u8_slice());
            Ok(out)
        })
    }
}

/// Bytes of wasm linear memory, for the peak-memory check.
#[wasm_bindgen]
pub fn memory_bytes() -> usize {
    core::arch::wasm32::memory_size(0) * 65536
}
