//! The editor bridge (issue 10): CodeMirror mounted through a typed
//! `wasm-bindgen` binding (dioxus/js/codemirror-bridge.ts), fetched with
//! `import()` and destroyed on unmount. No `document::eval`.
use std::cell::RefCell;
use std::rc::Rc;

use dioxus::prelude::*;
use dioxus::web::WebEventExt;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

const BRIDGE: Asset = asset!("/assets/generated/codemirror-bridge.js", AssetOptions::js().with_minify(false));

#[wasm_bindgen(module = "/js/codemirror.js")]
extern "C" {
    #[wasm_bindgen(catch)]
    async fn load_codemirror(url: &str) -> Result<JsValue, JsValue>;
}

#[wasm_bindgen]
extern "C" {
    type CodeMirrorModule;
    #[wasm_bindgen(method)]
    fn mount(
        this: &CodeMirrorModule,
        parent: &web_sys::HtmlElement,
        doc: &str,
        placeholder: &str,
        content_id: &str,
        labelled_by: &str,
        on_change: &js_sys::Function,
    ) -> EditorHandle;

    type EditorHandle;
    #[wasm_bindgen(method, js_name = setValue)]
    fn set_value(this: &EditorHandle, value: &str);
    #[wasm_bindgen(method)]
    fn destroy(this: &EditorHandle);
}

/// Starts fetching the editor bundle. The app shell calls it as soon as the
/// route needs an editor, so the fetch runs beside the tool's own chunk.
pub fn prefetch() {
    wasm_bindgen_futures::spawn_local(async {
        let _ = load_codemirror(&BRIDGE.to_string()).await;
    });
}

#[derive(Default)]
struct Editor {
    handle: Option<EditorHandle>,
    on_change: Option<Closure<dyn FnMut(String)>>,
}

/// `FieldForm type="code"`: `data-testid="code-input-<name>"` wraps the editor,
/// whose `.cm-content` is the labelled textbox.
#[component]
pub fn CodeInput(name: String, label_id: String, placeholder: String, value: String, onchange: EventHandler<String>) -> Element {
    let editor = use_hook(|| Rc::new(RefCell::new(Editor::default())));
    let latest = use_hook(|| Rc::new(RefCell::new(String::new())));
    latest.borrow_mut().clone_from(&value);

    // An outside change (mode switch, reset) replaces the document.
    let synced = editor.clone();
    use_effect(use_reactive!(|value| {
        if let Some(handle) = synced.borrow().handle.as_ref() {
            handle.set_value(&value);
        }
    }));

    let dropped = editor.clone();
    use_drop(move || {
        let mut e = dropped.borrow_mut();
        if let Some(handle) = e.handle.take() {
            handle.destroy();
        }
        e.on_change = None;
    });

    let content_id = format!("{name}-input");
    rsx! {
        div {
            class: "flex max-h-[90dvh] min-h-0 w-full grow flex-col overflow-scroll [&_.cm-editor]:min-h-0 [&_.cm-editor]:flex-1",
            "data-testid": "code-input-{name}",
            onmounted: move |e| {
                let Ok(parent) = e.as_web_event().dyn_into::<web_sys::HtmlElement>() else { return };
                let (editor, latest) = (editor.clone(), latest.clone());
                let (placeholder, label_id, content_id) = (placeholder.clone(), label_id.clone(), content_id.clone());
                spawn(async move {
                    let Ok(module) = load_codemirror(&BRIDGE.to_string()).await else { return };
                    let module: CodeMirrorModule = module.unchecked_into();
                    let on_change = Closure::<dyn FnMut(String)>::new(move |v: String| onchange.call(v));
                    let doc = latest.borrow().clone();
                    let handle =
                        module.mount(&parent, &doc, &placeholder, &content_id, &label_id, on_change.as_ref().unchecked_ref());
                    let mut e = editor.borrow_mut();
                    e.handle = Some(handle);
                    e.on_change = Some(on_change);
                });
            },
        }
    }
}
