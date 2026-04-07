/// SVG string builder for QR codes.

/// Build an SVG string from QR modules.
pub fn build_svg(
    modules: &[bool],
    qr_size: usize,
    pixel_size: usize,
    margin: usize,
    fg: &str,
    bg: &str,
) -> String {
    let total_size = (qr_size + 2 * margin) * pixel_size;

    let mut svg = String::new();
    svg.push_str(&format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {total_size} {total_size}\" width=\"{total_size}\" height=\"{total_size}\">"
    ));

    // Background
    svg.push_str(&format!(
        "<rect width=\"{total_size}\" height=\"{total_size}\" fill=\"{bg}\"/>"
    ));

    // Dark modules
    for row in 0..qr_size {
        for col in 0..qr_size {
            if modules[row * qr_size + col] {
                let x = (col + margin) * pixel_size;
                let y = (row + margin) * pixel_size;
                svg.push_str(&format!(
                    "<rect x=\"{x}\" y=\"{y}\" width=\"{pixel_size}\" height=\"{pixel_size}\" fill=\"{fg}\"/>"
                ));
            }
        }
    }

    svg.push_str("</svg>");
    svg
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn svg_contains_tags() {
        let modules = vec![true, false, false, true];
        let svg = build_svg(&modules, 2, 4, 1, "#000000", "#ffffff");
        assert!(svg.contains("<svg"), "SVG should contain <svg tag");
        assert!(svg.contains("</svg>"), "SVG should contain closing </svg> tag");
    }

    #[test]
    fn svg_has_background_fill() {
        let modules = vec![true, false, false, true];
        let svg = build_svg(&modules, 2, 4, 1, "#000000", "#ffffff");
        assert!(svg.contains("fill=\"#ffffff\""), "SVG should have background fill color");
    }

    #[test]
    fn svg_has_dark_module_fill() {
        let modules = vec![true, false, false, true];
        let svg = build_svg(&modules, 2, 4, 1, "#000000", "#ffffff");
        assert!(svg.contains("fill=\"#000000\""), "SVG should have dark module fill color");
    }
}
