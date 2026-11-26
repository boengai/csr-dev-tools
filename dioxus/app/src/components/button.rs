use dioxus::prelude::*;

use crate::browser;
use crate::icons::{CheckIcon, CopyIcon};

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub enum ButtonVariant {
    #[default]
    Default,
    Primary,
}

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub enum ButtonSize {
    #[default]
    Default,
    Small,
}

// Whole literals, so Tailwind's scanner finds every class (issue 12).
const BUTTON_BASE: &str = "relative inline-flex shrink-0 items-center justify-center rounded-md font-medium shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-[color,background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

impl ButtonVariant {
    const fn class(self) -> &'static str {
        match self {
            Self::Default => "border border-primary bg-transparent text-white hover:bg-primary/90 hover:text-white",
            Self::Primary => "border-none bg-primary text-white hover:bg-primary/90",
        }
    }
}

impl ButtonSize {
    const fn class(self) -> &'static str {
        match self {
            Self::Default => "min-h-10 px-4 py-2",
            Self::Small => "min-h-8 px-3 py-1 text-body-sm",
        }
    }
}

#[component]
pub fn Button(
    #[props(default)] variant: ButtonVariant,
    #[props(default)] size: ButtonSize,
    #[props(default)] block: bool,
    #[props(default)] disabled: bool,
    aria_label: Option<String>,
    icon: Option<Element>,
    onclick: EventHandler<MouseEvent>,
    children: Element,
) -> Element {
    let class = format!("{BUTTON_BASE} {} {}{}", variant.class(), size.class(), if block { " w-full" } else { "" });
    rsx! {
        button {
            class: "{class}",
            "aria-label": aria_label,
            disabled,
            r#type: "button",
            onclick: move |e| onclick.call(e),
            span { class: "flex items-center justify-center gap-x-2 [&>svg]:shrink-0", {icon} {children} }
        }
    }
}

#[component]
pub fn ToggleButton(aria_label: String, pressed: bool, onclick: EventHandler<MouseEvent>, children: Element) -> Element {
    rsx! {
        button {
            "aria-label": aria_label,
            "aria-pressed": pressed,
            class: "rounded border px-3 font-mono text-xs leading-7 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500",
            "data-state": if pressed { "active" } else { "inactive" },
            r#type: "button",
            onclick: move |e| onclick.call(e),
            {children}
        }
    }
}

#[component]
pub fn CopyButton(label: String, value: String) -> Element {
    let mut copied = use_signal(|| false);
    let toasts = super::use_toasts();
    let empty = value.is_empty();
    rsx! {
        button {
            "aria-label": "Copy {label} to clipboard",
            class: "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-body-sm transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
            disabled: empty,
            r#type: "button",
            onclick: move |_| {
                browser::copy_text(&value);
                toasts.show(super::ToastKind::Success, "Copied to clipboard");
                copied.set(true);
                spawn(async move {
                    browser::sleep(2000).await;
                    copied.set(false);
                });
            },
            if copied() {
                span { class: "inline-flex text-success", CheckIcon {} }
            } else {
                span { class: "inline-flex", CopyIcon {} }
            }
        }
    }
}

/// The Radix checkbox's DOM: a `role="checkbox"` button with `data-state`.
#[component]
pub fn CheckboxInput(id: String, checked: bool, onchange: EventHandler<()>) -> Element {
    rsx! {
        button {
            id,
            role: "checkbox",
            "aria-checked": checked,
            "data-state": if checked { "checked" } else { "unchecked" },
            class: "flex size-4 shrink-0 items-center justify-center rounded-sm border border-gray-600 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
            r#type: "button",
            onclick: move |_| onchange.call(()),
            if checked {
                span { class: "text-white", CheckIcon {} }
            }
        }
    }
}
