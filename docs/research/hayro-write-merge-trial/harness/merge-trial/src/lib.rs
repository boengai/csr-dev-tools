//! #43 trial: the combine-pdf merge behind ADR-0033's facade,
//! `merge([{bytes, pages}]) -> bytes`, with one candidate per cargo feature.
//!
//! Semantics mirror `combinePdfPages` in `src/utils/combine-pdf.ts`:
//! - an empty plan returns empty bytes and 0 pages;
//! - each source loads once, and one that fails to load is reported in
//!   `skipped` (deduplicated) and its pages are dropped;
//! - an out-of-range page index is ignored;
//! - otherwise the output holds the planned pages in order, even if that is
//!   zero pages.
//! The `.pdf` file-name check stays in JS, as it is today.

use wasm_bindgen::prelude::*;

#[cfg(all(feature = "hw", feature = "lo"))]
compile_error!("build one candidate at a time: --features hw or --features lo");

#[wasm_bindgen]
pub struct MergeResult {
    pdf: Vec<u8>,
    page_count: u32,
    skipped: Vec<u32>,
}

#[wasm_bindgen]
impl MergeResult {
    #[wasm_bindgen(getter)]
    pub fn pdf(&self) -> Vec<u8> {
        self.pdf.clone()
    }
    #[wasm_bindgen(getter, js_name = pageCount)]
    pub fn page_count(&self) -> u32 {
        self.page_count
    }
    /// Indices into `sources` that failed to load.
    #[wasm_bindgen(getter)]
    pub fn skipped(&self) -> Vec<u32> {
        self.skipped.clone()
    }
}

/// `sources`: an array of `Uint8Array`. `plan`: flat `[source, page, source, page, …]`.
#[wasm_bindgen]
pub fn merge(sources: js_sys::Array, plan: Vec<u32>) -> MergeResult {
    let sources: Vec<Vec<u8>> = sources
        .iter()
        .map(|v| js_sys::Uint8Array::new(&v).to_vec())
        .collect();
    let plan: Vec<(usize, usize)> = plan
        .chunks_exact(2)
        .map(|p| (p[0] as usize, p[1] as usize))
        .collect();
    merge_impl(&sources, &plan)
}

/// The engine's name, for the harness's logs.
#[wasm_bindgen]
pub fn engine() -> String {
    #[cfg(feature = "hw")]
    return "hayro-write 0.9.0".into();
    #[cfg(feature = "lo")]
    return "lopdf 0.47.0".into();
    #[cfg(not(any(feature = "hw", feature = "lo")))]
    return "none".into();
}

pub fn merge_impl(sources: &[Vec<u8>], plan: &[(usize, usize)]) -> MergeResult {
    if plan.is_empty() {
        return MergeResult { pdf: Vec::new(), page_count: 0, skipped: Vec::new() };
    }
    imp::merge(sources, plan)
}

/// Load each planned source once, in first-use order. Returns the loaded
/// docs (None = failed) and the skipped source indices.
fn load_all<D>(
    sources: &[Vec<u8>],
    plan: &[(usize, usize)],
    load: impl Fn(&[u8]) -> Option<D>,
) -> (Vec<Option<D>>, Vec<u32>) {
    let mut docs: Vec<Option<D>> = (0..sources.len()).map(|_| None).collect();
    let mut tried = vec![false; sources.len()];
    let mut skipped = Vec::new();
    for &(s, _) in plan {
        if s >= sources.len() || tried[s] {
            continue;
        }
        tried[s] = true;
        docs[s] = load(&sources[s]);
        if docs[s].is_none() {
            skipped.push(s as u32);
        }
    }
    (docs, skipped)
}

// ---------------------------------------------------------------- candidate A
#[cfg(feature = "hw")]
mod imp {
    use super::*;
    use hayro_write::pdf_writer::{Finish, Pdf as Writer, Ref};
    use hayro_syntax::Pdf;
    use hayro_write::{ChunkSettings, ExtractionQuery, extract};

    pub fn merge(sources: &[Vec<u8>], plan: &[(usize, usize)]) -> MergeResult {
        let (docs, skipped) = load_all(sources, plan, |b| Pdf::new(b.to_vec()).ok());

        // Keep the valid items, then group consecutive same-source items into
        // runs. Each `extract` call writes one page-tree parent for its pages,
        // so each run becomes one intermediate /Pages node.
        let mut runs: Vec<(usize, Vec<usize>)> = Vec::new();
        for &(s, p) in plan {
            let Some(Some(doc)) = docs.get(s) else { continue };
            if p >= doc.pages().len() {
                continue;
            }
            match runs.last_mut() {
                Some((rs, pages)) if *rs == s => pages.push(p),
                _ => runs.push((s, vec![p])),
            }
        }

        let mut out = Writer::new();
        let mut next = Ref::new(1);
        let catalog = next.bump();
        let root = next.bump();
        let mut kids = Vec::new();
        let mut total = 0i32;

        for (s, pages) in &runs {
            let doc = docs[*s].as_ref().unwrap();
            let queries: Vec<_> = pages.iter().map(|&p| ExtractionQuery::new_page(p)).collect();
            let Ok(res) = extract(doc, Box::new(|| next.bump()), ChunkSettings::default(), &queries)
            else {
                continue;
            };
            let refs: Vec<Ref> = res.root_refs.iter().filter_map(|r| r.ok()).collect();
            let mut node = out.pages(res.page_tree_parent_ref);
            node.parent(root).kids(refs.iter().copied()).count(refs.len() as i32);
            node.finish();
            out.extend(&res.chunk);
            kids.push(res.page_tree_parent_ref);
            total += refs.len() as i32;
        }

        out.pages(root).kids(kids).count(total);
        out.catalog(catalog).pages(root);
        MergeResult { pdf: out.finish(), page_count: total as u32, skipped }
    }
}

