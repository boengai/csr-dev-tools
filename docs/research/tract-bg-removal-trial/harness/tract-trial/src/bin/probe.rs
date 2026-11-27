//! Native probe: load a model and time one run on a constant tensor.
use std::time::Instant;
use tract_trial::Segmenter;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let bytes = std::fs::read(&args[1]).expect("read model");
    let (h, w): (usize, usize) = (args[2].parse().unwrap(), args[3].parse().unwrap());
    let t = Instant::now();
    let seg = Segmenter::new(&bytes).unwrap_or_else(|e| panic!("load: {e}"));
    println!("load+optimise {:?}", t.elapsed());
    let input = vec![0.1f32; 3 * h * w];
    for i in 0..3 {
        let t = Instant::now();
        let out = seg.run(&input, h, w).unwrap_or_else(|e| panic!("run: {e}"));
        let (mn, mx) = out.iter().fold((f32::MAX, f32::MIN), |a, &x| (a.0.min(x), a.1.max(x)));
        println!("run {i} {:?} len {} min {mn} max {mx}", t.elapsed(), out.len());
    }
}
