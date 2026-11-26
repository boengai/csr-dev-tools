//! File Processor layout, batch mode (React `BatchFileProcessor`): upload area
//! → queue with a live preview of one file → Process → per-file results with
//! single and ZIP downloads. A file that fails is listed, not fatal.
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;

use csr_logic::files::{count_label, dedupe, format_size, matches_accept, Noun};
use dioxus::prelude::*;
use dioxus::web::WebEventExt;
use wasm_bindgen::JsCast;
use web_sys::{Blob, File};

use super::ToolSurface;
use crate::browser;
use crate::components::{ToastKind, Button, ButtonSize, ButtonVariant, Emoji, NotoEmoji, StatusMessage, ToolStatus, UploadInput};
use crate::icons::{ArrowIcon, DownloadIcon, UploadIcon, XIcon};

const PREVIEW_DEBOUNCE_MS: i32 = 250;

/// One file's output.
#[derive(Clone)]
pub struct Processed {
    pub blob: Blob,
    pub width: u32,
    pub height: u32,
}

type ProcessFuture = Pin<Box<dyn Future<Output = Result<Processed, String>>>>;

/// The tool's work on one file: `(object URL of the source, file)`. A new
/// value each render carries the tool's current settings.
#[derive(Clone)]
pub struct Process(pub Rc<dyn Fn(String, File) -> ProcessFuture>);

