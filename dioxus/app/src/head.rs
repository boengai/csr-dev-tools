//! Head tags on client-side navigation (issue 18): the same tags the build
//! stamps into `tools/<key>/index.html`, edited in place through `web-sys`.
//! It lives in the app shell, above the lazily loaded tool, so the tags are
//! right before the tool's chunk arrives. Leaving the tools restores what the
//! page had (the home page's tags), so there is always one tag of each kind.
use dioxus::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::Element as DomElement;

use crate::browser::document;
use crate::meta::{ToolMeta, SITE_ORIGIN};

/// `(selector, attribute that holds the value, tag to create if missing)`.
const TAGS: [(&str, &str, &str); 7] = [
    (r#"meta[name="description"]"#, "content", r#"meta name="description""#),
    (r#"meta[property="og:title"]"#, "content", r#"meta property="og:title""#),
    (r#"meta[property="og:description"]"#, "content", r#"meta property="og:description""#),
    (r#"meta[property="og:url"]"#, "content", r#"meta property="og:url""#),
    (r#"meta[name="twitter:title"]"#, "content", r#"meta name="twitter:title""#),
    (r#"meta[name="twitter:description"]"#, "content", r#"meta name="twitter:description""#),
    (r#"link[rel="canonical"]"#, "href", r#"link rel="canonical""#),
];

fn values(meta: &ToolMeta) -> [String; 7] {
    let url = format!("{SITE_ORIGIN}{}", meta.route_path);
    let (title, description) = (meta.seo_title.to_string(), meta.seo_description.to_string());
    [description.clone(), title.clone(), description.clone(), url.clone(), title, description, url]
}

fn tag(selector: &str, create: &str) -> DomElement {
    let doc = document();
    if let Ok(Some(found)) = doc.query_selector(selector) {
        return found;
    }
    // `create` is `<name> <attr>="<value>"`: build the element by hand.
    let (name, attr) = create.split_once(' ').expect("tag spec");
    let (key, value) = attr.split_once('=').expect("attribute spec");
    let el = doc.create_element(name).expect("element");
    let _ = el.set_attribute(key, value.trim_matches('"'));
    let _ = doc.head().expect("head").append_child(el.unchecked_ref());
    el
}

#[derive(Clone)]
struct Saved {
    title: String,
    tags: Vec<String>,
}

fn capture() -> Saved {
    Saved {
        title: document().title(),
        tags: TAGS.iter().map(|(sel, attr, create)| tag(sel, create).get_attribute(attr).unwrap_or_default()).collect(),
    }
}

fn apply(title: &str, values: &[String]) {
    let doc = document();
    if doc.title() != title {
        doc.set_title(title);
    }
    for ((sel, attr, create), value) in TAGS.iter().zip(values) {
        let el = tag(sel, create);
        if el.get_attribute(attr).as_deref() != Some(value.as_str()) {
            let _ = el.set_attribute(attr, value);
        }
    }
}

/// Renders nothing. While mounted, the head carries `meta`'s tags; a new
/// `meta` re-applies them, and unmounting restores the tags it found.
#[component]
pub fn ToolHead(meta: ToolMeta) -> Element {
    let saved = use_hook(capture);
    // During render, like useToolSeo, so the tab title changes with the first frame.
    apply(meta.seo_title, &values(&meta));
    use_drop(move || apply(&saved.title, &saved.tags));
    rsx! {}
}
