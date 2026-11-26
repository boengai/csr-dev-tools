use dioxus::prelude::*;

#[derive(Clone, Debug, PartialEq)]
pub enum StatusMessage {
    /// Why there is no output: `role="alert"`.
    Error(String),
    /// The output is valid, but…: `role="status"`.
    Notice(String),
}

/// The tool status slot: always rendered, so its place in the layout is fixed.
#[component]
pub fn ToolStatus(messages: Vec<StatusMessage>) -> Element {
    rsx! {
        div { class: "flex flex-col gap-1 empty:hidden", "data-slot": "tool-status",
            for message in messages {
                match message {
                    StatusMessage::Error(text) => rsx! {
                        p { class: "text-body-xs whitespace-pre-line text-error", role: "alert", "{text}" }
                    },
                    StatusMessage::Notice(text) => rsx! {
                        p { class: "text-body-xs text-warning", role: "status", "{text}" }
                    },
                }
            }
        }
    }
}
