use dioxus::prelude::*;

use super::ToolSurface;
use crate::components::{CodeOutput, CopyButton, Pane, SplitPanel, StatusMessage, TextAreaField, ToolStatus};

/// Transformer layout (React `TransformerShell`, text output, textarea source):
/// controls → status → source ┊ result.
#[component]
pub fn TransformerShell(
    title: String,
    description: String,
    controls: Element,
    source_label: String,
    source_placeholder: String,
    source: String,
    onsource: EventHandler<String>,
    error: Option<String>,
    result_label: String,
    result_placeholder: String,
    output: String,
) -> Element {
    // A stale result next to an error reads as valid output: clear it.
    let output = if error.is_some() { String::new() } else { output };
    let has_value = !output.is_empty();
    rsx! {
        ToolSurface { title, description,
            div { class: "flex w-full grow flex-col gap-4",
                div { class: "flex flex-wrap items-end gap-4", {controls} }
                ToolStatus { messages: error.into_iter().map(StatusMessage::Error).collect::<Vec<_>>() }
                SplitPanel {
                    first: rsx! {
                        Pane {
                            TextAreaField { label: source_label, placeholder: source_placeholder, value: source, oninput: onsource }
                        }
                    },
                    second: rsx! {
                        Pane { live: true,
                            section {
                                "aria-label": "{result_label}",
                                class: "flex min-h-0 w-full grow flex-col gap-1",
                                "data-has-value": if has_value { "" },
                                "data-output-kind": "text",
                                "data-slot": "tool-output",
                                CodeOutput {
                                    label: rsx! {
                                        span { class: "flex min-h-8 shrink-0 items-center gap-1 pl-2 text-gray-400",
                                            span { "{result_label}" }
                                            CopyButton { label: result_label.clone(), value: output.clone() }
                                        }
                                    },
                                    placeholder: result_placeholder,
                                    value: output,
                                }
                            }
                        }
                    },
                }
            }
        }
    }
}
