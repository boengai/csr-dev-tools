//! The overlay primitive the spike tries (issue 11): `dioxus-primitives`'
//! select, styled like React's Radix `SelectInput`.
use dioxus::prelude::*;
use dioxus_primitives::select as primitive;

use crate::icons::ChevronDownIcon;

#[derive(Clone, Debug, PartialEq)]
pub struct SelectItem {
    pub value: String,
    pub label: String,
}

#[component]
pub fn Select(
    aria_label: String,
    name: String,
    value: String,
    items: Vec<SelectItem>,
    #[props(default)] disabled: bool,
    onchange: EventHandler<String>,
) -> Element {
    rsx! {
        primitive::Select::<String> {
            default_value: Some(value),
            disabled,
            name,
            on_value_change: move |v: Option<String>| {
                if let Some(v) = v {
                    onchange.call(v);
                }
            },
            div { class: "relative w-full",
                primitive::SelectTrigger {
                    aria_label,
                    class: "flex w-full grow cursor-pointer items-center justify-between gap-2 rounded-sm border border-gray-700 bg-gray-950 px-4 py-2 text-gray-200 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_2px_oklch(0.55_0.22_310/0.15)] disabled:cursor-not-allowed disabled:opacity-50 aria-expanded:border-primary",
                    primitive::SelectValue {}
                    span { class: "text-gray-400", ChevronDownIcon {} }
                }
                primitive::SelectList {
                    class: "popover absolute top-full right-0 left-0 z-50 mt-1 max-h-72 overflow-y-auto p-1 data-[state=closed]:hidden",
                    for (index, item) in items.into_iter().enumerate() {
                        primitive::SelectOption::<String> {
                            key: "{item.value}",
                            index,
                            value: item.value.clone(),
                            text_value: item.label.clone(),
                            class: "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-body-sm text-gray-200 outline-none data-highlighted:bg-gray-800 aria-selected:text-primary-light hover:bg-gray-800",
                            "{item.label}"
                        }
                    }
                }
            }
        }
    }
}
