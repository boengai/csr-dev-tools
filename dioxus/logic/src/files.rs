//! File naming and labels for the File Processor shell, matching src/utils/file.ts
//! and FileProcessorParts.tsx.

/// What a Tool calls its files: "1 image", "3 images".
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Noun {
    pub one: &'static str,
    pub other: &'static str,
}

pub fn count_label(count: usize, noun: Noun) -> String {
    format!("{count} {}", if count == 1 { noun.one } else { noun.other })
}

/// `csr-dev-tools_<stem>_<now>.<ext>`: every dot but the last becomes `_`, and so
/// does anything outside `[A-Za-z0-9_-]`.
pub fn output_name(source: &str, ext: &str, now_ms: u64) -> String {
    let parts: Vec<&str> = source.split('.').collect();
    let stem: String = parts[..parts.len().saturating_sub(1)]
        .join("_")
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    format!("csr-dev-tools_{stem}_{now_ms}.{ext}")
}

/// `name`, or `<stem>-<n><ext>` with the first free `n`.
pub fn dedupe(name: &str, is_taken: impl Fn(&str) -> bool) -> String {
    if !is_taken(name) {
        return name.to_string();
    }
    let (stem, ext) = match name.rfind('.') {
        Some(dot) if dot > 0 => name.split_at(dot),
        _ => (name, ""),
    };
    (1..).map(|n| format!("{stem}-{n}{ext}")).find(|c| !is_taken(c)).expect("a free name exists")
}

pub fn format_size(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    match bytes as f64 {
        b if b < KB => format!("{bytes} B"),
        b if b < KB * KB => format!("{:.1} KB", b / KB),
        b => format!("{:.1} MB", b / (KB * KB)),
    }
}

/// Whether a file satisfies an `<input accept>` string. Dropped files bypass the
/// picker's filter, so the shell re-checks them.
pub fn matches_accept(mime: &str, name: &str, accept: &str) -> bool {
    let mime = mime.to_lowercase();
    let name = name.to_lowercase();
    let tokens: Vec<String> = accept.split(',').map(|t| t.trim().to_lowercase()).filter(|t| !t.is_empty()).collect();
    tokens.is_empty()
        || tokens.iter().any(|t| {
            if t.starts_with('.') {
                name.ends_with(t.as_str())
            } else if let Some(prefix) = t.strip_suffix('*') {
                mime.starts_with(prefix)
            } else {
                mime == *t
            }
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    const IMAGE: Noun = Noun { one: "image", other: "images" };

    #[test]
    fn output_name_stamps_the_stem_and_swaps_the_extension() {
        assert_eq!(output_name("a.png", "webp", 1700), "csr-dev-tools_a_1700.webp");
        assert_eq!(output_name("my photo.final.JPG", "png", 5), "csr-dev-tools_my_photo_final_5.png");
    }

    #[test]
    fn dedupe_appends_a_counter_before_the_extension() {
        let taken = ["x.webp", "x-1.webp"];
        assert_eq!(dedupe("x.webp", |n| taken.contains(&n)), "x-2.webp");
        assert_eq!(dedupe("y.webp", |n| taken.contains(&n)), "y.webp");
    }

    #[test]
    fn format_size_uses_one_decimal_above_a_kilobyte() {
        assert_eq!(format_size(512), "512 B");
        assert_eq!(format_size(1536), "1.5 KB");
        assert_eq!(format_size(3 * 1024 * 1024), "3.0 MB");
    }

    #[test]
    fn matches_accept_handles_wildcards_and_extensions() {
        assert!(matches_accept("image/png", "a.png", "image/*"));
        assert!(!matches_accept("text/plain", "a.txt", "image/*"));
        assert!(matches_accept("", "a.SVG", ".svg, image/png"));
        assert!(matches_accept("anything", "x", ""));
    }

    #[test]
    fn count_label_picks_the_noun_by_count() {
        assert_eq!(count_label(1, IMAGE), "1 image");
        assert_eq!(count_label(3, IMAGE), "3 images");
    }
}
