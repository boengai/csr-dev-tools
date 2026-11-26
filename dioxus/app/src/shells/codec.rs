use dioxus::prelude::*;

use super::ToolSurface;
use crate::components::{CodeInput, CodeOutput, CopyButton, Pane, SplitPanel, StatusMessage, ToggleButton, ToolStatus};

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct CodecMode {
    pub key: &'static str,
    pub label: &'static str,
    pub source_label: &'static str,
    pub source_placeholder: &'static str,
    pub result_label: &'static str,
    pub result_placeholder: &'static str,
}

/// Codec layout (React `CodecShell`): mode toggles → toolbar → status →
/// code source ┊ result. The tool owns the mode and persistence.
#[component]
pub fn CodecShell(
    description: String,
    modes: Vec<CodecMode>,
    mode: CodecMode,
    onmode: EventHandler<CodecMode>,
    toolbar: Element,
    source: String,
    onsource: EventHandler<String>,
    error: Option<String>,
    output: String,
) -> Element {
    let output = if error.is_some() { String::new() } else { output };
    rsx! {
        ToolSurface { title: mode.label, description,
            div { class: "flex w-full grow flex-col gap-4",
                div { class: "flex items-center gap-2",
                    span { class: "text-body-xs text-gray-400", "Mode" }
                    for m in modes {
                        ToggleButton {
                            key: "{m.key}",
                            aria_label: "{m.label} mode",
                            pressed: m.key == mode.key,
                            onclick: move |_| onmode.call(m),
                            "{m.label}"
                        }
                    }
                }
                {toolbar}
                ToolStatus { messages: error.into_iter().map(StatusMessage::Error).collect::<Vec<_>>() }
                SplitPanel {
                    first: rsx! {
                        Pane {
                            fieldset { class: "flex min-h-0 w-full grow flex-col gap-1",
                                label { class: "flex min-h-8 shrink-0 items-center pl-2 text-gray-100", r#for: "dialog-source-input", id: "dialog-source-label", "{mode.source_label}" }
                                CodeInput {
                                    name: "dialog-source",
                                    label_id: "dialog-source-label",
                                    placeholder: mode.source_placeholder,
                                    value: source,
                                    onchange: onsource,
                                }
                            }
                        }
                    },
                    second: rsx! {
                        Pane { live: true,
                            CodeOutput {
                                label: rsx! {
                                    span { class: "flex items-center gap-1",
                                        span { "{mode.result_label}" }
                                        CopyButton { label: "result", value: output.clone() }
                                    }
                                },
                                placeholder: mode.result_placeholder,
                                value: output,
                            }
                        }
                    },
                }
            }
        }
    }
}