// ---------------------------------------------------------------- candidate B
#[cfg(feature = "lo")]
mod imp {
    use super::*;
    use lopdf::{Dictionary, Document, Object, ObjectId};
    use std::collections::{BTreeMap, HashSet};

    const INHERITABLE: [&[u8]; 4] = [b"Resources", b"MediaBox", b"CropBox", b"Rotate"];

    fn inherited(doc: &Document, page: &Dictionary, key: &[u8]) -> Option<Object> {
        let mut parent = page.get(b"Parent").and_then(Object::as_reference).ok();
        let mut guard = 0;
        while let Some(id) = parent {
            guard += 1;
            if guard > 64 {
                return None;
            }
            let node = doc.get_dictionary(id).ok()?;
            if let Ok(v) = node.get(key) {
                return Some(v.clone());
            }
            parent = node.get(b"Parent").and_then(Object::as_reference).ok();
        }
        None
    }

    pub fn merge(sources: &[Vec<u8>], plan: &[(usize, usize)]) -> MergeResult {
        let (mut docs, skipped) = load_all(sources, plan, |b| Document::load_mem(b).ok());

        let mut out = Document::with_version("1.7");
        let pages_id = out.new_object_id();
        // Per source: its page ids (0-based) after renumbering into `out`.
        let mut page_ids: Vec<Option<Vec<ObjectId>>> = vec![None; sources.len()];

        for (s, slot) in docs.iter_mut().enumerate() {
            let Some(doc) = slot.as_mut() else { continue };
            doc.renumber_objects_with(out.max_id + 1);
            out.max_id = doc.max_id;
            let pages: BTreeMap<u32, ObjectId> = doc.get_pages();
            let ids: Vec<ObjectId> = pages.values().copied().collect();

            // Push inherited attributes down onto every page, so a page stays
            // whole once its old ancestors are gone.
            for &pid in &ids {
                let Ok(page) = doc.get_dictionary(pid) else { continue };
                let mut fill = Vec::new();
                for key in INHERITABLE {
                    if !page.has(key) {
                        if let Some(v) = inherited(doc, page, key) {
                            fill.push((key, v));
                        }
                    }
                }
                if let Ok(page) = doc.get_dictionary_mut(pid) {
                    for (k, v) in fill {
                        page.set(k, v);
                    }
                }
            }

            // Drop the old catalog and page-tree nodes, so outlines, the
            // AcroForm and unselected pages are not dragged in through /Parent.
            let root = doc.trailer.get(b"Root").and_then(Object::as_reference).ok();
            let mut drop: Vec<ObjectId> = root.into_iter().collect();
            for (id, obj) in &doc.objects {
                if let Ok(d) = obj.as_dict() {
                    if d.get(b"Type").and_then(Object::as_name).ok() == Some(b"Pages") {
                        drop.push(*id);
                    }
                }
            }
            for id in drop {
                doc.objects.remove(&id);
            }
            for (id, obj) in std::mem::take(&mut doc.objects) {
                out.objects.insert(id, obj);
            }
            page_ids[s] = Some(ids);
        }

        // Build the new page tree in plan order. A page used twice is cloned.
        let mut kids: Vec<Object> = Vec::new();
        let mut used: HashSet<ObjectId> = HashSet::new();
        let mut selected: HashSet<ObjectId> = HashSet::new();
        for &(s, p) in plan {
            let Some(Some(ids)) = page_ids.get(s) else { continue };
            let Some(&pid) = ids.get(p) else { continue };
            let id = if used.insert(pid) {
                pid
            } else {
                let Ok(dict) = out.get_dictionary(pid) else { continue };
                let copy = dict.clone();
                out.add_object(copy)
            };
            if let Ok(page) = out.get_dictionary_mut(id) {
                page.set("Parent", pages_id);
            }
            selected.insert(id);
            kids.push(id.into());
        }

        // An unselected page that something still references (a GoTo link,
        // an annotation's /P) becomes null: its target is not in the output.
        let unselected: Vec<ObjectId> = page_ids
            .iter()
            .flatten()
            .flatten()
            .copied()
            .filter(|id| !selected.contains(id))
            .collect();
        for id in unselected {
            out.objects.insert(id, Object::Null);
        }

        let count = kids.len() as i64;
        out.objects.insert(
            pages_id,
            Object::Dictionary(lopdf::dictionary! { "Type" => "Pages", "Kids" => kids, "Count" => count }),
        );
        let catalog = out.add_object(lopdf::dictionary! { "Type" => "Catalog", "Pages" => pages_id });
        out.trailer.set("Root", catalog);
        out.trailer.remove(b"Encrypt");
        out.trailer.remove(b"Info");
        out.prune_objects();

        let mut bytes = Vec::new();
        if out.save_modern(&mut bytes).is_err() {
            bytes.clear();
        }
        MergeResult { pdf: bytes, page_count: count as u32, skipped }
    }
}

#[cfg(not(any(feature = "hw", feature = "lo")))]
mod imp {
    use super::*;
    pub fn merge(_: &[Vec<u8>], _: &[(usize, usize)]) -> MergeResult {
        unimplemented!("build with --features hw or --features lo")
    }
}
