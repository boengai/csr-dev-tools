use std::sync::OnceLock;

use typst::diag::{FileError, FileResult};
use typst::foundations::{Bytes, Datetime};
use typst::syntax::{FileId, Source};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, LibraryExt, World};
use typst::layout::PagedDocument;

use crate::fonts::Fonts;
use crate::preamble::PREAMBLE;

/// World impl with no filesystem access — everything (source, fonts, library)
/// is in-memory.
pub struct InMemoryWorld {
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
    main: Source,
}

impl InMemoryWorld {
    fn new(source_text: String) -> Self {
        static FONTS: OnceLock<Fonts> = OnceLock::new();
        let f = FONTS.get_or_init(Fonts::load);

        Self {
            library: LazyHash::new(Library::default()),
            book: LazyHash::new(f.book.clone()),
            fonts: f.fonts.clone(),
            main: Source::detached(source_text),
        }
    }
}

impl World for InMemoryWorld {
    fn library(&self) -> &LazyHash<Library> {
        &self.library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &self.book
    }

    fn main(&self) -> FileId {
        self.main.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.main.id() {
            Ok(self.main.clone())
        } else {
            Err(FileError::NotFound(id.vpath().as_rootless_path().into()))
        }
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        Err(FileError::NotFound(id.vpath().as_rootless_path().into()))
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.get(index).cloned()
    }

    fn today(&self, _offset: Option<i64>) -> Option<Datetime> {
        None
    }
}

/// Compile a Typst source string (already pre-pended with our preamble in
/// the caller) to per-page SVG strings + PDF bytes.
pub fn compile(typst_source: String) -> Result<(Vec<String>, Vec<u8>), String> {
    let full_source = format!("{}{}", PREAMBLE, typst_source);
    let world = InMemoryWorld::new(full_source);

    let document: PagedDocument = typst::compile(&world)
        .output
        .map_err(|errs| {
            errs.iter()
                .map(|e| e.message.to_string())
                .collect::<Vec<_>>()
                .join("\n")
        })?;

    let svgs: Vec<String> = document
        .pages
        .iter()
        .map(typst_svg::svg)
        .collect();

    let pdf = typst_pdf::pdf(&document, &typst_pdf::PdfOptions::default())
        .map_err(|errs| {
            errs.iter()
                .map(|e| e.message.to_string())
                .collect::<Vec<_>>()
                .join("\n")
        })?;

    Ok((svgs, pdf))
}
