//! tract-onnx candidate for issue 44: MODNet inference only.
//!
//! Pre- and post-processing resizes run through OffscreenCanvas in the
//! worker (as transformers.js does on `main`); this crate takes the
//! normalised CHW float tensor and returns the raw 1×H×W mask.
//!
//! tract cannot infer MODNet's scale-0.5 Resize over symbolic H/W, so the
//! parsed model is kept and a concrete plan is optimised per input size;
//! the last plan is cached.

use std::cell::RefCell;
use std::sync::Arc;
use tract_onnx::prelude::*;

pub struct Segmenter {
    model: InferenceModel,
    plan: RefCell<Option<((usize, usize), Arc<TypedSimplePlan>)>>,
}

fn err(e: impl std::fmt::Debug) -> String {
    format!("{e:?}")
}

impl Segmenter {
    /// Parse the ONNX model. Optimisation waits for the first input size.
    pub fn new(model_bytes: &[u8]) -> Result<Self, String> {
        let mut reader = std::io::Cursor::new(model_bytes);
        let model = tract_onnx::onnx().model_for_read(&mut reader).map_err(err)?;
        Ok(Self { model, plan: RefCell::new(None) })
    }

    fn plan_for(&self, h: usize, w: usize) -> Result<Arc<TypedSimplePlan>, String> {
        // A zero dimension makes tract abort inside optimisation (a trap in
        // wasm), so reject it here.
        if h == 0 || w == 0 {
            return Err(format!("empty input {h}x{w}"));
        }
        if let Some((shape, plan)) = &*self.plan.borrow() {
            if *shape == (h, w) {
                return Ok(plan.clone());
            }
        }
        let plan = self
            .model
            .clone()
            .with_input_fact(0, f32::fact([1, 3, h, w]).into())
            .and_then(|m| m.into_optimized())
            .and_then(|m| m.into_runnable())
            .map_err(err)?;
        *self.plan.borrow_mut() = Some(((h, w), plan.clone()));
        Ok(plan)
    }

    /// Build (or reuse) the plan for an input size without running it.
    pub fn prepare(&self, h: usize, w: usize) -> Result<(), String> {
        self.plan_for(h, w).map(|_| ())
    }

    /// `chw` is the normalised tensor, 3·h·w floats. Returns h·w mask values.
    pub fn run(&self, chw: &[f32], h: usize, w: usize) -> Result<Vec<f32>, String> {
        if h == 0 || w == 0 || chw.len() != 3 * h * w {
            return Err(format!("bad tensor: len {} for {h}x{w}", chw.len()));
        }
        let plan = self.plan_for(h, w)?;
        let input = tract_ndarray::Array4::from_shape_vec((1, 3, h, w), chw.to_vec()).map_err(err)?;
        let out = plan.run(tvec!(Tensor::from(input).into_tvalue())).map_err(err)?;
        let view = out[0].to_plain_array_view::<f32>().map_err(err)?;
        if view.len() != h * w {
            return Err(format!("unexpected output shape {:?}", view.shape()));
        }
        Ok(view.iter().copied().collect())
    }
}

/// transformers.js `rescale` + `normalize` (mean = std = 0.5), with the same
/// f64-then-f32 rounding a JS Float32Array gets, laid out CHW. `rgba` is
/// already resized to the model input size; alpha is ignored (`rgb()`).
pub fn preprocess(rgba: &[u8], h: usize, w: usize) -> Result<Vec<f32>, String> {
    if rgba.len() != 4 * h * w {
        return Err(format!("bad rgba: len {} for {h}x{w}", rgba.len()));
    }
    let plane = h * w;
    let mut chw = vec![0f32; 3 * plane];
    for p in 0..plane {
        for c in 0..3 {
            let x = (f64::from(rgba[4 * p + c]) * 0.00392156862745098) as f32;
            chw[c * plane + p] = ((f64::from(x) - 0.5) / 0.5) as f32;
        }
    }
    Ok(chw)
}

/// transformers.js image-segmentation post-processing: sigmoid only if the
/// output leaves [0, 1], then `mul_(255)` (f32) and `to('uint8')`
/// (`Uint8Array.from`: truncate toward zero, modulo 256).
pub fn postprocess(mask: &mut [f32]) -> Vec<u8> {
    const EPS: f32 = 1e-5;
    if mask.iter().any(|&x| x < -EPS || x > 1.0 + EPS) {
        for x in mask.iter_mut() {
            *x = (1.0 / (1.0 + (-f64::from(*x)).exp())) as f32;
        }
    }
    mask.iter()
        .map(|&x| {
            let v = (f64::from(x) * 255.0) as f32;
            (f64::from(v).trunc() as i64).rem_euclid(256) as u8
        })
        .collect()
}

impl Segmenter {
    /// Pre-process, infer and post-process one model-sized RGBA image.
    pub fn segment(&self, rgba: &[u8], h: usize, w: usize) -> Result<Vec<u8>, String> {
        let chw = preprocess(rgba, h, w)?;
        let mut mask = self.run(&chw, h, w)?;
        Ok(postprocess(&mut mask))
    }
}

#[cfg(target_arch = "wasm32")]
mod web {
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    pub struct WasmSegmenter(super::Segmenter);

    #[wasm_bindgen]
    impl WasmSegmenter {
        #[wasm_bindgen(constructor)]
        pub fn new(model_bytes: &[u8]) -> Result<WasmSegmenter, JsError> {
            console_error_panic_hook::set_once();
            super::Segmenter::new(model_bytes).map(WasmSegmenter).map_err(|e| JsError::new(&e))
        }

        pub fn prepare(&self, h: usize, w: usize) -> Result<(), JsError> {
            self.0.prepare(h, w).map_err(|e| JsError::new(&e))
        }

        pub fn segment(&self, rgba: &[u8], h: usize, w: usize) -> Result<Vec<u8>, JsError> {
            self.0.segment(rgba, h, w).map_err(|e| JsError::new(&e))
        }

        pub fn run(&self, chw: &[f32], h: usize, w: usize) -> Result<Vec<f32>, JsError> {
            self.0.run(chw, h, w).map_err(|e| JsError::new(&e))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Expected values come from transformers.js's own arithmetic, run in
    // Node: Float32Array `*= rescale_factor`, `(x - mean) / std`, `*= 255`,
    // then `Uint8Array.from`.
    #[test]
    fn preprocess_matches_js_float32_rounding() {
        let rgba = [0, 1, 128, 9, 255, 0, 0, 0];
        let chw = preprocess(&rgba, 1, 2).unwrap();
        // CHW: R plane [0, 255], G plane [1, 0], B plane [128, 0].
        assert_eq!(chw, vec![-1.0, 1.0, -0.99215686, -1.0, 0.003921628, -1.0]);
    }

    #[test]
    fn postprocess_truncates_like_uint8array_from() {
        let mut mask = [0.0, 0.5, 0.999, 1.0, 0.00392];
        assert_eq!(postprocess(&mut mask), vec![0, 127, 254, 255, 0]);
    }

    #[test]
    fn postprocess_applies_sigmoid_only_outside_unit_range() {
        let mut mask = [0.0, 2.0];
        assert_eq!(postprocess(&mut mask), vec![127, 224]);
    }

    #[test]
    fn rejects_bad_sizes() {
        assert!(preprocess(&[0; 4], 1, 2).is_err());
    }
}
