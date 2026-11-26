//! Escaped JSON Stringifier (codec layout). Its source is CodeMirror, so it
//! exercises the interop boundary. Mode and source persist under the React
//! site's localStorage keys, so saved inputs still load.
use csr_logic::escaped_json;
use dioxus::prelude::*;

use crate::browser;
use crate::components::CheckboxInput;
use crate::meta;
use crate::shells::{use_debounced, CodecMode, CodecShell};

const MODES: [CodecMode; 2] = [
    CodecMode {
        key: "stringify",
        label: "Stringify JSON",
        source_label: "JSON Input",
        source_placeholder: r#"{"name":"John","age":30}"#,
        result_label: "Escaped Output",
        result_placeholder: "Paste JSON to escape it as a string",
    },
    CodecMode {
        key: "parse",
        label: "Parse Escaped JSON",
        source_label: "Escaped String Input",
        source_placeholder: r#"{\"name\":\"John\",\"age\":30}"#,
        result_label: "Parsed JSON",
        result_placeholder: "Paste an escaped JSON string to parse it",
    },
];

const MODE_KEY: &str = "csr-dev-tools-escaped-json-mode";

fn source_key(mode: &str) -> String {
    format!("csr-dev-tools-escaped-json-{mode}-source")
}

fn find(key: Option<String>) -> Option<CodecMode> {
    MODES.iter().copied().find(|m| Some(m.key) == key.as_deref())
}

#[component]
pub fn EscapedJsonStringifier() -> Element {
    let tool = meta::tool("escaped-json-stringifier");
    // A `?mode=` deep link wins over the saved mode for this visit only.
    let mut mode = use_signal(|| {
        find(browser::query_param("mode")).or_else(|| find(browser::read_json_string(MODE_KEY))).unwrap_or(MODES[0])
    });
    let mut source = use_signal(|| browser::read_json_string(&source_key(mode.peek().key)).unwrap_or_default());
    let mut double = use_signal(|| false);
    let mut settled = use_debounced(source, 300);

    let result = use_memo(move || {
        let text = settled();
        if text.trim().is_empty() {
            return Ok(String::new());
        }
        match mode().key {
            "stringify" => escaped_json::stringify(&text, double()).map_err(|e| format!("Invalid JSON: {e}")),
            _ => escaped_json::parse(&text),
        }
    });
    // Empty bypass: a cleared input clears the output at once, not after the debounce.
    let (output, error) = match result() {
        _ if source.read().trim().is_empty() => (String::new(), None),
        Ok(out) => (out, None),
        Err(e) => (String::new(), Some(e)),
    };

    rsx! {
        CodecShell {
            description: tool.description,
            modes: MODES.to_vec(),
            mode: mode(),
            onmode: move |m: CodecMode| {
                if m.key == mode.peek().key {
                    return;
                }
                browser::write_json_string(MODE_KEY, m.key);
                // Mode and source change together, like React's setFieldsImmediate: the new
                // mode never computes over the other mode's text while the debounce waits.
                let restored = browser::read_json_string(&source_key(m.key)).unwrap_or_default();
                settled.set(restored.clone());
                mode.set(m);
                source.set(restored);
            },
            toolbar: rsx! {
                if mode().key == "stringify" {
                    div { class: "flex items-center gap-4",
                        label { class: "flex cursor-pointer items-center gap-2 text-body-xs text-gray-400", r#for: "double-escape",
                            CheckboxInput { id: "double-escape", checked: double(), onchange: move |_| double.toggle() }
                            "Double Escape"
                        }
                    }
                }
            },
            source: source(),
            onsource: move |v: String| {
                browser::write_json_string(&source_key(mode.peek().key), &v);
                source.set(v);
            },
            error,
            output,
        }
    }
}
