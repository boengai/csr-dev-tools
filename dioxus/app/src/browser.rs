//! Thin `web-sys` wrappers: timers, storage, downloads, clipboard, WebCrypto,
//! and the canvas image codecs. Everything browser-specific lives here.
use js_sys::{Promise, Uint8Array};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Blob, BlobPropertyBag, HtmlAnchorElement, HtmlCanvasElement, HtmlImageElement, Url};

pub fn window() -> web_sys::Window {
    web_sys::window().expect("a browser window")
}

pub fn document() -> web_sys::Document {
    window().document().expect("a document")
}

pub fn now_ms() -> u64 {
    js_sys::Date::now() as u64
}

pub async fn sleep(ms: i32) {
    let promise = Promise::new(&mut |resolve, _| {
        let _ = window().set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, ms);
    });
    let _ = JsFuture::from(promise).await;
}

/// Reads a JSON string stored by the React site's `useInputLocalStorage`.
pub fn read_json_string(key: &str) -> Option<String> {
    let raw = window().local_storage().ok()??.get_item(key).ok()??;
    js_sys::JSON::parse(&raw).ok()?.as_string()
}

pub fn write_json_string(key: &str, value: &str) {
    if let (Ok(Some(storage)), Ok(json)) = (window().local_storage(), js_sys::JSON::stringify(&value.into())) {
        let _ = storage.set_item(key, &String::from(json));
    }
}

pub fn query_param(name: &str) -> Option<String> {
    let search = window().location().search().ok()?;
    web_sys::UrlSearchParams::new_with_str(&search).ok()?.get(name)
}

pub fn copy_text(text: &str) {
    let _ = window().navigator().clipboard().write_text(text);
}

pub fn object_url(blob: &Blob) -> String {
    Url::create_object_url_with_blob(blob).unwrap_or_default()
}

pub fn revoke(url: &str) {
    let _ = Url::revoke_object_url(url);
}

pub fn download_blob(blob: &Blob, name: &str) {
    let url = object_url(blob);
    let a: HtmlAnchorElement = document().create_element("a").unwrap().unchecked_into();
    a.set_href(&url);
    a.set_download(name);
    a.click();
    // Revoke after the click has been handled, as src/utils/download.ts does.
    wasm_bindgen_futures::spawn_local(async move {
        sleep(0).await;
        revoke(&url);
    });
}

pub fn bytes_blob(bytes: &[u8], mime: &str) -> Blob {
    let parts = js_sys::Array::of1(&Uint8Array::from(bytes));
    let options = BlobPropertyBag::new();
    options.set_type(mime);
    Blob::new_with_u8_array_sequence_and_options(&parts, &options).expect("a blob")
}

pub async fn blob_bytes(blob: &Blob) -> Vec<u8> {
    match JsFuture::from(blob.array_buffer()).await {
        Ok(buf) => Uint8Array::new(&buf).to_vec(),
        Err(_) => Vec::new(),
    }
}

/// Hex digest through WebCrypto: `SHA-1`, `SHA-256`, `SHA-384` or `SHA-512`.
pub async fn digest_hex(algorithm: &str, text: &str) -> Result<String, String> {
    let subtle = window().crypto().map_err(|_| "no WebCrypto")?.subtle();
    let mut bytes = text.as_bytes().to_vec();
    let promise = subtle.digest_with_str_and_u8_array(algorithm, &mut bytes).map_err(|_| "digest failed")?;
    let buf = JsFuture::from(promise).await.map_err(|_| "digest failed")?;
    Ok(Uint8Array::new(&buf).to_vec().iter().map(|b| format!("{b:02x}")).collect())
}

/// Decodes the image at `url` with the browser's codecs.
pub async fn load_image(url: &str) -> Result<HtmlImageElement, String> {
    let img = HtmlImageElement::new().map_err(|_| "no image element")?;
    let promise = Promise::new(&mut |resolve, reject| {
        img.set_onload(Some(&resolve));
        img.set_onerror(Some(&reject));
    });
    img.set_src(url);
    let result = JsFuture::from(promise).await;
    img.set_onload(None);
    img.set_onerror(None);
    result.map(|_| img).map_err(|_| "Image loading failed: Failed to load image".to_string())
}

/// Natural size of the image at `url`, or 0×0 if it cannot be decoded.
pub async fn image_size(url: &str) -> (u32, u32) {
    match load_image(url).await {
        Ok(img) => (img.natural_width(), img.natural_height()),
        Err(_) => (0, 0),
    }
}

fn canvas(width: u32, height: u32) -> HtmlCanvasElement {
    let c: HtmlCanvasElement = document().create_element("canvas").unwrap().unchecked_into();
    c.set_width(width);
    c.set_height(height);
    c
}

/// Re-encodes the image at `url` as `mime` at its own size, like
/// `convertImageFormat` (src/utils/image.ts) with the `stretch` strategy.
pub async fn encode_image(url: &str, mime: &str, quality: f64) -> Result<(Blob, u32, u32), String> {
    let img = load_image(url).await?;
    let (w, h) = (img.natural_width(), img.natural_height());
    if w == 0 || h == 0 {
        return Err("Invalid image dimensions: image appears to be corrupted or empty".into());
    }
    let c = canvas(w, h);
    let ctx: web_sys::CanvasRenderingContext2d =
        c.get_context("2d").ok().flatten().ok_or("no 2d context")?.unchecked_into();
    ctx.draw_image_with_html_image_element(&img, 0.0, 0.0).map_err(|_| "draw failed")?;

    let (tx, rx) = futures_channel::oneshot::channel::<Option<Blob>>();
    // Owned by JS and freed after its one call: if this future is dropped while the
    // browser is still encoding (the tool unmounted), the callback stays valid.
    let callback = Closure::once_into_js(move |blob: Option<Blob>| {
        let _ = tx.send(blob);
    });
    c.to_blob_with_type_and_encoder_options(callback.unchecked_ref(), mime, &quality.into())
        .map_err(|_| "encode failed")?;
    let blob = rx.await.ok().flatten().ok_or("The browser could not encode this format")?;
    Ok((blob, w, h))
}

/// The formats this browser's canvas can encode, in the React order.
pub fn encodable_formats() -> Vec<&'static str> {
    let c = canvas(1, 1);
    ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp", "image/avif"]
        .into_iter()
        .filter(|f| c.to_data_url_with_type(f).is_ok_and(|url| url.starts_with(&format!("data:{f}"))))
        .collect()
}

/// The object URLs one component created. Each is revoked when the component
/// stops using it, and whatever is left when the component unmounts (the
/// set is dropped with it), so leaving a tool does not pin its images in memory.
#[derive(Default)]
pub struct ObjectUrls(std::cell::RefCell<Vec<String>>);

impl ObjectUrls {
    pub fn create(&self, blob: &Blob) -> String {
        let url = object_url(blob);
        self.0.borrow_mut().push(url.clone());
        url
    }

    pub fn revoke(&self, url: &str) {
        revoke(url);
        self.0.borrow_mut().retain(|u| u != url);
    }
}

impl Drop for ObjectUrls {
    fn drop(&mut self) {
        for url in self.0.get_mut().drain(..) {
            revoke(&url);
        }
    }
}
