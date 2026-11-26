use dioxus::prelude::*;
use dioxus::web::WebEventExt;
use wasm_bindgen::JsCast;
use web_sys::{File, HtmlInputElement};

use super::{Button, ButtonVariant};
use crate::icons::UploadIcon;

pub fn file_list(list: Option<web_sys::FileList>) -> Vec<File> {
    let Some(list) = list else { return Vec::new() };
    (0..list.length()).filter_map(|i| list.get(i)).collect()
}

/// A hidden `<input type="file">` behind a button, as React's `UploadInput`.
#[component]
pub fn UploadInput(
    name: String,
    accept: String,
    #[props(default)] multiple: bool,
    label: String,
    onfiles: EventHandler<Vec<File>>,
) -> Element {
    let mut input = use_signal(|| None::<HtmlInputElement>);
    rsx! {
        div { class: "relative w-full",
            input {
                class: "hidden",
                r#type: "file",
                name,
                accept,
                multiple,
                onmounted: move |e| input.set(e.as_web_event().dyn_into::<HtmlInputElement>().ok()),
                onchange: move |e| {
                    let Ok(el) = e.as_web_event().target().expect("target").dyn_into::<HtmlInputElement>() else { return };
                    let files = file_list(el.files());
                    // Reset, so picking the same file again fires `change` again.
                    el.set_value("");
                    if !files.is_empty() {
                        onfiles.call(files);
                    }
                },
            }
            Button {
                block: true,
                variant: ButtonVariant::Default,
                icon: rsx! { UploadIcon {} },
                onclick: move |_| {
                    if let Some(el) = input.read().as_ref() {
                        el.click();
                    }
                },
                "{label}"
            }
        }
    }
}