impl PartialEq for Process {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

#[derive(Clone, PartialEq)]
struct Item {
    id: u64,
    file: File,
    url: String,
    width: u32,
    height: u32,
}

#[derive(Clone, PartialEq)]
enum Outcome {
    Done { name: String, blob: Blob, url: String, width: u32, height: u32 },
    Failed(String),
}

#[derive(Clone, PartialEq)]
struct RowResult {
    item: Item,
    outcome: Outcome,
}

#[derive(Clone, Copy, PartialEq)]
enum Step {
    Queue,
    Processing,
    Results,
}

fn dims(w: u32, h: u32) -> Option<String> {
    (w > 0 && h > 0).then(|| format!("{w} × {h}"))
}

fn join(parts: &[Option<String>]) -> String {
    parts.iter().flatten().cloned().collect::<Vec<_>>().join(" · ")
}

fn size(file: &Blob) -> String {
    format_size(file.size() as u64)
}

#[component]
pub fn BatchFileProcessor(
    title: String,
    description: String,
    accept: String,
    action_label: String,
    upload_label: String,
    noun: Noun,
    result_label: String,
    zip_prefix: String,
    settings: Element,
    process: Process,
    /// Output name for a source file, e.g. `csr-dev-tools_a_<ms>.webp`.
    output_name: Callback<String, String>,
    /// Changes whenever the settings change, to re-run the live preview.
    preview_key: String,
    /// Toast when a pick or a drop holds files `accept` refuses.
    reject_label: String,
    /// Toast when every file fails: pressing Process is an action.
    failure_label: String,
) -> Element {
    let toasts = crate::components::use_toasts();
    let mut step = use_signal(|| Step::Queue);
    let mut items = use_signal(Vec::<Item>::new);
    let mut next_id = use_signal(|| 0u64);
    let selected = use_signal(|| None::<u64>);
    let mut selected_result = use_signal(|| None::<u64>);
    let mut progress = use_signal(|| (0usize, 0usize));
    let mut results = use_signal(Vec::<RowResult>::new);
    let mut run = use_signal(|| 0u64);
    let mut dragging = use_signal(|| false);

    // Live preview of one queued file with the current settings.
    let mut preview = use_signal(|| None::<Result<(Processed, String), String>>);
    let mut preview_pending = use_signal(|| false);
    let mut preview_generation = use_signal(|| 0u64);
    let preview_item = items.read().iter().find(|i| Some(i.id) == selected()).or(items.read().first()).cloned();
    let preview_target = (step() == Step::Queue).then_some(preview_item.clone()).flatten();
    let preview_process = process.clone();
    let mut last_preview_id = use_signal(|| None::<u64>);
    use_effect(use_reactive!(|preview_target, preview_key| {
        let _ = &preview_key;
        let generation = *preview_generation.peek() + 1;
        preview_generation.set(generation);
        let Some(item) = preview_target else {
            preview.set(None);
            last_preview_id.set(None);
            return;
        };
        // A new file previews at once; a settings change waits out the debounce.
        let wait = if *last_preview_id.peek() == Some(item.id) { PREVIEW_DEBOUNCE_MS } else { 0 };
        last_preview_id.set(Some(item.id));
        preview_pending.set(true);
        let process = preview_process.clone();
        spawn(async move {
            if wait > 0 {
                browser::sleep(wait).await;
            }
            if *preview_generation.peek() != generation {
                return;
            }
            let out = (process.0)(item.url.clone(), item.file.clone()).await;
            if *preview_generation.peek() != generation {
                return;
            }
            if let Some(Ok((old, url))) = preview.peek().as_ref() {
                let _ = old;
                browser::revoke(url);
            }
            preview.set(Some(out.map(|p| {
                let url = browser::object_url(&p.blob);
                (p, url)
            })));
            preview_pending.set(false);
        });
    }));

    let accept_check = accept.clone();
    let add = use_callback(move |files: Vec<File>| {
        let count = files.len();
        let valid: Vec<File> =
            files.into_iter().filter(|f| matches_accept(&f.type_(), &f.name(), &accept_check)).collect();
        if valid.len() < count {
            toasts.show(ToastKind::Error, reject_label.clone());
        }
        if valid.is_empty() {
            return;
        }
        let mut added = Vec::new();
        for file in valid {
            let id = next_id();
            next_id.set(id + 1);
            let url = browser::object_url(&file);
            added.push(Item { id, file, url, width: 0, height: 0 });
        }
        items.write().extend(added.iter().cloned());
        step.set(Step::Queue);
        for item in added {
            spawn(async move {
                let (w, h) = browser::image_size(&item.url).await;
                if let Some(it) = items.write().iter_mut().find(|i| i.id == item.id) {
                    it.width = w;
                    it.height = h;
                }
            });
        }
    });

    let run_process = process.clone();
    let start = move |_| {
        let queue = items();
        if queue.is_empty() {
            return;
        }
        let this_run = run() + 1;
        run.set(this_run);
        for r in results.peek().iter() {
            if let Outcome::Done { url, .. } = &r.outcome {
                browser::revoke(url);
            }
        }
        results.set(Vec::new());
        progress.set((0, queue.len()));
        step.set(Step::Processing);
        let process = run_process.clone();
        let failure_label = failure_label.clone();
        spawn(async move {
            let mut out: Vec<RowResult> = Vec::new();
            let mut taken: Vec<String> = Vec::new();
            for item in queue.iter().cloned() {
                let result = (process.0)(item.url.clone(), item.file.clone()).await;
                if run() != this_run {
                    return;
                }
                let outcome = match result {
                    Ok(p) => {
                        // Two inputs can share a base name: keep both.
                        let name = dedupe(&output_name.call(item.file.name()), |n| taken.iter().any(|t| t == n));
                        taken.push(name.clone());
                        let url = browser::object_url(&p.blob);
                        Outcome::Done { name, blob: p.blob, url, width: p.width, height: p.height }
                    }
                    Err(e) => Outcome::Failed(e),
                };
                out.push(RowResult { item, outcome });
                progress.set((out.len(), queue.len()));
            }
            if out.iter().all(|r| matches!(r.outcome, Outcome::Failed(_))) {
                toasts.show(ToastKind::Error, failure_label);
                step.set(Step::Queue);
                return;
            }
            results.set(out);
            selected_result.set(None);
            step.set(Step::Results);
        });
    };

    let done: Vec<RowResult> =
        results.read().iter().filter(|r| matches!(r.outcome, Outcome::Done { .. })).cloned().collect();
    let failed = results.read().len() - done.len();
    let mut messages = Vec::new();
    if step() == Step::Queue && !items.read().is_empty() {
        if let Some(Err(e)) = preview.read().as_ref() {
            messages.push(StatusMessage::Error(format!("Preview failed: {e}")));
        }
    }
    if step() == Step::Results && failed > 0 {
        let verb = if failed == 1 { "is" } else { "are" };
        messages.push(StatusMessage::Notice(format!(
            "{} could not be processed and {verb} left out of the download.",
            count_label(failed, noun)
        )));
    }

    let zip_prefix_dl = zip_prefix.clone();
    let download_all = move |_| {
        let done: Vec<(String, Blob)> = results
            .read()
            .iter()
            .filter_map(|r| match &r.outcome {
                Outcome::Done { name, blob, .. } => Some((name.clone(), blob.clone())),
                Outcome::Failed(_) => None,
            })
            .collect();
        let name = format!("csr-dev-tools_{zip_prefix_dl}_{}.zip", browser::now_ms());
        spawn(async move {
            let mut files = Vec::new();
            for (n, blob) in done {
                files.push((n, browser::blob_bytes(&blob).await));
            }
            let refs: Vec<(&str, &[u8])> = files.iter().map(|(n, b)| (n.as_str(), b.as_slice())).collect();
            let zip = csr_logic::zip::store(&refs);
            browser::download_blob(&browser::bytes_blob(&zip, "application/zip"), &name);
        });
    };

    let row_list = "flex gap-2 overflow-x-auto p-1 tablet:min-h-0 tablet:grow tablet:flex-col tablet:overflow-x-hidden tablet:overflow-y-auto";

    let body = match step() {
        Step::Processing => {
            let (d, t) = progress();
            let pct = if t > 0 { d * 100 / t } else { 0 };
            rsx! {
                div { "aria-live": "polite", class: "flex w-full grow flex-col items-center justify-center gap-6",
                    NotoEmoji { emoji: Emoji::Robot, size: 120 }
                    div { class: "flex w-full flex-col items-center gap-2 desktop:w-8/10",
                        div { class: "h-2 w-full overflow-hidden rounded-full bg-gray-800",
                            div { class: "h-full bg-primary transition-[width]", style: "width: {pct}%" }
                        }
                        span { class: "text-body-sm text-gray-400", "{d} of {t}" }
                    }
                }
            }
        }
        Step::Results => {
            let shown = done.iter().find(|r| Some(r.item.id) == selected_result()).or(done.first()).cloned();
            let rows = results.read().clone();
            let total = rows.len();
            let ready = done.len();
            let shown_dl = shown.clone();
            let footer = if ready > 1 {
                rsx! { Button { block: true, variant: ButtonVariant::Primary, icon: rsx! { DownloadIcon {} }, onclick: download_all, "Download ZIP" } }
            } else {
                rsx! {
                    Button {
                        block: true,
                        variant: ButtonVariant::Primary,
                        icon: rsx! { DownloadIcon {} },
                        onclick: move |_| {
                            if let Some(RowResult { outcome: Outcome::Done { name, blob, .. }, .. }) = shown_dl.as_ref() {
                                browser::download_blob(blob, name);
                            }
                        },
                        "Download"
                    }
                }
            };
            rsx! {
                WorkArea {
                    input: rsx! {
                        p { "aria-live": "polite", class: "shrink-0 text-body-sm text-gray-300", "{ready} of {count_label(total, noun)} ready" }
                        ul { "aria-label": "Results", class: row_list,
                            for r in rows {
                                {result_row(r, shown.as_ref().map(|s| s.item.id), selected_result)}
                            }
                        }
                    },
                    input_footer: rsx! {
                        Button { block: true, icon: rsx! { ArrowIcon {} }, onclick: move |_| step.set(Step::Queue), "Change settings" }
                    },
                    output: rsx! {
                        if let Some(s) = shown.clone() {
                            if let Outcome::Done { name, blob, url, width, height } = s.outcome.clone() {
                                Compare {
                                    label: "Before and after",
                                    original_url: s.item.url.clone(),
                                    original_details: join(&[Some(s.item.file.name()), dims(s.item.width, s.item.height), Some(size(&s.item.file))]),
                                    result_url: Some(url),
                                    result_caption: result_label.clone(),
                                    result_details: Some(join(&[Some(name), dims(width, height), Some(size(&blob))])),
                                    busy: false,
                                }
                            }
                        }
                    },
                    output_footer: footer,
                }
            }
        }
        Step::Queue if items.read().is_empty() => {
            let accept = accept.clone();
            rsx! {
                section {
                    "aria-label": "Upload area",
                    class: "flex min-h-60 grow flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed p-6 transition-colors",
                    class: if dragging() { "border-primary bg-gray-800/50" } else { "border-gray-700" },
                    "data-slot": "upload-area",
                    ondragenter: move |e| { e.prevent_default(); dragging.set(true) },
                    ondragover: move |e| { e.prevent_default(); dragging.set(true) },
                    ondragleave: move |_| dragging.set(false),
                    ondrop: move |e| {
                        e.prevent_default();
                        dragging.set(false);
                        let event: web_sys::DragEvent = e.as_web_event().unchecked_into();
                        let files = crate::components::upload::file_list(event.data_transfer().and_then(|d| d.files()));
                        if !files.is_empty() {
                            add.call(files);
                        }
                    },
                    span { "aria-hidden": "true", class: "text-gray-500", UploadIcon { size: 32 } }
                    p { class: "text-center text-body-sm text-gray-400", "Drop {noun.other} here, or" }
                    div { class: "w-full tablet:w-96",
                        UploadInput { name: noun.other, accept, multiple: true, label: upload_label.clone(), onfiles: move |f| add.call(f) }
                    }
                }
            }
        }
        Step::Queue => {
            let list = items();
            let count = list.len();
            let preview_id = preview_item.as_ref().map(|i| i.id);
            let action = if count > 1 { format!("{action_label} {}", count_label(count, noun)) } else { action_label.clone() };
            let accept = accept.clone();
            rsx! {
                WorkArea {
                    input: rsx! {
                        p { class: "shrink-0 text-body-sm text-gray-400", "{count_label(count, noun)}" }
                        ul { "aria-label": "Selected {noun.other}", class: row_list,
                            for item in list {
                                {queue_row(item, preview_id, selected, items)}
                            }
                        }
                        div { class: "shrink-0",
                            UploadInput { name: "{noun.other}-add", accept, multiple: true, label: "Add more {noun.other}", onfiles: move |f| add.call(f) }
                        }
                    },
                    input_footer: rsx! {
                        Button { block: true, variant: ButtonVariant::Primary, onclick: start, "{action}" }
                    },
                    output: rsx! {
                        if let Some(item) = preview_item.clone() {
                            {
                                let ready = preview.read().as_ref().and_then(|p| p.as_ref().ok()).cloned();
                                let pending = preview_pending();
                                rsx! {
                                    Compare {
                                        label: "Live preview",
                                        original_url: item.url.clone(),
                                        original_details: join(&[Some(item.file.name()), dims(item.width, item.height), Some(size(&item.file))]),
                                        result_url: ready.as_ref().map(|(_, url)| url.clone()),
                                        result_caption: if pending { format!("{result_label} · updating…") } else { result_label.clone() },
                                        result_details: ready.as_ref().map(|(p, _)| join(&[dims(p.width, p.height), Some(size(&p.blob))])),
                                        busy: pending,
                                    }
                                }
                            }
                        }
                    },
                    output_footer: rsx! {},
                }
            }
        }
    };

    rsx! {
        ToolSurface { title, description,
            div { class: "flex w-full grow flex-col gap-4 tablet:min-h-0",
                if step() == Step::Queue && !items.read().is_empty() {
                    div { class: "flex w-full shrink-0 flex-col gap-2", {settings} }
                }
                ToolStatus { messages }
                {body}
            }
        }
    }
}

fn queue_row(item: Item, preview_id: Option<u64>, mut selected: Signal<Option<u64>>, mut items: Signal<Vec<Item>>) -> Element {
    let is_selected = Some(item.id) == preview_id;
    let id = item.id;
    let name = item.file.name();
    rsx! {
        li { key: "{id}", class: "relative w-56 shrink-0 tablet:w-full",
            button {
                "aria-label": "Preview {name}",
                "aria-pressed": is_selected,
                class: "flex w-full items-center gap-2 rounded-sm border p-1 pr-7 text-left transition-colors",
                class: if is_selected { "border-primary bg-gray-900" } else { "border-gray-800 hover:bg-gray-900" },
                r#type: "button",
                onclick: move |_| selected.set(Some(id)),
                img { alt: "{name}", class: "size-15 shrink-0 rounded-sm object-cover", src: "{item.url}" }
                span { class: "flex min-w-0 grow flex-col",
                    span { class: "truncate text-body-sm text-gray-300", "{name}" }
                    span { class: "truncate text-body-xs text-gray-500", {join(&[dims(item.width, item.height), Some(size(&item.file))])} }
                }
            }
            button {
                "aria-label": "Remove {name}",
                class: "absolute top-1 right-1 rounded-full p-1 text-gray-400 transition-colors hover:bg-error hover:text-white",
                r#type: "button",
                onclick: move |_| {
                    let url = item.url.clone();
                    items.write().retain(|i| i.id != id);
                    browser::revoke(&url);
                },
                XIcon { size: 12 }
            }
        }
    }
}

fn result_row(r: RowResult, shown: Option<u64>, mut selected_result: Signal<Option<u64>>) -> Element {
    let id = r.item.id;
    let source_name = r.item.file.name();
    match r.outcome {
        Outcome::Done { name, blob, url, width, height } => {
            let is_shown = Some(id) == shown;
            let dl_name = name.clone();
            let details = join(&[dims(width, height), Some(format!("{} → {}", size(&r.item.file), size(&blob)))]);
            rsx! {
                li { key: "{id}", class: "flex w-64 shrink-0 items-center gap-1 tablet:w-full",
                    button {
                        "aria-label": "Compare {source_name}",
                        "aria-pressed": is_shown,
                        class: "flex min-w-0 grow items-center gap-2 rounded-sm border p-1 text-left transition-colors",
                        class: if is_shown { "border-primary bg-gray-900" } else { "border-gray-800 hover:bg-gray-900" },
                        r#type: "button",
                        onclick: move |_| selected_result.set(Some(id)),
                        img { alt: "{name}", class: "size-15 shrink-0 rounded-sm object-cover", src: "{url}" }
                        span { class: "flex min-w-0 grow flex-col",
                            span { class: "truncate text-body-sm text-gray-300", "{source_name}" }
                            span { class: "truncate text-body-xs text-gray-500", "{details}" }
                        }
                    }
                    div { class: "shrink-0",
                        Button {
                            aria_label: "Download {name}",
                            size: ButtonSize::Small,
                            icon: rsx! { DownloadIcon {} },
                            onclick: move |_| browser::download_blob(&blob, &dl_name),
                        }
                    }
                }
            }
        }
        Outcome::Failed(error) => rsx! {
            li { key: "{id}", class: "flex w-64 shrink-0 items-center gap-2 rounded-sm border border-gray-800 p-1 tablet:w-full",
                div { class: "size-15 shrink-0 rounded-sm bg-gray-800" }
                span { class: "flex min-w-0 grow flex-col",
                    span { class: "truncate text-body-sm text-gray-300", "{source_name}" }
                    span { class: "text-body-xs text-error", "Failed: {error}" }
                }
            }
        },
    }
}

#[component]
fn WorkArea(input: Element, input_footer: Element, output: Element, output_footer: Element) -> Element {
    rsx! {
        div { class: "flex grow flex-col gap-4 tablet:min-h-0 tablet:flex-row",
            div { class: "flex shrink-0 flex-col gap-2 tablet:min-h-0 tablet:w-72", "data-slot": "tool-input",
                div { class: "flex grow flex-col gap-2 tablet:min-h-0", {input} }
                div { class: "shrink-0", {input_footer} }
            }
            div { class: "flex min-w-0 flex-col gap-2 tablet:min-h-0 tablet:flex-1", "data-slot": "tool-output",
                div { class: "flex grow flex-col tablet:min-h-0", {output} }
                div { class: "shrink-0", {output_footer} }
            }
        }
    }
}

#[component]
fn Compare(
    label: String,
    original_url: String,
    original_details: String,
    result_url: Option<String>,
    result_caption: String,
    result_details: Option<String>,
    busy: bool,
) -> Element {
    rsx! {
        section {
            "aria-busy": busy,
            "aria-label": label,
            class: "bg-grid-texture flex shrink-0 flex-col rounded-sm bg-black tablet:min-h-0 tablet:min-w-0 tablet:shrink tablet:grow tablet:flex-row",
            ComparePane { alt: "original", caption: "Original", url: Some(original_url), details: Some(original_details), stale: false }
            div { class: "h-0 w-full shrink-0 border-t-2 border-dashed border-gray-700 tablet:h-full tablet:w-0 tablet:border-t-0 tablet:border-l-2" }
            ComparePane { alt: "result", caption: result_caption, url: result_url, details: result_details, stale: busy }
        }
    }
}

#[component]
fn ComparePane(alt: String, caption: String, url: Option<String>, details: Option<String>, stale: bool) -> Element {
    rsx! {
        figure { class: "flex min-h-0 min-w-0 flex-1 flex-col items-center gap-3 p-4",
            figcaption { class: "shrink-0 text-body-sm font-medium text-gray-300", "{caption}" }
            div { class: "flex min-h-0 w-full grow items-center justify-center",
                if let Some(url) = url {
                    div { class: "flex size-full items-center justify-center transition-opacity", class: if stale { "opacity-50" },
                        img { alt, class: "max-h-[30vh] max-w-full object-contain tablet:max-h-full", src: "{url}" }
                    }
                }
            }
            if let Some(details) = details {
                span { class: "shrink-0 text-center text-body-xs text-gray-500", "{details}" }
            }
        }
    }
}
