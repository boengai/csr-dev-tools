use crate::parse::{Hsl, Lab, Lch, Oklch, Rgb};

// --- Helper functions ---

fn clamp(value: f64, min: f64, max: f64) -> f64 {
    value.min(max).max(min)
}

fn srgb_to_linear(c: f64) -> f64 {
    if c <= 0.04045 {
        c / 12.92
    } else {
        ((c + 0.055) / 1.055).powf(2.4)
    }
}

fn linear_to_srgb(c: f64) -> f64 {
    let abs_c = c.abs();
    if abs_c > 0.0031308 {
        c.signum() * (1.055 * abs_c.powf(1.0 / 2.4) - 0.055)
    } else {
        12.92 * c
    }
}

fn gamma_correction(c: f64) -> f64 {
    if c > 0.0031308 {
        1.055 * c.powf(1.0 / 2.4) - 0.055
    } else {
        12.92 * c
    }
}

fn f_inverse(t: f64, delta: f64, delta_squared: f64) -> f64 {
    if t > delta {
        t * t * t
    } else {
        3.0 * delta_squared * (t - 4.0 / 29.0)
    }
}

// D65 white point
const D65_X: f64 = 0.95047;
const D65_Y: f64 = 1.0;
const D65_Z: f64 = 1.08883;

// --- RGB to other formats ---

pub fn rgb_to_hex(rgb: Rgb) -> String {
    format!(
        "#{:02x}{:02x}{:02x}",
        rgb.r, rgb.g, rgb.b
    )
}

pub fn rgb_to_hsl(rgb: Rgb) -> Hsl {
    let r = rgb.r as f64 / 255.0;
    let g = rgb.g as f64 / 255.0;
    let b = rgb.b as f64 / 255.0;

    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let mut h = 0.0;
    let mut s = 0.0;
    let l = (max + min) / 2.0;

    if (max - min).abs() > f64::EPSILON {
        let d = max - min;
        s = if l > 0.5 {
            d / (2.0 - max - min)
        } else {
            d / (max + min)
        };

        if (max - b).abs() < f64::EPSILON {
            h = (r - g) / d + 4.0;
        } else if (max - g).abs() < f64::EPSILON {
            h = (b - r) / d + 2.0;
        } else if (max - r).abs() < f64::EPSILON {
            h = (g - b) / d + if g < b { 6.0 } else { 0.0 };
        }
        h /= 6.0;
    }

    let hue = ((h * 360.0) % 360.0 + 360.0) % 360.0;

    Hsl {
        h: hue,
        s: clamp(s * 100.0, 0.0, 100.0),
        l: clamp(l * 100.0, 0.0, 100.0),
    }
}

fn rgb_to_xyz(rgb: Rgb) -> (f64, f64, f64) {
    let lr = srgb_to_linear(rgb.r as f64 / 255.0);
    let lg = srgb_to_linear(rgb.g as f64 / 255.0);
    let lb = srgb_to_linear(rgb.b as f64 / 255.0);

    let x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
    let y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
    let z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041;

    (x, y, z)
}

pub fn rgb_to_lab(rgb: Rgb) -> Lab {
    let (x, y, z) = rgb_to_xyz(rgb);

    let xn = x / D65_X;
    let yn = y / D65_Y;
    let zn = z / D65_Z;

    let f = |t: f64| -> f64 {
        if t > 0.008856 {
            t.cbrt()
        } else {
            (t * 903.3 + 16.0) / 116.0
        }
    };

    let fx = f(xn);
    let fy = f(yn);
    let fz = f(zn);

    Lab {
        l: 116.0 * fy - 16.0,
        a: 500.0 * (fx - fy),
        b: 200.0 * (fy - fz),
    }
}

pub fn rgb_to_lch(rgb: Rgb) -> Lch {
    let (x, y, z) = rgb_to_xyz(rgb);

    let xn = x / D65_X;
    let yn = y / D65_Y;
    let zn = z / D65_Z;

    let f = |t: f64| -> f64 {
        if t > 0.008856 {
            t.cbrt()
        } else {
            (t * 903.3 + 16.0) / 116.0
        }
    };

    let fx = f(xn);
    let fy = f(yn);
    let fz = f(zn);

    let l_val = 116.0 * fy - 16.0;
    let a = 500.0 * (fx - fy);
    let b_val = 200.0 * (fy - fz);

    let c = (a * a + b_val * b_val).sqrt();
    let mut h = b_val.atan2(a).to_degrees();
    if h < 0.0 {
        h += 360.0;
    }

    Lch {
        l: l_val,
        c,
        h,
    }
}

