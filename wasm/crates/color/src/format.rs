use crate::parse::{Hsl, Lab, Lch, Oklch, Rgb};

pub fn format_hex(rgb: Rgb) -> String {
    format!("#{:02x}{:02x}{:02x}", rgb.r, rgb.g, rgb.b)
}

pub fn format_rgb(rgb: Rgb) -> String {
    format!("rgb({}, {}, {})", rgb.r, rgb.g, rgb.b)
}

pub fn format_hsl(hsl: Hsl) -> String {
    format!(
        "hsl({:.2} {:.2}% {:.2}%)",
        hsl.h, hsl.s, hsl.l
    )
}

pub fn format_lab(lab: Lab) -> String {
    format!(
        "lab({:.2} {:.2} {:.2})",
        lab.l, lab.a, lab.b
    )
}

pub fn format_lch(lch: Lch) -> String {
    format!(
        "lch({:.2} {:.2} {:.2})",
        lch.l, lch.c, lch.h
    )
}

pub fn format_oklch(oklch: Oklch) -> String {
    format!(
        "oklch({:.4} {:.4} {:.2})",
        oklch.l, oklch.c, oklch.h
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_hex() {
        assert_eq!(format_hex(Rgb { r: 192, g: 128, b: 129 }), "#c08081");
    }

    #[test]
    fn test_format_rgb() {
        assert_eq!(format_rgb(Rgb { r: 192, g: 128, b: 129 }), "rgb(192, 128, 129)");
    }

    #[test]
    fn test_format_hsl() {
        assert_eq!(
            format_hsl(Hsl { h: 359.06, s: 33.68, l: 62.75 }),
            "hsl(359.06 33.68% 62.75%)"
        );
    }

    #[test]
    fn test_format_lab() {
        assert_eq!(
            format_lab(Lab { l: 60.10, a: 24.90, b: 9.63 }),
            "lab(60.10 24.90 9.63)"
        );
    }

    #[test]
    fn test_format_lch() {
        assert_eq!(
            format_lch(Lch { l: 60.10, c: 26.70, h: 21.15 }),
            "lch(60.10 26.70 21.15)"
        );
    }

    #[test]
    fn test_format_oklch() {
        assert_eq!(
            format_oklch(Oklch { l: 0.6655, c: 0.0797, h: 18.38 }),
            "oklch(0.6655 0.0797 18.38)"
        );
    }

    #[test]
    fn test_format_hsl_zeros() {
        assert_eq!(
            format_hsl(Hsl { h: 0.0, s: 0.0, l: 0.0 }),
            "hsl(0.00 0.00% 0.00%)"
        );
    }

    #[test]
    fn test_format_hsl_100() {
        assert_eq!(
            format_hsl(Hsl { h: 0.0, s: 0.0, l: 100.0 }),
            "hsl(0.00 0.00% 100.00%)"
        );
    }
}
