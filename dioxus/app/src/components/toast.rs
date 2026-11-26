//! Toasts for actions (copy, rejected files, a failed run), as React's
//! `ToastProvider`: the region is always in the shell, like Radix's viewport.
use dioxus::prelude::*;

use crate::browser;
use crate::icons::{CheckIcon, XIcon};

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ToastKind {
    Success,
    Error,
}

#[derive(Clone, Debug, PartialEq)]
struct Item {
    id: u64,
    kind: ToastKind,
    label: String,
}

#[derive(Clone, Copy)]
pub struct Toasts {
    items: Signal<Vec<Item>>,
    next: Signal<u64>,
}

impl Toasts {
    pub fn show(mut self, kind: ToastKind, label: impl Into<String>) {
        let id = *self.next.peek();
        self.next.set(id + 1);
        self.items.write().push(Item { id, kind, label: label.into() });
        let ms = if kind == ToastKind::Error { 3000 } else { 1500 };
        let mut items = self.items;
        // Not tied to the caller's scope: the toast outlives a tool that unmounts.
        wasm_bindgen_futures::spawn_local(async move {
            browser::sleep(ms).await;
            items.write().retain(|i| i.id != id);
        });
    }
}

pub fn use_toasts() -> Toasts {
    use_context::<Toasts>()
}

/// Provides [`Toasts`] to `children` and renders the notification region.
#[component]
pub fn ToastProvider(children: Element) -> Element {
    let toasts = use_context_provider(|| Toasts { items: Signal::new(Vec::new()), next: Signal::new(0) });
    rsx! {
        {children}
        div { role: "region", "aria-label": "Notifications (F8)", tabindex: "-1", style: "pointer-events: none",
            ol {
                tabindex: "-1",
                class: "pointer-events-none fixed top-0 left-1/2 z-999 mt-(--header-height) flex w-full -translate-x-1/2 flex-col-reverse items-center gap-2 p-2 outline-none",
                for item in toasts.items.read().iter().cloned() {
                    li { key: "{item.id}", role: "status", "aria-live": "off", "aria-atomic": "true", class: "popover flex w-fit items-center gap-2 rounded-sm p-2 text-body-sm",
                        div { class: "rounded-full p-0.5", class: if item.kind == ToastKind::Error { "bg-error" } else { "bg-success" },
                            if item.kind == ToastKind::Error { XIcon { size: 12 } } else { CheckIcon {} }
                        }
                        span { class: "capitalize", "{item.label}" }
                    }
                }
            }
        }
    }
}
