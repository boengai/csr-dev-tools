//! Image Converter (file-processor layout, batch): file upload, a queue, and
//! the browser's image codecs through a canvas.
use std::rc::Rc;

use csr_logic::files::{output_name, Noun};
use dioxus::prelude::*;

use crate::browser;
use crate::components::{Select, SelectItem};
use crate::meta;
use crate::shells::{BatchFileProcessor, Process, Processed};

const IMAGE: Noun = Noun { one: "image", other: "images" };

fn label(mime: &str) -> &'static str {
    match mime {
        "image/avif" => "AVIF",
        "image/bmp" => "BMP",
        "image/gif" => "GIF",
        "image/jpeg" => "JPEG",
        "image/png" => "PNG",
        _ => "WebP",
    }
}

fn extension(mime: &str) -> &'static str {
    match mime {
        "image/avif" => "avif",
        "image/bmp" => "bmp",
        "image/gif" => "gif",
        "image/jpeg" => "jpg",
        "image/png" => "png",
        _ => "webp",
    }
}

fn is_lossy(mime: &str) -> bool {
    matches!(mime, "image/avif" | "image/jpeg" | "image/webp")
}

#[component]
pub fn ImageConverter() -> Element {
    let tool = meta::tool("image-converter");
    let mut format = use_signal(|| "image/webp".to_string());
    let mut quality = use_signal(|| "0.8".to_string());
    let formats = use_hook(|| {
        browser::encodable_formats()
            .into_iter()
            .map(|f| SelectItem { value: f.to_string(), label: label(f).to_string() })
            .collect::<Vec<_>>()
    });
    let qualities: Vec<SelectItem> = (1..=20)
        .map(|i| SelectItem { value: format!("{}", f64::from(i * 5) / 100.0), label: format!("{}% Qual.", i * 5) })
        .collect();

    let (mime, q) = (format(), quality());
    let q_num: f64 = q.parse().unwrap_or(0.8);
    let process_mime = mime.clone();
    let process = Process(Rc::new(move |url, _file| {
        let mime = process_mime.clone();
        Box::pin(async move {
            let (blob, width, height) = browser::encode_image(&url, &mime, q_num).await?;
            Ok(Processed { blob, width, height })
        })
    }));
    let ext = extension(&mime);

    rsx! {
        BatchFileProcessor {
            title: tool.name,
            description: tool.description,
            accept: "image/*",
            action_label: "Convert",
            upload_label: "Select images from your device",
            noun: IMAGE,
            result_label: "Converted",
            zip_prefix: "converted",
            settings: rsx! {
                div { class: "flex w-full gap-2 *:w-1/2",
                    div {
                        Select { aria_label: "Image format", name: "format", value: mime.clone(), items: formats.clone(), onchange: move |v| format.set(v) }
                    }
                    div {
                        Select { aria_label: "Image quality", name: "quality", value: q.clone(), items: qualities, disabled: !is_lossy(&mime), onchange: move |v| quality.set(v) }
                    }
                }
            },
            process,
            output_name: move |name: String| output_name(&name, ext, browser::now_ms()),
            preview_key: format!("{mime}|{q}"),
            reject_label: "Skipped files that are not images",
            failure_label: "Image conversion failed — try a different format or smaller file",
        }
    }
}
