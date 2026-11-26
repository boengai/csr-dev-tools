//! Hash Generator (transformer layout). MD5 runs the existing `hash` crate
//! (wasm/crates/hash); the SHA family uses WebCrypto, as in React.
use dioxus::prelude::*;

use crate::browser;
use crate::components::ToggleButton;
use crate::meta;
use crate::shells::{use_debounced, TransformerShell};

const ALGORITHMS: [&str; 4] = ["MD5", "SHA-1", "SHA-256", "SHA-512"];

async fn compute(source: String, algo: &'static str) -> Result<String, String> {
    if algo == "MD5" {
        return Ok(hash::md5(&source));
    }
    browser::digest_hex(algo, &source)
        .await
        .map_err(|_| "Hash computation failed — your browser may not support this feature".to_string())
}

#[component]
pub fn HashGenerator() -> Element {
    let tool = meta::tool("hash-generator");
    let mut algo = use_signal(|| "SHA-256");
    // People hash passwords here: the input is never persisted.
    let mut source = use_signal(String::new);
    let settled = use_debounced(source, 300);
    let result = use_resource(move || {
        let (text, algo) = (settled(), algo());
        async move {
            if text.trim().is_empty() {
                return Ok(String::new());
            }
            compute(text, algo).await
        }
    });
    let (output, error) = match result.read().clone() {
        Some(Ok(out)) => (out, None),
        Some(Err(e)) => (String::new(), Some(e)),
        None => (String::new(), None),
    };

    rsx! {
        TransformerShell {
            title: "Hash Generator",
            description: tool.description,
            controls: rsx! {
                div { class: "flex flex-wrap gap-2",
                    for alg in ALGORITHMS {
                        ToggleButton { key: "{alg}", aria_label: "Select {alg} algorithm", pressed: alg == algo(), onclick: move |_| algo.set(alg), "{alg}" }
                    }
                }
            },
            source_label: "Text to hash",
            source_placeholder: "Enter text to hash...",
            source: source(),
            onsource: move |v| source.set(v),
            error,
            result_label: "{algo} Hash",
            result_placeholder: "Enter text to see its hash",
            output,
        }
    }
}