pub fn rgb_to_oklch(rgb: Rgb) -> Oklch {
    let lr = srgb_to_linear(rgb.r as f64 / 255.0);
    let lg = srgb_to_linear(rgb.g as f64 / 255.0);
    let lb = srgb_to_linear(rgb.b as f64 / 255.0);

    // Linear RGB to LMS
    let l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    let m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    let s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

    let l = l_.cbrt();
    let m = m_.cbrt();
    let s = s_.cbrt();

    // OKLab
    let ok_l = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    let ok_a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    let ok_b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

    // OKLab -> OKLCH
    let c = (ok_a * ok_a + ok_b * ok_b).sqrt();
    let mut h = ok_b.atan2(ok_a).to_degrees();
    if h < 0.0 {
        h += 360.0;
    }

    Oklch { l: ok_l, c, h }
}

// --- Other formats to RGB ---

pub fn hsl_to_rgb(hsl: Hsl) -> Rgb {
    let h = hsl.h % 360.0;
    let s = hsl.s / 100.0;
    let l = hsl.l / 100.0;

    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = l - c / 2.0;

    let (r1, g1, b1) = if h >= 0.0 && h < 60.0 {
        (c, x, 0.0)
    } else if h >= 60.0 && h < 120.0 {
        (x, c, 0.0)
    } else if h >= 120.0 && h < 180.0 {
        (0.0, c, x)
    } else if h >= 180.0 && h < 240.0 {
        (0.0, x, c)
    } else if h >= 240.0 && h < 300.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
    };

    Rgb {
        r: ((r1 + m) * 255.0).round() as u8,
        g: ((g1 + m) * 255.0).round() as u8,
        b: ((b1 + m) * 255.0).round() as u8,
    }
}

pub fn lab_to_rgb(lab: Lab) -> Rgb {
    let mut y = (lab.l + 16.0) / 116.0;
    let mut x = lab.a / 500.0 + y;
    let mut z = y - lab.b / 200.0;

    let delta = 6.0 / 29.0;
    let delta_squared = delta * delta;

    x = f_inverse(x, delta, delta_squared);
    y = f_inverse(y, delta, delta_squared);
    z = f_inverse(z, delta, delta_squared);

    // Scale by D65
    x *= 95.047;
    y *= 100.0;
    z *= 108.883;

    // Convert XYZ to RGB
    x /= 100.0;
    y /= 100.0;
    z /= 100.0;

    let mut r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let mut g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let mut b = x * 0.0557 + y * -0.204 + z * 1.057;

    r = gamma_correction(r);
    g = gamma_correction(g);
    b = gamma_correction(b);

    r = clamp(r, 0.0, 1.0) * 255.0;
    g = clamp(g, 0.0, 1.0) * 255.0;
    b = clamp(b, 0.0, 1.0) * 255.0;

    Rgb {
        r: r.round() as u8,
        g: g.round() as u8,
        b: b.round() as u8,
    }
}

pub fn lch_to_rgb(lch: Lch) -> Rgb {
    let h_rad = lch.h.to_radians();
    let a = lch.c * h_rad.cos();
    let b_lab = lch.c * h_rad.sin();

    let mut y = (lch.l + 16.0) / 116.0;
    let mut x = a / 500.0 + y;
    let mut z = y - b_lab / 200.0;

    let delta = 6.0 / 29.0;
    let delta_squared = delta * delta;

    x = f_inverse(x, delta, delta_squared);
    y = f_inverse(y, delta, delta_squared);
    z = f_inverse(z, delta, delta_squared);

    x *= 95.047;
    y *= 100.0;
    z *= 108.883;

    x /= 100.0;
    y /= 100.0;
    z /= 100.0;

    let mut r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let mut g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let mut b = x * 0.0557 + y * -0.204 + z * 1.057;

    r = gamma_correction(r);
    g = gamma_correction(g);
    b = gamma_correction(b);

    r = clamp(r, 0.0, 1.0) * 255.0;
    g = clamp(g, 0.0, 1.0) * 255.0;
    b = clamp(b, 0.0, 1.0) * 255.0;

    Rgb {
        r: r.round() as u8,
        g: g.round() as u8,
        b: b.round() as u8,
    }
}

