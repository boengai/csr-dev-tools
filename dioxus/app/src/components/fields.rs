use dioxus::prelude::*;

/// Two panes side by side on tablet+, stacked on mobile, with a dashed divider.
#[component]
pub fn SplitPanel(first: Element, second: Element) -> Element {
    rsx! {
        div { class: "flex size-full grow flex-col gap-6 tablet:flex-row",
            {first}
            div { class: "border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" }
            {second}
        }
    }
}

#[component]
pub fn Pane(#[props(default)] live: bool, children: Element) -> Element {
    rsx! {
        div { class: "flex min-h-0 min-w-0 flex-1 flex-col gap-2", "aria-live": if live { "polite" }, {children} }
    }
}

/// `FieldForm type="textarea"`: a labelled textarea, `name="dialog-source"`.
#[component]
pub fn TextAreaField(label: String, placeholder: String, value: String, oninput: EventHandler<String>) -> Element {
    let id = "dialog-source-input";
    rsx! {
        fieldset { class: "flex min-h-0 w-full grow flex-col gap-1",
            label { class: "flex min-h-8 shrink-0 items-center pl-2 text-gray-100", r#for: id, id: "{id}-label", "{label}" }
            div { class: "flex h-auto max-h-[90dvh] min-h-0 w-full grow cursor-pointer flex-col items-center justify-between gap-2 rounded-sm border border-gray-700 bg-gray-950 px-4 py-2 text-gray-200 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_2px_oklch(0.55_0.22_310/0.15)]",
                textarea {
                    id,
                    name: "dialog-source",
                    autocomplete: "off",
                    autocorrect: "off",
                    class: "w-full grow resize-none",
                    placeholder,
                    rows: "4",
                    spellcheck: "false",
                    value,
                    oninput: move |e| oninput.call(e.value()),
                }
            }
        }
    }
}

/// The read-only result block. `pre[data-has-value]` marks a real result for
/// the e2e specs and the perf harness.
#[component]
pub fn CodeOutput(label: Element, placeholder: String, value: String) -> Element {
    rsx! {
        fieldset { class: "flex min-h-0 w-full grow flex-col gap-1",
            label { class: "flex min-h-8 shrink-0 items-center pl-2 text-gray-400", {label} }
            pre {
                class: "max-h-[90dvh] min-h-0 grow overflow-auto rounded-sm border border-gray-800 bg-gray-950 p-4 font-mono text-body-sm break-all whitespace-pre-wrap text-gray-200",
                "data-has-value": if !value.is_empty() { "" },
                if value.is_empty() {
                    span { class: "text-gray-600", "{placeholder}" }
                } else {
                    "{value}"
                }
            }
        }
    }
}