pub fn oklch_to_rgb(oklch: Oklch) -> Rgb {
    let h_rad = oklch.h.to_radians();
    let a = oklch.c * h_rad.cos();
    let b_oklab = oklch.c * h_rad.sin();

    // OKLab -> LMS (cubed)
    let l_ = oklch.l + 0.3963377774 * a + 0.2158037573 * b_oklab;
    let m_ = oklch.l - 0.1055613458 * a - 0.0638541728 * b_oklab;
    let s_ = oklch.l - 0.0894841775 * a - 1.291485548 * b_oklab;

    let l3 = l_ * l_ * l_;
    let m3 = m_ * m_ * m_;
    let s3 = s_ * s_ * s_;

    let r_lin = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    let g_lin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    let b_lin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

    let mut r = linear_to_srgb(r_lin);
    let mut g = linear_to_srgb(g_lin);
    let mut b = linear_to_srgb(b_lin);

    r = clamp(r, 0.0, 1.0) * 255.0;
    g = clamp(g, 0.0, 1.0) * 255.0;
    b = clamp(b, 0.0, 1.0) * 255.0;

    Rgb {
        r: r.round() as u8,
        g: g.round() as u8,
        b: b.round() as u8,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rgb_to_hex() {
        assert_eq!(rgb_to_hex(Rgb { r: 192, g: 128, b: 129 }), "#c08081");
        assert_eq!(rgb_to_hex(Rgb { r: 0, g: 0, b: 0 }), "#000000");
        assert_eq!(rgb_to_hex(Rgb { r: 255, g: 255, b: 255 }), "#ffffff");
        assert_eq!(rgb_to_hex(Rgb { r: 255, g: 0, b: 0 }), "#ff0000");
    }

    #[test]
    fn test_rgb_to_hsl_example() {
        let hsl = rgb_to_hsl(Rgb { r: 192, g: 128, b: 129 });
        assert!((hsl.h - 359.06).abs() < 0.01, "h: {}", hsl.h);
        assert!((hsl.s - 33.68).abs() < 0.01, "s: {}", hsl.s);
        assert!((hsl.l - 62.75).abs() < 0.01, "l: {}", hsl.l);
    }

    #[test]
    fn test_rgb_to_lab_example() {
        let lab = rgb_to_lab(Rgb { r: 192, g: 128, b: 129 });
        assert!((lab.l - 60.10).abs() < 0.01, "l: {}", lab.l);
        assert!((lab.a - 24.90).abs() < 0.01, "a: {}", lab.a);
        assert!((lab.b - 9.63).abs() < 0.01, "b: {}", lab.b);
    }

    #[test]
    fn test_rgb_to_lch_example() {
        let lch = rgb_to_lch(Rgb { r: 192, g: 128, b: 129 });
        assert!((lch.l - 60.10).abs() < 0.01, "l: {}", lch.l);
        assert!((lch.c - 26.70).abs() < 0.01, "c: {}", lch.c);
        assert!((lch.h - 21.15).abs() < 0.01, "h: {}", lch.h);
    }

    #[test]
    fn test_rgb_to_oklch_example() {
        let oklch = rgb_to_oklch(Rgb { r: 192, g: 128, b: 129 });
        assert!((oklch.l - 0.6655).abs() < 0.001, "l: {}", oklch.l);
        assert!((oklch.c - 0.0797).abs() < 0.001, "c: {}", oklch.c);
        assert!((oklch.h - 18.38).abs() < 0.1, "h: {}", oklch.h);
    }

    #[test]
    fn test_hsl_to_rgb_pure_red() {
        let rgb = hsl_to_rgb(Hsl { h: 0.0, s: 100.0, l: 50.0 });
        assert_eq!(rgb.r, 255);
        assert_eq!(rgb.g, 0);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn test_hsl_to_rgb_pure_green() {
        let rgb = hsl_to_rgb(Hsl { h: 120.0, s: 100.0, l: 50.0 });
        assert_eq!(rgb.r, 0);
        assert_eq!(rgb.g, 255);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn test_lab_to_rgb_black() {
        let rgb = lab_to_rgb(Lab { l: 0.0, a: 0.0, b: 0.0 });
        assert_eq!(rgb.r, 0);
        assert_eq!(rgb.g, 0);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn test_lab_to_rgb_white() {
        let rgb = lab_to_rgb(Lab { l: 100.0, a: 0.0, b: 0.0 });
        assert_eq!(rgb.r, 255);
        assert_eq!(rgb.g, 255);
        assert_eq!(rgb.b, 255);
    }

    #[test]
    fn test_lch_to_rgb_black() {
        let rgb = lch_to_rgb(Lch { l: 0.0, c: 0.0, h: 0.0 });
        assert_eq!(rgb.r, 0);
        assert_eq!(rgb.g, 0);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn test_oklch_to_rgb_black() {
        let rgb = oklch_to_rgb(Oklch { l: 0.0, c: 0.0, h: 0.0 });
        assert_eq!(rgb.r, 0);
        assert_eq!(rgb.g, 0);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn test_oklch_to_rgb_white() {
        let rgb = oklch_to_rgb(Oklch { l: 1.0, c: 0.0, h: 0.0 });
        assert_eq!(rgb.r, 255);
        assert_eq!(rgb.g, 255);
        assert_eq!(rgb.b, 255);
    }
}
